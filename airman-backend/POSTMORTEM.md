# AIRMAN Backend – Postmortem

## What Went Well

### Architecture Discipline
Maintaining strict separation of concerns (routes → controllers → services) from Day 1 paid dividends. Adding new features never required touching existing layers.

### Graceful Degradation
Making Redis optional from the start meant the app runs cleanly without Docker for unit tests, and in environments where Redis isn't available.

### Tenant Enforcement
Applying tenant middleware at the router level rather than in each controller ensured no endpoint was accidentally left unsecured.

## Technical Challenges

### BullMQ + Redis Connection Timing
BullMQ requires Redis to be available at startup. Initial implementation crashed if Redis wasn't ready. Fixed by wrapping queue initialization in try/catch and lazily initializing via `getEscalationQueue()`.

### Sequelize Sync vs Migrations
`sync({ alter: true })` is convenient but can be destructive (drops columns). Added a guard to only use `alter` in development mode.

### Cross-Tenant Test Isolation
Integration tests running in parallel could contaminate each other's data. Fixed by running Jest with `--runInBand` and using `sync({ force: true })` in `beforeAll`.

## What I'd Improve With One More Week

### 1. Full Migration Files
Replace `sequelize.sync()` with proper up/down migration files for production safety.

### 2. Real Email Notifications
Integrate nodemailer or SendGrid for escalation alerts and registration confirmations.

### 3. API Rate Limiting Per User
Current rate limiting is IP-based. Per-user limits (stored in Redis) would be more accurate and harder to bypass.

### 4. Comprehensive Test Coverage
Add tests for: course module ordering, concurrent booking conflicts, pagination edge cases, RBAC for each role on each endpoint.

### 5. Request/Response Logging to DB
Store structured request logs to enable full request tracing alongside audit logs.

### 6. Soft Deletes
Replace `destroy()` with `deletedAt` (paranoid mode in Sequelize) so records are never truly lost.

### 7. OpenAPI / Swagger Spec
Auto-generate API documentation from route + validator definitions.
