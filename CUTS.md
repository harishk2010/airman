# CUTS.md — What Was Intentionally Not Built

This document records every feature that was scoped out during the 72-hour build window, along with the reasoning behind each cut. These are not oversights — they are deliberate tradeoffs made to ensure the core system was stable, deployed, and testable within the deadline.

---

## Cut 1: Booking Frontend UI

**What was cut:** The full student-facing booking flow — selecting time slots, viewing instructor availability, cancellation UI, and the booking status dashboard.

**What exists:** The backend is fully implemented. `booking.service.js`, `booking.controller.js`, and `booking.routes.js` all work correctly, including conflict detection, approval workflow, instructor assignment, and pagination. Integration tests pass.

**Why cut:** The booking UI is the most complex frontend component in the system. Building it correctly — with calendar pickers, real-time slot availability, and role-gated actions — would have taken the remaining time available on Day 3. The decision was made to prioritise CI/CD and deployment so the working parts of the system could be demonstrated live rather than only locally.

**Effort to complete:** 1–2 days. The backend needs no changes — only the frontend pages at `/bookings`, `/bookings/[id]`, and the instructor scheduling view need to be built.

---

## Cut 2: Instructor Availability Management

**What was cut:** The UI and logic for instructors to declare their available time windows. Students should only be able to book slots where the instructor has declared availability.

**What exists:** The `Availability` model and basic `availabilityRoutes` exist in the backend codebase, but the endpoints are incomplete and untested.

**Why cut:** This feature depends on the booking UI (Cut 1) being complete first. Building availability management in isolation with no frontend to test it against was not a good use of time.

**Effort to complete:** 2–3 days including frontend calendar UI.

---

## Cut 3: Email Notifications

**What was cut:** Transactional emails — booking confirmation, approval notification, quiz completion, escalation alerts.

**What exists:** Nothing. No email provider is integrated, no templates exist, no queue workers for email sending.

**Why cut:** Email requires a third-party provider (Resend, SendGrid, Postmark), domain verification, template design, and error handling for bounces and failures. This is purely additive — the core system works without it — and the time investment was not justified for a 72-hour assessment.

**Effort to complete:** 1 day with a provider like Resend (simple API, great Node.js SDK).

---

## Cut 4: Escalation Queue (BullMQ)

**What was cut:** The automatic booking escalation system — if a booking isn't approved within 2 hours, it should escalate to an admin.

**What exists:** The `workflow.service.js` and BullMQ queue setup exist. The `scheduleEscalation` function is called when a booking is created. However, Redis on Railway does not persist queue jobs between restarts reliably on the free tier, and the worker process was not set up as a separate Railway service.

**Why cut:** Getting BullMQ working correctly in a Railway environment requires a dedicated worker service (separate `railway.toml`, separate deploy target). This was a deployment complexity cut, not a code cut — the logic is written.

**Effort to complete:** Half a day to configure a separate Railway worker service.

---

## Cut 5: Student Progress Tracking

**What was cut:** Tracking which lessons a student has completed, overall course progress percentage, and a progress dashboard.

**What exists:** `QuizAttempt` is recorded correctly with score, correct count, and incorrect question review. But there is no `LessonCompletion` model or progress aggregation.

**Why cut:** Progress tracking requires a new model, migration, and both backend and frontend work. With the quiz system taking priority (it was broken and needed fixing), progress tracking was deferred.

**Effort to complete:** 1 day.

---

## Cut 6: Admin Dashboard Analytics

**What was cut:** The admin dashboard charts — enrollment trends, booking volume over time, pass rates per course.

**What exists:** The audit log page is complete. The user management and approval pages are complete. The chart components (`recharts` is installed) are stubbed.

**Why cut:** Data aggregation queries for analytics are time-consuming to write correctly. The priority was ensuring the operational features (user management, course management, bookings) worked rather than reporting on top of them.

**Effort to complete:** 1 day.

---

## Cut 7: Tenant Onboarding UI

**What was cut:** A self-service onboarding flow for new flight schools — a superadmin interface to create tenants, assign slugs, and configure settings.

**What exists:** Tenants are created directly via database seed. The `POST /admin/tenants` endpoint exists but is not exposed in the frontend.

**Why cut:** Multi-tenant onboarding UI is a superadmin concern that doesn't affect the day-to-day operation of an existing tenant. The seed script covers demo tenant creation adequately for assessment purposes.

**Effort to complete:** Half a day.

---

## Summary Table

| Feature | Backend | Frontend | Cut Reason |
|---------|---------|---------|------------|
| Booking UI | ✅ Complete | ❌ Not built | Time — prioritised CI/CD and deployment |
| Instructor availability | ⚠️ Partial | ❌ Not built | Depends on booking UI |
| Email notifications | ❌ Not built | ❌ Not built | Third-party integration overhead |
| Escalation queue | ⚠️ Written, not deployed | N/A | Railway worker service complexity |
| Student progress tracking | ❌ Not built | ❌ Not built | Deferred after quiz fix priority |
| Admin analytics charts | N/A | ⚠️ Stubbed | Data aggregation time cost |
| Tenant onboarding UI | ✅ Endpoint exists | ❌ Not built | Superadmin edge case, seed covers it |
