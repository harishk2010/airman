# AIRMAN Frontend

Production-grade Next.js 14 frontend for the AIRMAN Flight School Management Platform.

**Design Aesthetic:** Aviation cockpit instrument panel — dark navy hull, amber instrument lighting, sky-blue HUD overlays. Typography: Rajdhani (display/headings) + Inter (body) + JetBrains Mono (data/codes).

---

## Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + custom design system
- **State:** Zustand (auth store)
- **Forms:** React Hook Form + Zod validation
- **HTTP:** Axios with JWT interceptors + auto-refresh
- **UI:** Custom components + Radix UI primitives
- **Notifications:** Sonner toast

---

## Quick Start

### Prerequisites
- Node.js 20+
- Backend running at `http://localhost:5000`

### Run Locally

```bash
cd frontend
cp .env.local.example .env.local
# Edit NEXT_PUBLIC_API_URL if backend is not on localhost:5000
npm install
npm run dev
```

Visit: `http://localhost:3000`

### With Docker Compose

```bash
# From root of project
docker compose up --build
```

---

## Pages & Features

| Route | Description | Roles |
|-------|-------------|-------|
| `/auth/login` | Cockpit-styled login with tenant selector & demo credentials display | Public |
| `/auth/register` | Registration form with pending-approval confirmation | Public |
| `/dashboard` | Role-aware dashboard with stats, recent bookings, recent courses | All |
| `/courses` | Paginated course grid with search, create modal | All |
| `/courses/[id]` | Full course viewer: module accordion, text lessons, live quiz with scoring | All |
| `/bookings` | Full booking lifecycle: create, filter by status, approve/assign/complete/cancel | All |
| `/admin/users` | User table with role filter, student approval, create instructor | ADMIN |
| `/admin/audit-logs` | Audit trail table with before/after state expandable rows | ADMIN |
| `/profile` | User profile display with clearance status | All |

---

## Design System

### Color Palette (CSS variables in globals.css)

```
--bg-primary:     #0a1628  (Deep navy)
--bg-secondary:   #0d1f3c  (Cockpit hull)
--bg-card:        #111d35  (Instrument panel)
--accent-amber:   #f97316  (Primary CTA, warnings)
--accent-sky:     #4a72c4  (Nav links, data)
--text-primary:   #f0f4ff  (White with sky tint)
--text-secondary: #8ca0c4  (Secondary info)
--text-muted:     #4a5a7a  (Placeholders)
```

### Component Classes

```css
.cockpit-card     /* Main card surface with top-border shimmer */
.instrument       /* Dark inset display for data/mono info */
.btn-primary      /* Amber gradient CTA */
.btn-secondary    /* Translucent sky button */
.form-input       /* Aviation-styled input */
.form-label       /* Uppercase mono label */
.badge            /* Status pill */
.data-table       /* Styled table */
.quiz-option      /* Multiple choice option */
.nav-item         /* Sidebar navigation link */
```

---

## Auth Flow

1. User selects tenant + enters email/password
2. `POST /auth/login` → receives `accessToken` (15m) + `refreshToken` (7d)
3. Tokens stored in `localStorage`, user stored in Zustand
4. Axios interceptor attaches `Authorization: Bearer <token>` to all requests
5. On 401, interceptor automatically calls `POST /auth/refresh` → rotates tokens
6. If refresh fails → clears storage + redirects to `/auth/login`

---

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## Build

```bash
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

---

## Role-Based UI

- **ADMIN:** Full access — all pages, user management, audit logs, approve students, assign instructors
- **INSTRUCTOR:** Courses + Bookings (complete assigned sessions), no admin panel  
- **STUDENT:** Browse courses, take quizzes, create/cancel bookings — no create course
