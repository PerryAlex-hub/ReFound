# ReFound — Backend

The ReFound API. It owns all data, all business rules, and every authorization decision. The Next.js frontend is a pure client: it never touches the database and never decides who is allowed to see what.

This document is the reference for anyone working on the backend. Read it before writing code.

---

## Contents

- [Stack](#stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Domain model](#domain-model)
- [Lifecycles](#lifecycles)
- [API surface](#api-surface)
- [Authentication and authorization](#authentication-and-authorization)
- [Matching engine](#matching-engine)
- [Notifications](#notifications)
- [File storage](#file-storage)
- [Error handling](#error-handling)
- [Database and migrations](#database-and-migrations)
- [Configuration](#configuration)
- [Testing](#testing)
- [Conventions](#conventions)

---

## Stack

| Concern | Choice |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 4.1.x |
| Web | Spring Web MVC (REST, JSON) |
| Security | Spring Security + JWT |
| Persistence | Spring Data JPA / Hibernate |
| Database | PostgreSQL 16 (Neon) |
| Migrations | Flyway |
| Validation | Jakarta Bean Validation |
| Mail | Spring Mail (SMTP) |
| Build | Maven (via the bundled wrapper, `./mvnw`) |
| Testing | JUnit 5, Mockito, Testcontainers |
| API docs | springdoc-openapi 3.x (Swagger UI at `/swagger-ui.html`, dev profile only) |

---

## Architecture

A conventional three-layer flow, one direction only:

```
HTTP request
    │
    ▼
Controller ──── validates input, maps DTO, returns DTO. No business logic.
    │
    ▼
Service ─────── business rules, authorization, transactions, orchestration.
    │
    ▼
Repository ──── data access only. Spring Data interfaces + custom queries.
    │
    ▼
PostgreSQL
```

Rules that keep this from rotting:

- **Entities never leave the service layer.** Controllers accept and return DTOs. If a JPA entity is serialised to JSON, private fields leak — this is how a finder's verification answer or a user's phone number escapes.
- **Controllers contain no `if` statements about business meaning.** Whether a claim may be approved is a service decision, not a controller one.
- **Services own transactions.** `@Transactional` goes on service methods, never on controllers or repositories.
- **Repositories return entities or projections, never DTOs.**

---

## Project structure

Packages are organised **by feature, not by layer**. Four squads work in parallel, and feature packages mean each squad edits its own directory — far fewer merge conflicts than everyone fighting over a shared `controllers/` folder.

```
backend/
├── pom.xml
├── .env.example
├── mvnw / mvnw.cmd
└── src/
    ├── main/
    │   ├── java/net/refound/api/
    │   │   ├── RefoundApplication.java
    │   │   │
    │   │   ├── config/                  Cross-cutting Spring configuration
    │   │   │   ├── SecurityConfig.java
    │   │   │   ├── JwtConfig.java
    │   │   │   ├── CorsConfig.java
    │   │   │   ├── OpenApiConfig.java
    │   │   │   └── AsyncConfig.java
    │   │   │
    │   │   ├── common/                  Shared, feature-agnostic building blocks
    │   │   │   ├── exception/           ApiException, NotFoundException, handler
    │   │   │   ├── response/            ApiResponse, PageResponse, ErrorResponse
    │   │   │   ├── audit/               AuditEvent entity, AuditService
    │   │   │   ├── validation/          Custom validators
    │   │   │   └── util/
    │   │   │
    │   │   ├── auth/                    Registration, login, tokens, verification
    │   │   │   ├── AuthController.java
    │   │   │   ├── AuthService.java
    │   │   │   ├── JwtService.java
    │   │   │   ├── JwtAuthenticationFilter.java
    │   │   │   ├── domain/              RefreshToken, VerificationToken
    │   │   │   ├── repository/
    │   │   │   └── dto/
    │   │   │
    │   │   ├── user/                    Profiles, account state
    │   │   │   ├── UserController.java
    │   │   │   ├── UserService.java
    │   │   │   ├── domain/              User, Role, UserStatus
    │   │   │   ├── repository/
    │   │   │   ├── dto/
    │   │   │   └── mapper/
    │   │   │
    │   │   ├── item/                    Lost and found reports
    │   │   │   ├── ItemController.java
    │   │   │   ├── ItemService.java
    │   │   │   ├── ItemSearchService.java
    │   │   │   ├── domain/              Item, ItemPhoto, ItemType, ItemStatus, Category
    │   │   │   ├── repository/
    │   │   │   ├── dto/
    │   │   │   └── mapper/
    │   │   │
    │   │   ├── claim/                   Claims, review, handover
    │   │   │   ├── ClaimController.java
    │   │   │   ├── ClaimService.java
    │   │   │   ├── domain/              Claim, ClaimEvidence, ClaimStatus
    │   │   │   ├── repository/
    │   │   │   ├── dto/
    │   │   │   └── mapper/
    │   │   │
    │   │   ├── matching/                Scoring and candidate matches
    │   │   │   ├── MatchingService.java
    │   │   │   ├── MatchScorer.java
    │   │   │   ├── scoring/             Individual signal scorers
    │   │   │   ├── domain/              ItemMatch, MatchStatus
    │   │   │   ├── repository/
    │   │   │   └── dto/
    │   │   │
    │   │   ├── location/                Campus location reference data
    │   │   │
    │   │   ├── notification/            Email and in-app notifications
    │   │   │   ├── NotificationService.java
    │   │   │   ├── EmailSender.java
    │   │   │   ├── domain/
    │   │   │   └── template/
    │   │   │
    │   │   ├── storage/                 Photo and evidence uploads
    │   │   │   ├── StorageService.java
    │   │   │   └── dto/
    │   │   │
    │   │   └── admin/                   Admin-only endpoints
    │   │       ├── AdminClaimController.java
    │   │       ├── AdminItemController.java
    │   │       ├── AdminUserController.java
    │   │       ├── AdminStatsController.java
    │   │       └── dto/
    │   │
    │   └── resources/
    │       ├── application.yml
    │       ├── application-dev.yml
    │       ├── application-prod.yml
    │       ├── db/migration/            Flyway: V1__initial_schema.sql, ...
    │       └── templates/email/         HTML email templates
    │
    └── test/
        └── java/net/refound/api/
            ├── auth/
            ├── item/
            ├── claim/
            ├── matching/
            └── support/                 Test fixtures, Testcontainers base class
```

**Squad ownership.** `auth` + `user` → one squad. `item` + `location` + `storage` → one squad. `claim` + `admin` + `common/audit` → one squad. `matching` + `notification` → one squad. `config` and `common` are shared; changes there go through the captain.

---

## Domain model

All primary keys are UUIDs. All tables carry `created_at`; mutable tables also carry `updated_at`.

### User

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `full_name` | text | |
| `matric_number` | text | **unique** |
| `email` | text | **unique**, personal address, login identity |
| `phone_number` | text | **unique**, never public |
| `password_hash` | text | BCrypt |
| `role` | enum | `STUDENT`, `ADMIN` |
| `email_verified` | boolean | gates claiming and posting found items |
| `status` | enum | `ACTIVE`, `SUSPENDED` |

### Item

One table for both lost and found reports, discriminated by `type`. They share every field except the verification answer, and a single table makes matching queries far simpler.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `type` | enum | `LOST`, `FOUND` |
| `status` | enum | see lifecycle below |
| `reporter_id` | UUID | FK → User |
| `category` | enum | `PHONE`, `LAPTOP`, `ID_CARD`, `KEYS`, `BAG`, `BOOK`, `WALLET`, `CLOTHING`, `JEWELLERY`, `OTHER` |
| `title` | text | short label |
| `description` | text | free text |
| `location_id` | UUID | FK → CampusLocation |
| `location_detail` | text | optional, e.g. "second floor, near the stairs" |
| `occurred_on` | date | when lost / when found |
| `attributes` | jsonb | category-specific fields (colour, brand, model, serial) |
| `verification_answer` | text | **FOUND only. Private — admins only, never in any student-facing DTO.** |
| `photos_public` | boolean | false for high-value categories |
| `expires_at` | timestamptz | 90 days from creation |

### ItemPhoto

`id`, `item_id`, `url`, `position`, `created_at`. Separate table so an item can carry several photos.

### CampusLocation

`id`, `name`, `latitude`, `longitude`, `active`. Reference data, seeded by migration.

### Claim

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `found_item_id` | UUID | FK → Item, the item being claimed |
| `lost_item_id` | UUID | FK → Item, nullable — the claimant's own report if one exists |
| `claimant_id` | UUID | FK → User |
| `description` | text | claimant's account of distinguishing features |
| `lost_context` | text | when and where they lost it |
| `status` | enum | see lifecycle below |
| `reviewed_by` | UUID | FK → User (admin), nullable |
| `decision_reason` | text | required on approve and reject |
| `decided_at` | timestamptz | |
| `info_request` | text | question asked in `AWAITING_INFO` |
| `finder_confirmed_at` | timestamptz | handover confirmation |
| `claimant_confirmed_at` | timestamptz | handover confirmation |

### ClaimEvidence

`id`, `claim_id`, `url`, `created_at`. Optional proof uploads.

### ItemMatch

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `lost_item_id` | UUID | FK → Item |
| `found_item_id` | UUID | FK → Item |
| `score` | numeric(4,3) | 0.000–1.000 |
| `breakdown` | jsonb | per-signal contributions, for debugging and explanation |
| `status` | enum | `SUGGESTED`, `DISMISSED`, `CLAIMED` |
| | | unique on (`lost_item_id`, `found_item_id`) |

### AuditEvent

Append-only. No update or delete path exists in code.

`id`, `actor_id` (nullable for system actions), `entity_type`, `entity_id`, `action`, `metadata` (jsonb), `created_at`.

### Notification

`id`, `user_id`, `type`, `payload` (jsonb), `channel`, `sent_at`, `read_at`.

---

## Lifecycles

### Item status

```
                  ┌──────────────► CANCELLED   (reporter withdraws)
                  │
OPEN ─────────────┼──────────────► EXPIRED     (90 days, no activity)
                  │
                  ▼
           CLAIM_PENDING ─────────► OPEN        (all claims rejected)
                  │
                  ▼
              MATCHED ────────────► RETURNED    (both parties confirm)
```

`CLAIM_PENDING` does **not** block further claims — several people may claim the same umbrella, and the admin picks at most one.

### Claim status

```
PENDING ──────────► AWAITING_INFO ──────► PENDING
   │
   ├──────────────► APPROVED ───────────► (contact released)
   ├──────────────► REJECTED
   └──────────────► WITHDRAWN            (claimant backs out)
```

Approving a claim is a single transaction that must: set `Claim.APPROVED`, set the found item to `MATCHED`, set the linked lost item to `MATCHED`, reject all sibling claims on the same item with a reason, write the audit event, and enqueue both contact-release notifications. If any step fails, all of it rolls back.

---

## API surface

Base path `/api`. All responses JSON. Authenticated endpoints expect `Authorization: Bearer <token>`.

### Auth — public

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Create account, send verification email |
| POST | `/auth/verify-email` | Consume verification token |
| POST | `/auth/resend-verification` | Reissue verification email |
| POST | `/auth/login` | Return access + refresh tokens |
| POST | `/auth/refresh` | Exchange refresh token |
| POST | `/auth/logout` | Revoke refresh token |
| POST | `/auth/forgot-password` | Send reset link |
| POST | `/auth/reset-password` | Consume reset token |

### Users — authenticated

| Method | Path | Purpose |
|---|---|---|
| GET | `/users/me` | Current profile |
| PATCH | `/users/me` | Update name, phone, password |
| GET | `/users/me/items` | My reports |
| GET | `/users/me/claims` | My claims |
| GET | `/users/me/matches` | Suggested matches for my lost items |
| GET | `/users/me/notifications` | In-app feed |

### Items — authenticated

| Method | Path | Purpose |
|---|---|---|
| POST | `/items` | Report lost or found |
| GET | `/items` | Browse — filters: `type`, `category`, `locationId`, `dateFrom`, `dateTo`, `q`, `page`, `size`, `sort` |
| GET | `/items/{id}` | Detail (redacted per viewer's rights) |
| PATCH | `/items/{id}` | Edit own report |
| POST | `/items/{id}/cancel` | Withdraw own report |
| POST | `/items/{id}/photos` | Upload photo (multipart) |
| DELETE | `/items/{id}/photos/{photoId}` | Remove photo |
| GET | `/items/{id}/matches` | Candidate matches (reporter only) |
| POST | `/items/{id}/report-abuse` | Flag for moderation |

### Claims — authenticated

| Method | Path | Purpose |
|---|---|---|
| POST | `/claims` | Submit a claim on a found item |
| GET | `/claims/{id}` | Detail (claimant, finder, or admin only) |
| POST | `/claims/{id}/evidence` | Attach proof |
| POST | `/claims/{id}/respond` | Answer an `AWAITING_INFO` request |
| POST | `/claims/{id}/withdraw` | Cancel own claim |
| POST | `/claims/{id}/confirm-handover` | Confirm the item changed hands |

### Reference — authenticated

| Method | Path | Purpose |
|---|---|---|
| GET | `/locations` | Campus locations |
| GET | `/categories` | Categories and their attribute schemas |

### Admin — `ROLE_ADMIN` only

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/claims` | Review queue, filter by status |
| GET | `/admin/claims/{id}` | Full detail **including the finder's verification answer** |
| POST | `/admin/claims/{id}/approve` | Approve, reason required |
| POST | `/admin/claims/{id}/reject` | Reject, reason required |
| POST | `/admin/claims/{id}/request-info` | Ask the claimant a question |
| GET | `/admin/items` | All items including hidden |
| POST | `/admin/items/{id}/hide` | Hide from browse |
| GET | `/admin/users` | User list |
| POST | `/admin/users/{id}/suspend` | Suspend account |
| GET | `/admin/audit` | Audit log, filterable |
| GET | `/admin/stats` | Recovery rate, volumes, review times |

### Response redaction

`GET /items/{id}` returns different shapes to different viewers. This is the single most security-sensitive rule in the codebase:

| Field | Public browser | Reporter | Approved claimant | Admin |
|---|---|---|---|---|
| Title, category, location, date | ✓ | ✓ | ✓ | ✓ |
| Description | ✓ | ✓ | ✓ | ✓ |
| Photos | only if `photos_public` | ✓ | ✓ | ✓ |
| Reporter name | ✗ | ✓ (own) | ✓ | ✓ |
| Reporter phone / email | ✗ | ✓ (own) | ✓ | ✓ |
| `verification_answer` | ✗ | ✓ (own) | ✗ | ✓ |

Enforce this in the mapper, driven by the authenticated principal — never by trusting a query parameter.

---

## Authentication and authorization

**Registration.** Full name, matric number, email, phone, password. Matric, email, and phone are each unique. A verification token is emailed; the account exists but is unverified until consumed.

**Verification gate.** An unverified account may log in, browse, and report a lost item. It may **not** post a found item or submit a claim — both lead to contact release, and an unreachable address there breaks the handover.

**Tokens.** Access token as a JWT, 15 minutes, carrying `sub` (user id), `role`, `emailVerified`. Refresh token opaque and random, 30 days, stored hashed, rotated on every use, revoked on logout.

**Passwords.** BCrypt, strength 12. Never logged, never returned, never in a DTO.

**Authorization layers.**
1. `SecurityConfig` — path-level rules, e.g. `/api/admin/**` requires `ROLE_ADMIN`.
2. `@PreAuthorize` on service methods for role checks.
3. Explicit ownership checks inside services — "is this the claim's claimant, the item's finder, or an admin?" Path-level rules cannot express this, and it is where real access bugs live.

**Admin accounts** are not self-service. They are promoted by database migration or by an existing admin.

---

## Matching engine

Runs whenever an item is created or materially edited, comparing it against all open items of the opposite type.

```
score = 0.30 · category
      + 0.20 · timePlausibility
      + 0.20 · locationProximity
      + 0.20 · textSimilarity
      + 0.10 · attributeOverlap
```

| Signal | Definition |
|---|---|
| `category` | 1.0 exact match, 0.0 otherwise. A mismatch short-circuits the whole comparison — no point scoring a phone against a shoe. |
| `timePlausibility` | 0.0 if `found_at < lost_at` (impossible). Otherwise decays with the gap: 1.0 same day, tapering to 0.2 at 30 days. |
| `locationProximity` | 1.0 same location; otherwise a haversine distance decay over campus coordinates. |
| `textSimilarity` | Postgres `pg_trgm` similarity across title and description. |
| `attributeOverlap` | Fraction of shared `attributes` keys whose values agree. |

Candidates scoring **≥ 0.55** are persisted as `SUGGESTED` and the lost item's reporter is notified. The finder is not notified — they would drown in weak matches.

Weights live in configuration, not code, so they can be tuned without a redeploy. Every match stores its `breakdown`, so any suggestion can be explained after the fact.

---

## Notifications

Every notification is persisted first, then dispatched asynchronously via `@Async`. A failed SMTP call must never fail the request that triggered it.

| Event | Recipient |
|---|---|
| `EMAIL_VERIFICATION` | New user |
| `PASSWORD_RESET` | User |
| `MATCH_FOUND` | Lost-item reporter |
| `CLAIM_SUBMITTED` | Finder |
| `CLAIM_INFO_REQUESTED` | Claimant |
| `CLAIM_APPROVED` | Claimant and finder — **carries contact details** |
| `CLAIM_REJECTED` | Claimant |
| `HANDOVER_REMINDER` | Both, 48h after approval |
| `ITEM_EXPIRING` | Reporter, 7 days before expiry |

---

## File storage

Photos and evidence go to object storage; the database holds URLs only. Never store binary in Postgres.

Constraints: JPEG, PNG, and WebP only; 5 MB per file; magic-byte checked, not trusted by extension; maximum 5 photos per item; filenames are generated, never taken from the client. Evidence uploads are private — served through a signed, expiring URL, not a public one.

---

## Error handling

One `@RestControllerAdvice` produces every error response. Controllers never build error bodies.

```json
{
  "timestamp": "2026-08-04T10:15:30Z",
  "status": 400,
  "error": "VALIDATION_FAILED",
  "message": "Request validation failed",
  "path": "/api/items",
  "fieldErrors": [
    { "field": "category", "message": "must not be null" }
  ]
}
```

| Status | Used for |
|---|---|
| 400 | Malformed request, validation failure |
| 401 | Missing or invalid token |
| 403 | Authenticated but not permitted, including unverified email |
| 404 | Not found — **also used instead of 403 when revealing existence would leak information** |
| 409 | State conflict, e.g. claiming an already-matched item |
| 422 | Business rule violation |
| 429 | Rate limited |
| 500 | Unhandled — logged with a trace id, never leaked to the client |

Error messages must not reveal whether an email is registered. `/auth/login` and `/auth/forgot-password` return the same response either way.

---

## Database and migrations

Flyway, `src/main/resources/db/migration`, named `V<n>__<description>.sql`.

**An applied migration is never edited.** Fix forward with a new one. Editing a migration that has run on someone else's branch breaks their database and costs an afternoon.

Required extensions, enabled in `V1`:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- fuzzy text matching
```

Indexes that matter: `item(type, status, category)` for browse, a GIN trigram index on `item(title, description)` for search, `item(location_id)`, `claim(found_item_id, status)`, and `audit_event(entity_type, entity_id)`.

Neon supports database branching — each contributor should work against their own branch so migrations can be tested without disturbing anyone else.

---

## Configuration

No secrets in source control. `.env.example` lists every key with placeholder values.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon JDBC URL, must include `?sslmode=require` |
| `DATABASE_USER` / `DATABASE_PASSWORD` | Credentials |
| `JWT_SECRET` | Access token signing key |
| `JWT_EXPIRY_MINUTES` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRY_DAYS` | Refresh token lifetime |
| `MAIL_HOST` / `MAIL_PORT` | SMTP server |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | SMTP credentials |
| `MAIL_FROM` | Sender address |
| `STORAGE_BUCKET_URL` / `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` | Object storage |
| `APP_BASE_URL` | Frontend origin, used in email links and CORS |
| `MATCH_SCORE_THRESHOLD` | Minimum score to suggest a match |
| `ITEM_EXPIRY_DAYS` | Default 90 |

Profiles: `dev` (verbose logging, Swagger on), `prod` (Swagger off, minimal logging).

---

## Testing

| Layer | Approach |
|---|---|
| Services | Unit tests with Mockito. Business rules and state transitions. |
| Repositories | `@DataJpaTest` against Testcontainers Postgres — **not H2**, which lacks `pg_trgm` and JSONB. |
| Controllers | `@WebMvcTest` with MockMvc, security enabled. |
| Matching | Plain unit tests over the scorers, with fixture pairs and expected scores. |

Non-negotiable test coverage:

- Claim approval is atomic and rejects sibling claims
- Redaction — a non-admin can never receive `verification_answer`
- An unverified user cannot claim or post a found item
- A user cannot edit, cancel, or read another user's item or claim
- Expired and used tokens are rejected

---

## Conventions

**Naming.** Entities singular (`Item`, `Claim`). Tables singular snake_case (`item`, `claim_evidence`). DTOs suffixed by intent: `CreateItemRequest`, `ItemResponse`, `ItemSummaryResponse`. Services `*Service`, repositories `*Repository`.

**REST.** Plural collection nouns. State changes that are not simple field updates get an action sub-resource — `POST /claims/{id}/approve`, not `PATCH` with a magic status field. Every list endpoint is paginated; nothing returns an unbounded array.

**Dates.** UTC everywhere, `Instant` for timestamps, `LocalDate` for calendar dates. Timezone conversion is the frontend's job.

**Logging.** SLF4J. Never log tokens, passwords, phone numbers, or verification answers.

**Auditing.** Any state change a human could later dispute writes an `AuditEvent` in the same transaction as the change.

**Branches.** `feature/<area>-<description>`, e.g. `feature/claim-approval-flow`. Pull requests target `main` and require one review.
