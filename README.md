# ✈️ Airman

**Multi-tenant flight school management system** built with Next.js 14, Node.js/Express, PostgreSQL, and Redis.

🌐 **Live Demo:** [airman-nine.vercel.app](https://airman-nine.vercel.app)
🔧 **API:** [zoological-education-production.up.railway.app](https://zoological-education-production.up.railway.app)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Seeding the Database](#seeding-the-database)
- [Running Tests](#running-tests)
- [CI/CD Pipeline](#cicd-pipeline)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Roles & Permissions](#roles--permissions)
- [Multi-Tenancy](#multi-tenancy)

---

## Overview

Airman is a multi-tenant SaaS platform where each flight school (tenant) operates in complete isolation. Admins manage users and bookings, instructors manage courses, and students book lessons and take quizzes — all scoped to their own school's data.

---

## Features

- **Multi-tenant isolation** — every query is scoped by `tenantId`; no cross-school data leakage
- **Role-based access control** — `ADMIN`, `INSTRUCTOR`, `STUDENT` with middleware-enforced permissions
- **JWT authentication** — access tokens (15m) + refresh tokens (7d), stored securely
- **User approval workflow** — admins approve/reject student and instructor registrations
- **Course management** — courses → modules → lessons (TEXT or QUIZ type)
- **Quiz engine** — instructors create multi-choice questions; students take quizzes with instant scoring and review
- **Booking system** — backend fully implemented with conflict detection, instructor assignment, and escalation queue
- **Audit logging** — every significant action is logged with before/after state
- **CI/CD** — GitHub Actions pipeline with lint, unit tests, integration tests (Postgres + Redis containers), migration check, and automated deploy to Railway + Vercel

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, React Hook Form |
| Backend | Node.js, Express.js, Sequelize ORM |
| Database | PostgreSQL 15 |
| Cache / Queue | Redis 7, BullMQ |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Validation | Zod (backend + frontend) |
| Testing | Jest, Supertest |
| CI/CD | GitHub Actions |
| Hosting | Vercel (frontend), Railway (backend + DB + Redis) |

---

## Project Structure

```
airman/
├── .github/
│   └── workflows/
│       └── ci.yml                 # 7-job CI/CD pipeline
├── airman-backend/
│   ├── src/
│   │   ├── config/                # env, db, redis
│   │   ├── controllers/           # route handlers
│   │   ├── middlewares/           # auth, validate, rateLimiter
│   │   ├── models/                # Sequelize models
│   │   ├── routes/                # Express routers
│   │   ├── scripts/               # seed, db-sync, db-check
│   │   ├── services/              # business logic
│   │   ├── tests/
│   │   │   ├── unit/              # jest unit tests
│   │   │   └── integration/       # supertest integration tests
│   │   ├── utils/                 # logger, pagination, etc.
│   │   └── validators/            # zod schemas
│   ├── railway.toml               # Railway deploy config
│   └── package.json
└── airman-frontend/
    ├── src/
    │   ├── app/                   # Next.js App Router pages
    │   │   ├── admin/             # admin panel
    │   │   ├── courses/           # course list + detail
    │   │   ├── bookings/          # booking management
    │   │   └── auth/              # login, register
    │   ├── lib/                   # api client, store, utils
    │   └── types/                 # TypeScript types
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- npm 9+

### Backend Setup

```bash
# 1. Clone the repo
git clone https://github.com/harishk2010/airman.git
cd airman/airman-backend

# 2. Install dependencies
npm install

# 3. Copy env file and fill in your values
cp .env.example .env

# 4. Start the backend in development mode
npm run dev
```

The API will be available at `http://localhost:5000`.

### Frontend Setup

```bash
cd airman/airman-frontend

# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1

# 3. Start the frontend
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables

### Backend — `airman-backend/.env`

```env
# Server
NODE_ENV=development
PORT=5000

# Database (use either DATABASE_URL or individual vars)
DATABASE_URL=                        # Injected by Railway in production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=airman_db
DB_USER=airman_user
DB_PASSWORD=airman_password

# Redis (use either REDIS_URL or individual vars)
REDIS_URL=                           # Injected by Railway in production
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS — set to your frontend URL
CORS_ORIGIN=http://localhost:3000

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10

# Workflow
ESCALATION_DELAY_HOURS=2
```

### Frontend — `airman-frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## Seeding the Database

The seed script creates demo tenants, admin users, instructors, and students so you can log in immediately.

```bash
cd airman-backend
node src/scripts/seed.js
```

### Demo Accounts

| Role | Email | Password | Tenant Slug |
|------|-------|----------|-------------|
| Admin | admin@alpha.com | Admin@Alpha123 | alpha-flight-school |
| Instructor | instructor@alpha.com | Instructor@Alpha123 | alpha-flight-school |
| Student | student@alpha.com | Student@Alpha123 | alpha-flight-school |
| Admin | admin@beta.com | Admin@Beta123 | beta-aviation |

> Each tenant is fully isolated — logging in with `alpha-flight-school` credentials will only show Alpha Flight School data.

---

## Running Tests

```bash
cd airman-backend

# Run all tests
npm test

# Unit tests only (no DB needed)
npm run test:unit

# Integration tests (requires Postgres + Redis running locally)
npm run test:integration

# With coverage report
npm run test:coverage
```

### Test Coverage

- **Unit tests** — booking conflict detection, quiz scoring logic, auth token helpers
- **Integration tests** — full HTTP request/response cycle for auth endpoints and booking endpoints against a real test database

---

## CI/CD Pipeline

Every push to `main` or `develop` triggers the GitHub Actions pipeline:

```
Backend Lint
     ↓
Backend Unit Tests (with coverage)
     ↓
Backend Integration Tests (Postgres 15 + Redis 7 containers)
     ↓
Migration Check (schema sync verification)
     ↓
Deploy Backend → Railway       Frontend Lint & Build
                    ↓                    ↓
              Deploy Frontend → Vercel
```

PRs run lint + all tests but do **not** deploy.

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `RAILWAY_TOKEN` | Railway API token (Account Settings → Tokens) |
| `VERCEL_TOKEN` | Vercel API token (Account Settings → Tokens) |
| `VERCEL_ORG_ID` | From `vercel link` → `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | From `vercel link` → `.vercel/project.json` |
| `NEXT_PUBLIC_API_URL` | Your Railway backend public URL + `/api/v1` |

---

## Deployment

### Backend → Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub → select this repo
2. Set root directory to `airman-backend`
3. Add **PostgreSQL** plugin → Railway injects `DATABASE_URL` automatically
4. Add **Redis** plugin → Railway injects `REDIS_URL` automatically
5. Add environment variables: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NODE_ENV=production`, `CORS_ORIGIN=https://your-app.vercel.app`
6. Railway uses `railway.toml` to start the server with `node src/server.js`

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → import this repo
2. Set root directory to `airman-frontend`
3. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app/api/v1`
4. Deploy

After both are live, update `CORS_ORIGIN` in Railway to your Vercel domain.

---

## API Reference

All endpoints are prefixed with `/api/v1`.

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | None | Register a new user |
| POST | `/auth/login` | None | Login and receive tokens |
| POST | `/auth/refresh` | None | Refresh access token |
| POST | `/auth/logout` | JWT | Logout and invalidate refresh token |
| GET | `/auth/me` | JWT | Get current user profile |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/users` | ADMIN | List all users in tenant |
| PATCH | `/admin/users/:id/approve` | ADMIN | Approve or reject a user |
| PATCH | `/admin/users/:id/role` | ADMIN | Change a user's role |
| GET | `/admin/audit-logs` | ADMIN | Paginated audit trail |

### Courses

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/courses` | JWT | List all published courses (+ own drafts for instructors) |
| POST | `/courses` | INSTRUCTOR/ADMIN | Create a course |
| GET | `/courses/:id` | JWT | Get course with modules, lessons, questions |
| PATCH | `/courses/:id` | INSTRUCTOR/ADMIN | Update course |
| POST | `/courses/:id/modules` | INSTRUCTOR/ADMIN | Add a module |
| POST | `/courses/:courseId/modules/:moduleId/lessons` | INSTRUCTOR/ADMIN | Add a lesson |
| POST | `/courses/:courseId/modules/:moduleId/lessons/:lessonId/questions` | INSTRUCTOR/ADMIN | Add quiz questions |
| POST | `/courses/:courseId/modules/:moduleId/lessons/:lessonId/submit` | STUDENT | Submit quiz answers |

### Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/bookings` | JWT | List bookings (scoped by role) |
| POST | `/bookings` | STUDENT | Create a booking request |
| GET | `/bookings/:id` | JWT | Get booking details |
| PATCH | `/bookings/:id` | ADMIN | Update status or assign instructor |

---

## Roles & Permissions

| Action | STUDENT | INSTRUCTOR | ADMIN |
|--------|---------|-----------|-------|
| View published courses | ✅ | ✅ | ✅ |
| Create/edit courses | ❌ | ✅ | ✅ |
| Take quizzes | ✅ | ❌ | ❌ |
| Create bookings | ✅ | ❌ | ❌ |
| Approve bookings | ❌ | ❌ | ✅ |
| Assign instructors | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ✅ |

---

## Multi-Tenancy

Every user belongs to a tenant (flight school). Tenants are identified by a URL slug (e.g. `alpha-flight-school`). The tenant is resolved on every request from the `tenantSlug` in the request body or the authenticated user's `tenantId`.

All database queries are scoped by `tenantId` at the service layer — it is not possible to read or write another tenant's data through the API.

To add a new tenant, insert a row into the `tenants` table:
```sql
INSERT INTO tenants (id, name, slug, is_active)
VALUES (gen_random_uuid(), 'My Flight School', 'my-flight-school', true);
```

Then seed an admin user for that tenant using the seed script or directly via the registration endpoint.

---

## Health Check

```
GET /health
→ { "status": "ok", "timestamp": "2026-02-28T..." }
```

Used by Railway for deployment health verification.

---

