# POSTMORTEM.md — Reflection & Improvements

**Project:** Airman — Multi-tenant flight school management system
**Timeline:** Feb 25, 2026 (7:21 PM) → Feb 28, 2026
**Outcome:** Core system deployed and functional. Auth, tenancy, roles, courses, quiz, CI/CD all working in production. Booking backend complete but frontend UI not finished.

---

## What Went Well

### 1. Multi-tenancy architecture held up
The tenant isolation pattern — scoping every query by `tenantId`, resolving tenants from slug on every request — worked correctly and cleanly. No cross-tenant data leakage was ever observed during testing. The design decision to put `tenantId` on every model from the start paid off.

### 2. Test coverage caught real bugs
The existing integration tests for auth and bookings were genuinely useful. When I fixed the auth middleware, the integration tests immediately confirmed the fix was correct without needing manual Postman testing. The unit tests for quiz scoring also validated the service logic independently. Having tests from day one made the CI/CD setup feel natural rather than bolted on.

### 3. CI/CD setup was smooth
GitHub Actions with Postgres and Redis service containers worked first try. The pipeline catches lint errors, runs unit tests, spins up a real database for integration tests, and only deploys to Railway + Vercel after everything passes. This gives real confidence that `main` is always in a deployable state.

### 4. Railway + Vercel deployment pair worked well
Railway's automatic `DATABASE_URL` and `REDIS_URL` injection is clean. Once the `env.js` was updated to parse connection strings instead of individual vars, deployment was stable. Vercel handled the Next.js build with zero configuration.

---

## What Went Wrong

### 1. camelCase / snake_case mismatch cost ~6 hours
This was the single biggest time sink of the entire project. The Sequelize models use `underscored: true` (so the DB has `first_name`, `tenant_id`, etc.) but return camelCase in JavaScript (`firstName`, `tenantId`). The frontend was written expecting snake_case throughout. The result was dozens of `undefined` values silently failing across every page.

**Root cause:** No shared type contract between backend and frontend. The backend API response shape was never formally defined, so the frontend author guessed at field names.

**What I'd do differently:** Define a `types/api.ts` shared contract on day one and write a thin API response serializer on the backend that explicitly shapes every response. Never rely on ORM field name inference bleeding through to the client.

### 2. Booking UI didn't get built
The backend booking system is complete and tested. But by the time Day 3 arrived, the remaining time was consumed by the quiz editor UI, CI/CD setup, and deployment debugging. The booking frontend was the most complex remaining UI piece and couldn't be squeezed in.

**What I'd do differently:** Timebox the deployment work more aggressively. CI/CD and deployment configuration took about 4 hours total — longer than expected due to Railway's SSL requirement and the YAML syntax error. I should have had a hard stop at 2 hours for deployment work and used the remaining time on the booking UI.

### 3. YAML inline `node -e` in GitHub Actions
The CI pipeline initially used `node -e "..."` inline scripts in the YAML, which caused a parse error when pasting into GitHub's workflow editor. This was a 30-minute distraction.

**What I'd do differently:** Always use external script files for anything beyond a one-liner in CI YAML. Never write multi-line `node -e` strings in Actions steps.

### 4. Railway free tier Redis and BullMQ
The BullMQ escalation queue code is written and called correctly, but Railway's free Redis doesn't persist jobs reliably between restarts. The escalation worker also needed to be a separate service, which added deployment complexity I didn't account for in the time plan.

**What I'd do differently:** Either use Upstash Redis (designed for serverless/ephemeral environments) or simply disable the escalation queue gracefully in environments where it's not configured, rather than having it fail silently.

### 5. No `.env.example` committed to the repo
The repo has a `.gitignore` that correctly excludes `.env` files, but there's no `.env.example` documenting all required variables. Anyone cloning the repo has to reverse-engineer the `env.js` to figure out what's needed.

**What I'd do differently:** Commit a `.env.example` on day one. Takes 5 minutes and saves hours of confusion for anyone trying to run the project.

---

## If I Had One More Week

In priority order:

1. **Complete the booking frontend UI** — student booking flow, instructor availability calendar, admin booking management dashboard. This is the highest-value incomplete feature and the backend is already done.

2. **Fix the escalation queue** — move to Upstash Redis and set up the BullMQ worker as a separate Railway service with its own `railway.toml`. This is important for the business logic correctness of the approval workflow.

3. **Add a shared API type layer** — define all API response shapes in a shared `types/` directory. Generate or manually maintain a contract so backend and frontend never drift apart on field names again.

4. **Student progress tracking** — add `LessonCompletion` model, track which lessons each student has finished, show progress bars on the course detail page.

5. **Email notifications** — integrate Resend for booking confirmation, approval notifications, and quiz completion emails. The BullMQ queue is already there to process them.

6. **Admin analytics dashboard** — booking volume charts, enrollment trends, course pass rates. `recharts` is already installed in the frontend.

7. **End-to-end tests with Playwright** — the CI pipeline has unit and integration tests but no browser-level tests. A small Playwright suite covering the auth flow, course enrollment, and quiz submission would catch regressions that the API tests miss.

---

## Lessons for Next Time

- **Define the API contract before writing any frontend.** Even a simple `GET /courses` response type written in TypeScript on day one would have prevented 6 hours of field name debugging.
- **Time-box deployment.** CI/CD and hosting config is important but can become a rabbit hole. Hard limit: 2 hours. If it's not working by then, commit a working local setup and move on.
- **Commit `.env.example` first.** Always.
- **Write the README before you start, not after.** Forces you to think through the setup steps clearly and often catches missing pieces before they become blockers.
- **Stub UIs before building real ones.** A simple "Bookings coming soon" page with the backend wired up is better than a missing route that 404s in production.
