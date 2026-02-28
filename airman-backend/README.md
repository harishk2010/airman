# AIRMAN Backend API

Production-grade REST API for the AIRMAN Full Stack Developer Technical Assessment.

## Tech Stack
- **Runtime**: Node.js 20 + Express.js
- **Database**: PostgreSQL 15 + Sequelize ORM
- **Cache / Jobs**: Redis 7 + BullMQ
- **Auth**: JWT (access + refresh tokens)
- **Validation**: Zod
- **Testing**: Jest + Supertest
- **CI/CD**: GitHub Actions

## Architecture

```
src/
├── config/         # DB, Redis, env config
├── models/         # Sequelize models + associations
├── routes/         # Express routers (thin layer)
├── controllers/    # Request/response handling
├── services/       # Business logic
├── middlewares/    # Auth, RBAC, tenant, rate-limit, validate
├── validators/     # Zod schemas
├── jobs/           # BullMQ workers + queues
├── utils/          # Pagination, cache, logger, correlationId
└── tests/
    ├── unit/       # Quiz scoring, conflict detection, auth
    └── integration/ # Auth flow, booking flow, tenant isolation
```

### Multi-Tenancy
Shared DB with `tenant_id` on every row. All queries are scoped via `req.user.tenantId`. Cross-tenant access returns `403`.

### RBAC
| Role | Permissions |
|------|------------|
| ADMIN | All operations + user management + audit logs |
| INSTRUCTOR | Create/edit courses, set availability, view assigned bookings |
| STUDENT | View courses, attempt quizzes, request bookings |

## Quick Start

### With Docker Compose (Recommended)
```bash
git clone <repo>
cd airman-backend
cp .env.example .env
# Edit .env with your secrets
docker compose up --build
```
API available at `http://localhost:5000`

### Local Development
```bash
npm install
cp .env.example .env
# Set DB_HOST=localhost, REDIS_HOST=localhost
npm run dev
```

### Run Tests
```bash
npm test              # All tests
npm run test:unit     # Unit tests only
npm run test:coverage # With coverage report
```

## API Documentation

### Base URL
`http://localhost:5000/api/v1`

### Authentication
All protected routes require: `Authorization: Bearer <accessToken>`

---

### Auth Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | None | Register student |
| POST | `/auth/login` | None | Login |
| POST | `/auth/refresh` | None | Refresh access token |
| POST | `/auth/logout` | JWT | Logout |
| GET | `/auth/me` | JWT | Get current user |

**Register**
```json
POST /api/v1/auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "tenantSlug": "alpha-flight-school"
}
```

**Login**
```json
POST /api/v1/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123",
  "tenantSlug": "alpha-flight-school"
}
```
Response includes `accessToken`, `refreshToken`, and `user` object.

---

### Course Endpoints

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/courses` | All | List courses (paginated, searchable) |
| GET | `/courses/:id` | All | Get course with modules/lessons |
| POST | `/courses` | INSTRUCTOR, ADMIN | Create course |
| PUT | `/courses/:id` | INSTRUCTOR, ADMIN | Update course |
| DELETE | `/courses/:id` | INSTRUCTOR, ADMIN | Delete course |
| POST | `/courses/:courseId/modules` | INSTRUCTOR, ADMIN | Create module |
| POST | `/courses/modules/:moduleId/lessons` | INSTRUCTOR, ADMIN | Create lesson |
| POST | `/courses/lessons/:lessonId/questions` | INSTRUCTOR, ADMIN | Add quiz question |
| POST | `/courses/lessons/:lessonId/submit` | STUDENT | Submit quiz |

**Query params for GET /courses**: `?page=1&limit=10&search=aviation&published=true`

---

### Booking Endpoints

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/bookings` | STUDENT | Create booking request |
| GET | `/bookings` | All | List bookings (role-filtered) |
| GET | `/bookings/:id` | All | Get booking details |
| PATCH | `/bookings/:id` | All | Update booking status |
| POST | `/bookings/availability` | INSTRUCTOR | Set availability |
| GET | `/bookings/availability` | All | View availability |

**Booking Status Flow**: `requested → approved → assigned → completed`

---

### Admin Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/users` | List all tenant users |
| POST | `/admin/users/instructor` | Create instructor account |
| PATCH | `/admin/users/:id/approve` | Approve student |
| PATCH | `/admin/users/:id/role` | Change user role |
| GET | `/admin/audit-logs` | View audit trail |

---

## Demo Credentials

After `docker compose up`, seed data creates:

| Role | Email | Password | Tenant |
|------|-------|----------|--------|
| Admin | admin@alpha.com | Admin123! | alpha-flight-school |
| Instructor | instructor@alpha.com | Instructor123! | alpha-flight-school |
| Student | student@alpha.com | Student123! | alpha-flight-school |
| Admin | admin@beta.com | Admin123! | beta-flight-academy |

## DB Indexes

| Table | Index | Reason |
|-------|-------|--------|
| users | `(tenant_id)`, `(tenant_id, email)` | Tenant scoping + unique email per tenant |
| courses | `(tenant_id)`, `(instructor_id)`, `(title)` | Tenant scoping + search |
| bookings | `(instructor_id, start_time, end_time)` | Conflict detection query |
| bookings | `(tenant_id)`, `(status)` | Filtering |
| audit_logs | `(tenant_id)`, `(user_id)`, `(created_at)` | Log queries |

## Key Technical Decisions

1. **Shared DB multi-tenancy**: Chosen over separate schemas for operational simplicity at this scale. All models include `tenant_id`.
2. **JWT over sessions**: Stateless auth scales horizontally. Refresh tokens enable short-lived access tokens.
3. **Sequelize over raw SQL**: Type safety + associations + migration support.
4. **Redis-optional**: App degrades gracefully if Redis is unavailable (cache miss fallback, jobs skipped).
5. **BullMQ for escalation**: Persistent job queue with exponential backoff, survives restarts.
