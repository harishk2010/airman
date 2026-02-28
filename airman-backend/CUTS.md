# AIRMAN Backend – Intentional Cuts

## Not Built (and Why)

### 1. Email Notifications (Real)
**Cut**: Replaced with console logger stubs.
**Reason**: Would require SMTP/SendGrid setup and secrets. The escalation logic is fully implemented; swapping console.log for nodemailer is a 10-minute change.

### 2. Database Migrations (Sequelize-CLI)
**Cut**: Using `sequelize.sync()` instead of migration files.
**Reason**: Migration files are boilerplate-heavy. For a 72-hour assessment, `sync({ alter: true })` in dev and `sync()` in prod achieves the same result. In production, migration files would be added.

### 3. Refresh Token Rotation
**Cut**: Implemented basic refresh token but not full rotation strategy.
**Reason**: Full rotation (detect token reuse, invalidate family) adds complexity. Current implementation is secure enough for assessment.

### 4. Offline-First / Telemetry (Bonus)
**Cut**: Did not implement bonus features.
**Reason**: Core Level 1 + Level 2 requirements were prioritized. Bonus features would have required additional ~8 hours.

### 5. Cloud Deployment
**Cut**: Documented deployment approach but did not deploy to Fly.io/Render.
**Reason**: Docker Compose works on any machine. Cloud deployment is environment-specific and would require account setup.

### 6. File Uploads
**Cut**: No image/video upload for course content.
**Reason**: Not mentioned in requirements. Content is stored as text/URLs.

### 7. WebSocket Real-Time Updates
**Cut**: No real-time booking status updates.
**Reason**: Not in requirements. Polling via GET /bookings is sufficient.
