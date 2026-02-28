# POSTMORTEM.md — Frontend

## What Went Well

**Design System First:** Defining the full CSS component library in `globals.css` before building pages paid off enormously. Every page uses the same `.cockpit-card`, `.btn-primary`, `.form-input`, `.badge` classes, creating perfect visual consistency.

**Zustand Auth Store:** The pattern of `hydrate()` on mount + refresh token rotation in the Axios interceptor handles all edge cases: page reload, tab refresh, expired tokens.

**Quiz UI:** The quiz player component (answer selection → submit → scored results with incorrect review) is the most complete and polished flow in the app. The visual states (selected/correct/incorrect) communicate clearly.

**Role-Based Rendering:** Because roles are encoded in the JWT and stored in Zustand, every page conditionally renders controls without additional API calls.

## Challenges

### Next.js App Router Hydration
Server/client component boundaries required careful placement of `'use client'` directives. Auth state must not run on the server. The AuthGuard wrapper in AppLayout solves this but took iteration.

### API Response Shape Consistency  
The backend returns `{ data: [...], pagination: {...} }` for lists. Some error responses return different shapes. The `getApiError()` utility centralizes error extraction but defensive coding was needed throughout.

### Dynamic Route with `useParams`
`/courses/[id]` required explicitly typing `useParams<{ id: string }>()` to satisfy TypeScript in Next.js 14. This is a new App Router pattern.

## What Would Improve With More Time

1. **Unit tests** — Jest + React Testing Library for quiz scoring logic, auth store, API interceptors
2. **E2E tests** — Playwright covering full login → course → booking flow
3. **Skeleton screens** — More polished loading states with accurate layout skeletons
4. **Availability calendar** — Visual calendar with instructor availability slots
5. **Course progress** — Per-lesson completion tracking + overall course progress bar
6. **Storybook** — Component library documentation
7. **Internationalization (i18n)** — next-intl for multi-language support
8. **PWA** — Service worker + offline support for lesson content
9. **Accessibility audit** — WCAG 2.1 AA compliance review (focus traps, ARIA labels)
10. **Performance** — Image optimization, route prefetching, React Suspense boundaries
