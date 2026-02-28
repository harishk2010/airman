# PLAN.md — Time Blocks & Prioritization

## Assignment Context

- **Received:** February 25, 2026 at 7:21 PM
- **Deadline:** ~72 hours (February 28, 2026)
- **Project:** Airman — Multi-tenant flight school management system
- **Stack:** Node.js/Express + PostgreSQL + Redis (backend), Next.js 14 + TypeScript (frontend)

---

## Prioritization Framework

Given the 72-hour window, features were prioritized using a **must-have / should-have / won't-have** model based on the spec requirements:

| Priority | Criteria |
|----------|----------|
| P0 — Must Have | Core system works end-to-end; auth, tenancy, role enforcement |
| P1 — Should Have | Booking system, course management, CI/CD |
| P2 — Nice to Have | Full booking UI, advanced quiz features, email notifications |
| Cut | Anything not testable within time or dependent on incomplete P0s |

---

## Time Block Breakdown

### Day 1 — Feb 25 (7:21 PM) to Feb 26 (EOD)
**Focus: Codebase audit + critical bug triage**

- **7:21 PM – 10:00 PM** — Initial project setup, read all spec requirements, unzip and audit codebase structure
- **10:00 PM – 12:00 AM** — Identified 10+ critical bugs blocking all functionality:
  - Rate limiter crashing on startup (missing `store` config)
  - Auth middleware not extracting tenant from request correctly
  - Registration returning 500 due to field name mismatch (`firstName` vs `first_name`)
  - JWT refresh token flow broken
  - Admin approval endpoint returning 404
  - Tenant resolution logic failing silently

**Deliverable:** Full bug list catalogued, priority order established

---

### Day 2 — Feb 27 (Full Day)
**Focus: Backend fixes + frontend field name consistency**

- **Morning (9:00 AM – 1:00 PM)** — Fixed all P0 backend bugs:
  - Rate limiter store fixed (MemoryStore)
  - Auth middleware tenant extraction corrected
  - Registration/login flow working end-to-end
  - Role-based access control verified (ADMIN / INSTRUCTOR / STUDENT)
  - Multi-tenancy isolation confirmed (tenant_id scoping on all queries)

- **Afternoon (1:00 PM – 6:00 PM)** — Frontend camelCase/snake_case field name fixes:
  - `layout-app.tsx` — user profile fields
  - `courses/page.tsx` — course listing, publish toggle
  - `courses/[id]/page.tsx` — complete rewrite with `unwrap()` helper, QuizPlayer, lesson loading

- **Evening (6:00 PM – 10:00 PM)** — Course management backend:
  - Fixed `course.routes.js` — corrected nested route structure for modules/lessons/questions
  - Fixed `course.service.js` — model field names (`question` not `questionText`, `order` not `orderIndex`)
  - Fixed `course.controller.js` — added missing handlers (`updateModule`, `updateLesson`, `getAttempts`)
  - Fixed `course.schema.js` — `submitQuiz` validation schema to accept array format

**Deliverable:** Auth working, courses working, quiz submission working

---

### Day 3 — Feb 28 (Full Day)
**Focus: Course editor UI, CI/CD, deployment**

- **Morning (9:00 AM – 1:00 PM)** — Quiz question editor UI:
  - Built `QuizEditor` component — instructors can add/edit questions inline
  - Built `TextLessonEditor` component — rich text content editing
  - Added edit/view mode toggle per lesson
  - Auto-opens edit mode for empty lessons (red dot indicator)

- **Afternoon (1:00 PM – 5:00 PM)** — CI/CD pipeline:
  - GitHub Actions workflow with 7 jobs: lint → unit tests → integration tests (with Postgres + Redis containers) → migration check → deploy backend → deploy frontend
  - Fixed 3 failing unit tests (booking conflict returns `false` not `null`)
  - Fixed YAML inline `node -e` syntax error — extracted to `db-sync.js` / `db-check.js` scripts

- **Evening (5:00 PM – 10:00 PM)** — Deployment:
  - Backend deployed to Railway (Node.js + PostgreSQL + Redis plugins)
  - Frontend deployed to Vercel
  - Fixed Railway connection errors — `env.js` updated to parse `DATABASE_URL` and `REDIS_URL`
  - Added SSL config for Railway Postgres production connection
  - Fixed TypeScript build error in `audit-logs/page.tsx` (`created_at` type narrowing)
  - Configured GitHub Secrets for automated deploys on push to `main`

**Deliverable:** Fully deployed, CI/CD green, live URLs working

---

## What Was Built vs Spec

| Requirement | Status |
|-------------|--------|
| Multi-tenant architecture | ✅ Complete |
| Role-based access (ADMIN/INSTRUCTOR/STUDENT) | ✅ Complete |
| JWT auth with refresh tokens | ✅ Complete |
| User approval workflow | ✅ Complete |
| Audit logging | ✅ Complete |
| Course/module/lesson management | ✅ Complete |
| Quiz creation and submission | ✅ Complete |
| CI/CD with DB container + quality gates | ✅ Complete |
| Frontend deployed (Vercel) | ✅ Complete |
| Backend deployed (Railway) | ✅ Complete |
| Booking system (full workflow) | ⚠️ Partial — backend logic exists, frontend UI incomplete |
| Instructor scheduling / availability | ❌ Not completed |
| Email notifications | ❌ Cut |
