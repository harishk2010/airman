# AIRMAN Backend – 72-Hour Plan

## Schedule

### Day 1 (Hours 0–24): Core Foundation
- [x] Project scaffolding (Express, Sequelize, env, logging)
- [x] All Sequelize models + associations
- [x] Auth service (register, login, refresh, logout)
- [x] JWT middleware + RBAC middleware
- [x] Tenant enforcement middleware
- [x] Course CRUD + Module + Lesson hierarchy
- [x] Quiz question creation + submission + scoring
- [x] Unit tests: auth, quiz scoring, conflict detection

### Day 2 (Hours 24–48): Business Logic + Security
- [x] Booking service with conflict detection
- [x] Full booking workflow (requested → assigned → completed)
- [x] Admin endpoints (approve users, create instructors, audit logs)
- [x] Multi-tenant isolation (all queries scoped)
- [x] Audit logging on all critical actions
- [x] BullMQ escalation workflow
- [x] Redis caching on read-heavy endpoints
- [x] Rate limiting (auth + booking endpoints)
- [x] Integration tests (auth flow, booking flow, tenant isolation)

### Day 3 (Hours 48–72): DevOps + Docs
- [x] Dockerfile (multi-stage, non-root user)
- [x] Docker Compose (postgres + redis + backend)
- [x] GitHub Actions CI (lint + unit + integration + coverage)
- [x] README, PLAN, CUTS, POSTMORTEM
- [ ] Cloud deployment (Render/Fly.io)
- [ ] Seed data script
- [ ] Demo video

## What Was Shipped
- Complete REST API with 25+ endpoints
- Full RBAC (Admin/Instructor/Student)
- Multi-tenant isolation with tenant_id enforcement
- Booking conflict detection (SQL + in-memory)
- Quiz scoring engine with incorrect question tracking
- Audit logging on all writes
- BullMQ escalation workflow
- Redis caching + graceful degradation
- Rate limiting on sensitive endpoints
- 10+ unit + integration tests
- Docker Compose single-command setup
- GitHub Actions CI/CD

## Prioritization Rationale
Core business logic (auth, RBAC, bookings, quizzes) was prioritized above all else because these are the explicit acceptance criteria. Performance features (caching, indexes) were added as Layer 2. Deployment was Layer 3.
