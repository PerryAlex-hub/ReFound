# ReFound API — Frontend Integration Guide

Everything the Next.js app needs to talk to the backend: endpoints, request and
response shapes, types, and the rules that decide what a given user is allowed
to see.

## Where the API lives

| | URL |
|---|---|
| **Deployed API** | **https://refound-api-doip.onrender.com** |
| Health check | https://refound-api-doip.onrender.com/actuator/health |
| Local development | `http://localhost:8080` |

Point the frontend at the deployed URL:

```env
# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=https://refound-api-doip.onrender.com/api
```

> **The free instance sleeps after 15 minutes idle.** The first request after
> that takes roughly 50 seconds while it wakes, and may time out. It is not
> broken — retry. Wake it before a demo.

### Interactive docs (Swagger UI)

**http://localhost:8080/swagger-ui.html** — run the backend locally on the `dev`
profile:

```bash
cd backend
./mvnw spring-boot:run '-Dspring-boot.run.arguments=--spring.profiles.active=dev'
```

Register through the UI, copy the `accessToken`, paste it into **Authorize**,
and every endpoint becomes clickable with full request and response schemas.

Swagger is **disabled on the deployed instance** — publishing a browsable
catalogue of every endpoint helps anyone probing the service more than it helps
us. To turn it on there anyway, set these two environment variables in Render
(no code change or rebuild needed):

```
SPRINGDOC_API_DOCS_ENABLED   = true
SPRINGDOC_SWAGGER_UI_ENABLED = true
```

It would then be served at
`https://refound-api-doip.onrender.com/swagger-ui/index.html`.

---

## Contents

- [What the system does](#what-the-system-does)
- [Authentication](#authentication)
- [Conventions](#conventions)
- [Errors](#errors)
- [Enums](#enums)
- [Auth endpoints](#auth-endpoints)
- [Users](#users)
- [Items](#items)
- [Photos](#photos)
- [Claims](#claims)
- [Matches](#matches)
- [Notifications](#notifications)
- [Admin](#admin)
- [Visibility rules](#visibility-rules)
- [Not implemented yet](#not-implemented-yet)

---

## What the system does

ReFound is a campus lost-and-found. Students report items they have lost and
items they have found. The backend automatically scores lost reports against
found reports and tells owners about likely matches. When an owner claims an
item, an administrator verifies ownership before either party sees the other's
contact details.

The design turns on three things the frontend has to respect:

1. **Public listings are deliberately vague.** A found phone shows as "black
   smartphone, near the science faculty, 25 Aug" — no photo, no finder, no
   distinguishing detail. That is what stops anyone claiming it convincingly.
2. **The finder records a private verification answer** — something only the
   owner would know. It is never sent to a browsing student. Only the finder
   and administrators ever see it.
3. **Contact details are released only after an administrator approves a
   claim**, and then to both parties at once.

The API enforces all of this server-side. The same endpoint returns different
fields to different callers — the frontend never has to filter anything itself,
and must never rely on doing so.

---

## Authentication

Bearer tokens on every request except `/api/auth/**`.

```http
Authorization: Bearer <accessToken>
```

**Two tokens, different jobs:**

| Token | Lifetime | Notes |
|---|---|---|
| `accessToken` | **15 minutes** (`expiresIn`, in seconds) | A JWT. Sent on every request. |
| `refreshToken` | 30 days | Opaque. Exchanged for a new pair at `/api/auth/refresh`. |

**Refresh tokens rotate.** Every call to `/api/auth/refresh` revokes the token
you presented and issues a new one — store the new value. Presenting a revoked
token is treated as theft and **logs the user out of every device**.

Because the access token lasts fifteen minutes, the API client needs a refresh
interceptor from day one:

```ts
// on 401 → refresh once → retry the original request → otherwise send to login
```

**Roles.** `user.role` is `STUDENT` or `ADMIN`, returned by login and by
`/api/users/me`. Use it to decide what to render. **It is not a security
boundary** — anyone can navigate to `/admin`. The API returns `403` regardless,
which is the real gate.

---

## Conventions

**Content type** `application/json` throughout, except photo upload
(`multipart/form-data`).

**Dates and times**

| Type | Format | Example |
|---|---|---|
| Timestamp (`Instant`) | ISO-8601 UTC | `"2026-08-26T12:48:31.738333Z"` |
| Date (`LocalDate`) | `YYYY-MM-DD` | `"2026-08-25"` |

Timestamps are always UTC. Converting to local time is the frontend's job.

**Ids** are UUID strings.

**Coordinates** are JSON numbers with six decimal places (`6.515500`). They are
optional, but latitude and longitude must be sent **together or not at all** —
sending one alone is a `422`.

**Nulls are omitted.** Responses use `NON_NULL` serialisation, so a field the
caller is not entitled to is *absent from the JSON entirely*, not `null`. Check
with `'field' in response`, or treat `undefined` as "not permitted".

### Pagination

Every list endpoint accepts `page` (0-based), `size` (default 20), and `sort`
(e.g. `sort=createdAt,desc`), and returns:

```json
{
  "content": [ /* ... */ ],
  "page": 0,
  "size": 20,
  "totalElements": 42,
  "totalPages": 3,
  "first": true,
  "last": false
}
```

```ts
interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
```

---

## Errors

One shape for every failure:

```json
{
  "timestamp": "2026-08-26T12:48:05.140Z",
  "status": 422,
  "error": "BUSINESS_RULE_VIOLATION",
  "message": "You cannot claim an item you reported yourself",
  "path": "/api/claims"
}
```

```ts
interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;        // stable code — switch on this, not on `message`
  message: string;      // human-readable, safe to display
  path: string;
  traceId?: string;                              // 500s only
  fieldErrors?: { field: string; message: string }[];   // validation only
}
```

Validation failures list **every** rejected field at once, so a form can show
all its errors in one pass:

```json
{
  "status": 400,
  "error": "VALIDATION_FAILED",
  "message": "Request validation failed",
  "fieldErrors": [
    { "field": "password", "message": "Password must be between 8 and 100 characters" },
    { "field": "email",    "message": "Must be a valid email address" }
  ]
}
```

| Status | `error` codes | Meaning |
|---|---|---|
| 400 | `VALIDATION_FAILED`, `MALFORMED_REQUEST`, `MISSING_PARAMETER`, `INVALID_PARAMETER`, `MISSING_FILE` | Bad request — show field errors |
| 401 | `UNAUTHORIZED`, `INVALID_CREDENTIALS` | No/expired token, or wrong login |
| 403 | `FORBIDDEN` | Logged in, not permitted |
| 404 | `NOT_FOUND` | Missing — **or hidden from you on purpose** |
| 409 | `CONFLICT` | Duplicate email, second claim on the same item |
| 413 | `FILE_TOO_LARGE` | Photo over 5MB |
| 422 | `BUSINESS_RULE_VIOLATION` | Valid request, breaks a domain rule |
| 500 | `INTERNAL_ERROR` | Show `traceId` so it can be found in the logs |

> **404 vs 403.** Where confirming something exists would leak information, the
> API returns `404`. Reading someone else's claim gives `404`, not `403` —
> otherwise the response itself would confirm the claim exists. Treat "not
> found" as "not yours or not there", and don't try to distinguish.

---

## Enums

```ts
type Role = 'STUDENT' | 'ADMIN';

type UserStatus = 'ACTIVE' | 'SUSPENDED';

type ItemType = 'LOST' | 'FOUND';

type ItemStatus =
  | 'OPEN'            // visible in browse
  | 'CLAIM_PENDING'   // at least one claim under review; still claimable
  | 'MATCHED'         // a claim was approved, awaiting handover
  | 'RETURNED'        // both parties confirmed
  | 'EXPIRED'         // 90 days, no activity
  | 'CANCELLED';      // reporter withdrew it

type Category =
  | 'PHONE' | 'LAPTOP' | 'ID_CARD' | 'KEYS' | 'BAG'
  | 'BOOK'  | 'WALLET' | 'CLOTHING' | 'JEWELLERY' | 'OTHER';

type ClaimStatus =
  | 'PENDING'        // in the review queue
  | 'AWAITING_INFO'  // admin asked a question, waiting on the claimant
  | 'APPROVED'       // contact released
  | 'REJECTED'
  | 'WITHDRAWN';

type MatchStatus = 'SUGGESTED' | 'DISMISSED' | 'CLAIMED';

type NotificationType =
  | 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'
  | 'MATCH_FOUND'
  | 'CLAIM_SUBMITTED' | 'CLAIM_INFO_REQUESTED'
  | 'CLAIM_APPROVED'  | 'CLAIM_REJECTED'
  | 'HANDOVER_REMINDER' | 'ITEM_EXPIRING';
```

### Shared types

```ts
interface UserResponse {          // your own profile only
  id: string;
  fullName: string;
  matricNumber: string;
  email: string;
  phoneNumber: string;
  role: Role;
  emailVerified: boolean;
  createdAt: string;
}

interface ContactResponse {       // released only after claim approval
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}

interface ItemPhotoResponse {
  id: string;
  url: string;        // Cloudinary HTTPS URL
  position: number;   // 0-4
}
```

---

## Auth endpoints

All public — no token required.

### `POST /api/auth/register`

Creates an account and logs the user in immediately. There is **no email
verification step** at present.

```ts
interface RegisterRequest {
  fullName: string;      // required, ≤120
  matricNumber: string;  // required, ≤30, unique
  email: string;         // required, valid email, ≤200, unique
  phoneNumber: string;   // required, ^[+]?[0-9\s-]{7,20}$, unique
  password: string;      // required, 8-100
}
```

**`201 Created`** → `AuthResponse`. **`409`** if email, matric or phone is taken.

### `POST /api/auth/login`

```ts
interface LoginRequest { email: string; password: string; }
```

**`200`** → `AuthResponse`

```ts
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;     // seconds, currently 900
  user: UserResponse;
}
```

**`401 INVALID_CREDENTIALS`** for both a wrong password and an unknown email —
identical response by design, so the endpoint cannot be used to discover which
emails are registered. Email matching is case-insensitive.
**`403`** if the account is suspended.

### `POST /api/auth/refresh`

```ts
interface RefreshTokenRequest { refreshToken: string; }
```

**`200`** → `AuthResponse` with a **new refresh token — store it**.
**`401`** if invalid, expired, or already used. Reuse of a spent token revokes
every session for that account.

### `POST /api/auth/logout`

Body: `RefreshTokenRequest`. **`204`** always, even for an unknown token.
Revokes that one session; other devices stay logged in.

---

## Users

### `GET /api/users/me`

**`200`** → `UserResponse`. Includes the caller's own email and phone. This
shape is never used to describe anyone else.

---

## Items

### `POST /api/items`

```ts
interface CreateItemRequest {
  type: ItemType;                 // required
  category: Category;             // required
  title: string;                  // required, ≤120
  description?: string;           // ≤2000
  latitude?: number;              // with longitude or neither
  longitude?: number;
  locationLabel?: string;         // ≤200, e.g. "Main Library"
  locationDetail?: string;        // ≤500, e.g. "second floor, by the stairs"
  occurredOn: string;             // required, YYYY-MM-DD, not future
  attributes?: Record<string, unknown>;   // colour, brand, model, serial…
  verificationAnswer?: string;    // ≤500 — see below
}
```

**`verificationAnswer` is required for `FOUND` and forbidden for `LOST`.**
Prompt the finder with something like *"Name one thing about this item only the
owner would know."* Getting this wrong returns `422`.

The server decides `status`, `expiresAt` (90 days) and photo visibility —
photos stay private for `PHONE`, `LAPTOP`, `WALLET`, `ID_CARD` and `JEWELLERY`.

**`201`** → `ItemDetailResponse`. Creating an item also runs the matcher
immediately, so suggestions may exist by the time the response arrives.

### `GET /api/items`

Browse. All query parameters optional:

| Param | Type | Notes |
|---|---|---|
| `type` | `ItemType` | |
| `status` | `ItemStatus` | Default shows only `OPEN` + `CLAIM_PENDING` |
| `category` | `Category` | |
| `q` | string | Free text over title and description |
| `dateFrom` / `dateTo` | `YYYY-MM-DD` | On `occurredOn` |
| `north`,`south`,`east`,`west` | number | Map viewport — **all four or none** |
| `page`, `size`, `sort` | | Default `size=20`, `sort=createdAt,desc` |

**`200`** → `PageResponse<ItemSummaryResponse>`

```ts
interface ItemSummaryResponse {
  id: string;
  type: ItemType;
  status: ItemStatus;
  category: Category;
  title: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  locationLabel: string | null;
  occurredOn: string;
  thumbnailUrl: string | null;   // null when photos are withheld
  hasPhotos: boolean;            // true even when the thumbnail is withheld
  createdAt: string;
}
```

> `thumbnailUrl: null` with `hasPhotos: true` means a photo exists but is
> withheld for this category. Show something like *"Photo available after
> verification"* rather than implying the finder never took one.

Hidden (moderated) items never appear here.

### `GET /api/items/mine`

**`200`** → `PageResponse<ItemSummaryResponse>` — the caller's own reports.

### `GET /api/items/{id}`

**`200`** → `ItemDetailResponse`. **The response shape depends on who is
asking** — see [Visibility rules](#visibility-rules).

```ts
interface ItemDetailResponse {
  id: string;
  type: ItemType;
  status: ItemStatus;
  category: Category;
  title: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  locationLabel: string | null;
  locationDetail: string | null;
  occurredOn: string;
  attributes: Record<string, unknown>;
  photos: ItemPhotoResponse[];    // empty when withheld
  createdAt: string;
  viewerIsReporter: boolean;      // show edit controls off this

  // Present only for the reporter, admins, or an approved claimant:
  reporter?: ContactResponse;

  // Present only for the reporter and admins — never the claimant:
  verificationAnswer?: string;
}
```

**`404`** if it does not exist, or is hidden and not yours.

### `PATCH /api/items/{id}`

Every field optional; omitted fields are left alone. `type` and `category`
cannot be changed — withdraw and re-file instead.

```ts
interface UpdateItemRequest {
  title?: string;          // ≤120
  description?: string;    // ≤2000
  latitude?: number;
  longitude?: number;
  locationLabel?: string;  // ≤200
  locationDetail?: string; // ≤500
  occurredOn?: string;     // YYYY-MM-DD, not future
  attributes?: Record<string, unknown>;
  verificationAnswer?: string;   // FOUND items only
}
```

**`200`** → `ItemDetailResponse`. **`403`** if not yours.
**`422`** if the item is not `OPEN`. Editing re-runs the matcher.

### `POST /api/items/{id}/cancel`

Withdraw a report — "it was in my bag after all". **`204`**, idempotent.
**`422`** if already returned.

### `POST /api/items/{id}/report-abuse`

```ts
interface ModerationRequest { reason: string; }   // required, 5-500
```

**`204`**. Queues it for a moderator. Nothing is hidden automatically.

---

## Photos

### `POST /api/items/{id}/photos`

`multipart/form-data`, field name **`file`**.

```ts
const form = new FormData();
form.append('file', file);
// do NOT set Content-Type — the browser adds the multipart boundary
```

- JPEG, PNG or WebP, **verified from the file's own bytes** (renaming a `.txt`
  to `.jpg` is rejected)
- 5MB maximum, 5 photos per item
- Owner only, and only while the item is `OPEN`

**`201`** → `ItemDetailResponse` (with the new photo included).
**`422`** wrong type / limit reached · **`413`** too large · **`400`** no file
part · **`403`** not yours.

### `DELETE /api/items/{id}/photos/{photoId}`

**`204`**. Removes it from storage as well as the record.

---

## Claims

### `POST /api/claims`

```ts
interface CreateClaimRequest {
  foundItemId: string;    // required
  lostItemId?: string;    // your own LOST report, if you filed one
  description: string;    // required, 10-1000 — the evidence
  lostContext?: string;   // ≤500, when and where you lost it
}
```

`description` is what an administrator compares against the finder's private
verification answer. Prompt for marks, damage, contents — anything only the
owner would know. Vague claims are rejected, which is intended.

**`201`** → `ClaimDetailResponse`
**`422`** claiming your own item, a `LOST` item, or one no longer claimable
**`409`** you already have a claim under review for this item

Several different people **may** claim the same item; an administrator approves
at most one.

### `GET /api/claims/mine`

**`200`** → `PageResponse<ClaimSummaryResponse>`

```ts
interface ClaimSummaryResponse {
  id: string;
  foundItemId: string;
  itemTitle: string;
  itemCategory: Category;
  status: ClaimStatus;
  decidedAt: string | null;
  createdAt: string;
}
```

### `GET /api/claims/{id}`

Visible to the claimant, the finder, and admins. Anyone else gets **`404`**.

```ts
interface ClaimDetailResponse {
  id: string;
  foundItemId: string;
  itemTitle: string;
  itemCategory: Category;
  status: ClaimStatus;
  description: string;
  lostContext: string | null;
  evidenceUrls: string[];
  infoRequest?: string;       // admin's question
  infoResponse?: string;      // claimant's answer
  decisionReason?: string;
  decidedAt?: string;
  finderConfirmed: boolean;
  claimantConfirmed: boolean;
  viewerRole: 'CLAIMANT' | 'FINDER' | 'ADMIN';

  // ★ The whole point of the system.
  // Present ONLY when status === 'APPROVED' and you are one of the two parties.
  // The claimant receives the finder's details; the finder receives the owner's.
  counterpartContact?: ContactResponse;

  createdAt: string;
}
```

The finder's `verificationAnswer` is **never** returned here, even after
approval.

### `POST /api/claims/{id}/respond`

Answer an administrator's question. Claimant only, and only while
`AWAITING_INFO`.

```ts
interface InfoResponseRequest { answer: string; }   // required, ≤1000
```

**`200`** → `ClaimDetailResponse` (status returns to `PENDING`).

### `POST /api/claims/{id}/withdraw`

**`204`**. Claimant only, open claims only.

### `POST /api/claims/{id}/confirm-handover`

Either party confirming the item changed hands. **Both must confirm** before
the item becomes `RETURNED`.

**`200`** → `ClaimDetailResponse` · **`422`** if the claim is not `APPROVED`.

---

## Matches

Suggestions are hints, not entitlements — acting on one still means filing a
claim and passing the same verification as anyone else.

### `GET /api/matches/mine`

**`200`** → `MatchResponse[]` (an array, not paginated), best first.

```ts
interface MatchResponse {
  id: string;
  score: number;                  // 0.000-1.000
  status: MatchStatus;
  breakdown: Record<string, unknown>;
  lostItemId: string;
  candidate: ItemSummaryResponse;  // the found item
  createdAt: string;
}
```

`breakdown` explains the score, so the UI can say *why* — "same category, found
nearby, two days later":

```json
{
  "category":   { "value": 1.0,   "weight": 0.3 },
  "time":       { "value": 0.972, "weight": 0.2 },
  "location":   { "value": 1.0,   "weight": 0.2 },
  "text":       { "value": 0.591, "weight": 0.2 },
  "attributes": { "value": 1.0,   "weight": 0.1 }
}
```

A signal that could not be judged appears as
`{ "available": false, "weight": 0.2 }` — for example when neither report has
coordinates. Those are dropped and the remaining weights renormalised, so a
report with no map pin is not penalised.

### `GET /api/matches/for-item/{lostItemId}`

**`200`** → `MatchResponse[]` for one lost report. **`404`** if not yours.

### `POST /api/matches/{id}/dismiss`

"Not my item." **`204`**. The report is untouched, and a later rescore will not
bring the suggestion back.

---

## Notifications

In-app only at present — persisted and readable, nothing is emailed.

### `GET /api/notifications`

**`200`** → `PageResponse<NotificationResponse>`, newest first.

```ts
interface NotificationResponse {
  id: string;
  type: NotificationType;
  payload: Record<string, unknown>;  // ids and titles to link from
  readAt: string | null;
  createdAt: string;
}
```

`payload` carries identifiers, never contact details. Typical contents:

| Type | Payload |
|---|---|
| `MATCH_FOUND` | `lostItemId`, `foundItemId`, `foundItemTitle`, `score` |
| `CLAIM_SUBMITTED` | `itemId`, `itemTitle` |
| `CLAIM_INFO_REQUESTED` | `claimId`, `question` |
| `CLAIM_APPROVED` | `claimId`, `role` (`CLAIMANT`/`FINDER`) |
| `CLAIM_REJECTED` | `claimId`, `reason` |
| `ITEM_EXPIRING` | `itemId`, `itemTitle`, `expiresAt`, `action` |

### `GET /api/notifications/unread-count`

**`200`** → `{ "unread": 3 }`

### `POST /api/notifications/{id}/read`

**`204`**. **`404`** if it is not yours.

---

## Admin

Everything under `/api/admin/**` requires `role === 'ADMIN'` and returns
**`403`** otherwise.

### `GET /api/admin/claims`

Review queue, **oldest first** so nobody waits indefinitely.
Query: `status` (default `PENDING`), `page`, `size`.
**`200`** → `PageResponse<ClaimSummaryResponse>`

### `GET /api/admin/claims/{id}`

The review screen. Puts the two pieces of evidence side by side.

```ts
interface AdminClaimReviewResponse {
  id: string;
  status: ClaimStatus;

  foundItemId: string;
  itemTitle: string;
  itemCategory: Category;
  itemDescription: string | null;
  itemLocationLabel: string | null;
  itemPhotoUrls: string[];

  // ★ The comparison the decision rests on
  finderVerificationAnswer: string;   // the private detail the finder recorded
  claimantDescription: string;        // what the claimant says about the item
  claimantLostContext: string | null;
  claimantEvidenceUrls: string[];

  claimantLostItemId?: string;

  finder: ContactResponse;
  claimant: ContactResponse;
  claimantMatricNumber: string;

  infoRequest?: string;
  infoResponse?: string;
  decisionReason?: string;
  decidedAt?: string;
  reviewedByName?: string;
  competingClaims: number;    // other live claims on the same item

  createdAt: string;
}
```

Render `finderVerificationAnswer` and `claimantDescription` beside each other —
the decision is a comparison of two independent statements, not a judgement
call.

### `POST /api/admin/claims/{id}/request-info`

```ts
interface InfoRequestRequest { question: string; }   // required, 5-500
```

**`200`** → `AdminClaimReviewResponse`. Moves the claim to `AWAITING_INFO`.

### `POST /api/admin/claims/{id}/approve`

```ts
interface ClaimDecisionRequest { reason: string; }   // required, 5-1000
```

**`200`** → `AdminClaimReviewResponse`.

One transaction: the claim is approved, both items move to `MATCHED`, **every
competing claim is auto-rejected**, contact details are released to both
parties, and the release is separately audited.

**`422`** if the claim has already been decided.

### `POST /api/admin/claims/{id}/reject`

Body: `ClaimDecisionRequest`. **`200`**. The item returns to `OPEN` if nothing
else is pending on it; the claimant may submit a better-evidenced claim.

### `POST /api/admin/items/{id}/hide` · `/unhide`

`hide` takes `ModerationRequest` (reason required). **`204`**, idempotent.
Hidden items vanish from browse but the reporter can still see their own.

### `GET /api/admin/users`

Query: `q` (matches name, email or matric), `page`, `size`.
**`200`** → `PageResponse<AdminUserResponse>`

```ts
interface AdminUserResponse {
  id: string;
  fullName: string;
  matricNumber: string;
  email: string;
  phoneNumber: string;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
}
```

### `POST /api/admin/users/{id}/suspend` · `/reactivate` · `/promote` · `/demote`

`suspend` takes `ModerationRequest`. All return **`204`**.

Suspension also revokes every active session, so the user is locked out
immediately. Guard rails, all `422`: you cannot suspend or demote yourself, and
an administrator must be demoted before being suspended.

### `GET /api/admin/stats`

```ts
interface AdminStatsResponse {
  totalUsers: number;
  suspendedUsers: number;

  totalItems: number;
  lostReports: number;
  foundReports: number;
  openItems: number;
  returnedItems: number;
  expiredItems: number;

  recoveryRatePercent: number;    // returned ÷ found — the headline number

  claimsByStatus: Record<ClaimStatus, number>;
  medianReviewHours: number | null;

  matchesSuggested: number;
  matchesDismissed: number;
  matchesLeadingToClaims: number;
}
```

---

## Visibility rules

The same item returns different fields to different callers. **The server does
this; the frontend must not attempt it.**

| Field | Browsing student | Reporter | Approved claimant | Admin |
|---|---|---|---|---|
| Title, category, location, date | ✅ | ✅ | ✅ | ✅ |
| Description | ✅ | ✅ | ✅ | ✅ |
| `photos` | only if category allows | ✅ | ✅ | ✅ |
| `reporter` (name, email, phone) | ❌ | ✅ | ✅ | ✅ |
| `verificationAnswer` | ❌ | ✅ | ❌ | ✅ |

And on claims:

| Field | Before approval | After approval |
|---|---|---|
| `counterpartContact` | ❌ absent | ✅ present, both parties |
| Finder's verification answer | ❌ | ❌ still absent |

Absent means **the key is not in the JSON**. Write UI that treats a missing key
as "not permitted", and never assume a field will be there because it was there
for a different user.

---

## Not implemented yet

Plan around these:

- **No email.** No verification, and **no password reset** — a forgotten
  password currently needs a database edit. Accounts are usable immediately
  after registration.
- **Notifications are in-app only.** The rows exist; nothing is sent.
- **The first administrator must be created directly in the database**
  (`update app_user set role='ADMIN' where lower(email)='…'`). After that,
  admins can promote others through the API.
- **No claim evidence upload endpoint.** `ClaimDetailResponse.evidenceUrls` and
  `AdminClaimReviewResponse.claimantEvidenceUrls` exist and will always be
  empty arrays for now.
- **No `GET /api/admin/items`** listing. Moderation works by item id, reached
  from an abuse report or from browse.

---

## Quick start

```bash
# 1. Run the backend
cd backend
./mvnw spring-boot:run '-Dspring-boot.run.arguments=--spring.profiles.active=dev'

# 2. Register a user
curl -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Test User","matricNumber":"240805999",
       "email":"test@example.com","phoneNumber":"08031234567",
       "password":"correct-horse-battery"}'

# 3. Use the accessToken from the response
curl http://localhost:8080/api/users/me -H 'Authorization: Bearer <accessToken>'
```

Or skip all of that and use **http://localhost:8080/swagger-ui.html** — register
through the UI, paste the token into **Authorize**, and every endpoint becomes
clickable with schemas attached.
