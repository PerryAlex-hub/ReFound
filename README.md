# ReFound

**A campus lost & found management system.**

ReFound replaces the scattered WhatsApp groups and physical notice boards that campuses rely on today with a single, searchable platform for reporting lost items, registering found ones, and returning property to its owner through a verified claim process.

---

## Why

Losing something on campus is common. Getting it back is not.

Reports live in informal group chats where they scroll away within hours, or on notice boards nobody walks past twice. There is no way to search them, no way to systematically match a lost report against a found one, and no safe way for a finder and an owner to reach each other. Items go unrecovered even when *both* parties have reported them — they simply never find out about each other.

ReFound closes that gap with three things a group chat cannot offer:

- **A searchable, structured record** of every lost and found report on campus
- **Automatic matching** that surfaces likely pairs instead of relying on people to spot them
- **Verified handover**, so contact details are exchanged only after an administrator has confirmed ownership

---

## How it works

1. **Report a loss.** A student logs what they lost, roughly where and when.
2. **Report a find.** A student who picks something up registers it — and answers one private question: *what would only the real owner know about this item?*
3. **Match.** The system scores new reports against the opposite pool using category, time plausibility, location proximity, and text similarity, then notifies likely owners.
4. **Claim.** The owner submits a claim describing the item's distinguishing features, with optional proof.
5. **Verify.** An administrator compares the claimant's description against the finder's private answer and approves or rejects, with a recorded reason.
6. **Hand over.** On approval, both parties receive each other's contact details and arrange the return directly. Both confirm when it's done.

Listings are shown publicly in deliberately non-specific form — enough for an owner to recognise their own property, not enough for anyone else to fake a claim. Contact details are never public.

---

## Features

**For students**
- Report lost and found items with category, location, date, and photos
- Browse, search, and filter all active reports
- Automatic match notifications by email
- Submit ownership claims with supporting evidence
- Personal dashboard for reports, claims, and matches

**For administrators**
- Claim review queue with side-by-side evidence comparison
- Approve, reject, or request more information — every action logged with a reason
- Item moderation and abuse handling
- Append-only audit trail of every state change
- Recovery-rate and activity reporting

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend | Java 21, Spring Boot 4, Spring Security, Spring Data JPA |
| Database | PostgreSQL, hosted on [Neon](https://neon.tech) |
| Auth | JWT access + refresh tokens, email-verified accounts |
| Migrations | Flyway |
| Build | Maven Wrapper (backend), npm (frontend) |

PostgreSQL is doing real work here, not just storage. Trigram similarity (`pg_trgm`) powers fuzzy description matching, full-text search backs the browse view, and `JSONB` holds category-specific attributes — a laptop has a serial number, a bag does not — without an unwieldy schema.

---

## Architecture

```
┌─────────────────┐        REST / JSON        ┌──────────────────┐
│   Next.js app   │ ────────────────────────► │  Spring Boot API │
│   (frontend)    │ ◄──────────────────────── │    (backend)     │
└─────────────────┘                           └────────┬─────────┘
                                                       │ JDBC
                                              ┌────────▼─────────┐
                                              │  Neon PostgreSQL │
                                              └──────────────────┘
```

The frontend is a pure client of the API — no direct database access. Matching, verification, and all authorization decisions live in the backend.

```
ReFound/
├── backend/     Spring Boot API
├── frontend/    Next.js application
└── README.md
```

---

## Getting started

### Prerequisites

- **Java 21** (Temurin LTS recommended), with `JAVA_HOME` set
- Maven is *not* required — the repo ships the Maven Wrapper (`./mvnw`)
- **Node.js 20+**
- A **Neon** project (free tier is sufficient) — or any PostgreSQL 16+ instance

### 1. Database

Create a project at [neon.tech](https://neon.tech) and copy the connection string. Neon supports database branching, which is useful for giving each contributor an isolated schema to work against.

### 2. Backend

```bash
cd backend
cp .env.example .env     # then fill in the values below
./mvnw spring-boot:run
```

The API starts on `http://localhost:8080`. Flyway applies migrations automatically on first run.

**Environment variables**

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon JDBC URL (must include `?sslmode=require`) |
| `DATABASE_USER` | Database username |
| `DATABASE_PASSWORD` | Database password |
| `JWT_SECRET` | Signing secret for access tokens |
| `JWT_EXPIRY_MINUTES` | Access token lifetime |
| `MAIL_HOST` / `MAIL_PORT` | SMTP server for notifications |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | SMTP credentials |
| `STORAGE_BUCKET_URL` | Object storage endpoint for item photos |

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

The app starts on `http://localhost:3000`.

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend base URL, e.g. `http://localhost:8080/api` |

---

## Design decisions

A few choices that are easy to misread as arbitrary:

- **Accounts are required to post.** The finder holds the item until handover, so they must be reachable and accountable. Anonymous posting breaks the return.
- **One verified email, and it's a personal one.** Institutional inboxes are rarely read, and requiring one locks out any student whose account was never activated. A single verified personal address is the login identity and the notification channel. It must be verified before an account can claim or post a found item, because that address carries the contact release — an unchecked typo would send one student's phone number to a stranger. Matric number and phone number are unique per account, so a single person cannot hold several.
- **Listings are vague on purpose.** A clear photo and full description of a phone lets anyone claim it convincingly. High-value categories hide their photos until a claim is approved.
- **The verification question is one field, asked once.** It exists so that ownership review compares two independent pieces of evidence rather than relying on an administrator's judgement.
- **Contact is released both ways.** The finder needs to reach the owner as much as the reverse; one-way release strands them.
- **Every state change is logged immutably.** Claims are contestable by nature, so the record of who approved what, when, and why has to be permanent.

---

## Contributing

1. Branch from `main` using `feature/<short-description>`
2. Keep backend and frontend changes in separate commits where practical
3. Run `./mvnw test` and `npm run lint` before opening a pull request
4. Database changes go through a new Flyway migration — never edit an applied one

---

## License

MIT — see [LICENSE](LICENSE).

---