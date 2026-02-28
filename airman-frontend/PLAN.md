# PLAN.md — Frontend Architecture Plan

## Design Direction: Aviation Cockpit HUD

The AIRMAN frontend is designed to evoke a modern flight deck instrument panel:
- **Palette:** Deep navy (#0a1628) as base, amber (#f97316) for primary actions, sky blue (#4a72c4) for data
- **Typography:** Rajdhani for headings (wide military tracking), Inter for body, JetBrains Mono for IDs/codes
- **Motifs:** Grid overlays simulating radar screens, gradient borders, instrument-style inset panels, HUD corner elements on auth pages

## Architecture Decisions

### App Router (Next.js 14)
- Client components for interactive pages, server components for layouts
- Route groups for auth (public) vs app (protected)
- Single shared AppLayout with sidebar + topbar wrapped per route group

### State Management: Zustand
- Single `useAuthStore` with: `user`, `accessToken`, `refreshToken`, `isAuthenticated`, `isLoading`
- Hydration from localStorage on mount
- Token persistence across page reloads

### API Layer: Axios with Interceptors
- Auto-attach Bearer token to every request
- Token refresh on 401 with queuing (prevents parallel refresh storms)
- Centralized `getApiError()` utility extracts backend error messages

### Form Validation: React Hook Form + Zod
- Same Zod schemas as backend for consistency
- Real-time validation, accessible error messages

## Page Breakdown

### Auth Pages (public)
- Login: tenant selector (loads from `/admin/tenants`), demo credentials shown in instrument panel
- Register: standard form, shows success confirmation with pending-approval message

### Dashboard
- Role-aware stat cards (different metrics per role)
- Recent bookings + recent courses in 2-column layout
- Quick action buttons based on role

### Courses
- Grid view with search + pagination
- Create course modal (inline, no route change)
- Course detail: left sidebar module accordion, right content area
- Quiz: per-question answer selection, submit → score + incorrect review

### Bookings
- Status tabs for filtering (Requested/Approved/Assigned/Completed/Cancelled)
- Create booking modal with datetime pickers
- Role-based actions: ADMIN approves/assigns, INSTRUCTOR completes, students cancel
- Assign instructor modal shows list of instructors from admin API

### Admin
- Users table with role filters + student approval + create instructor modal
- Audit logs table with expandable before/after JSON state

## What Was Intentionally Excluded
- Real-time notifications (would need WebSocket)
- Availability calendar (complex date UI, time constraint)
- Course enrollment tracking (no enrollment model in backend)
- File/media upload for lesson content
- 2FA (stub shown in profile, not implemented)
