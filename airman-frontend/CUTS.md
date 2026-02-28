# CUTS.md — Frontend

## Features Intentionally Cut

### Availability Calendar
**Cut:** No visual calendar for instructor availability scheduling.  
**Reason:** A full calendar UI (FullCalendar/react-big-calendar) with conflict visualization requires significant integration work. The booking creation form with datetime pickers covers the core user need.

### Course Enrollment System
**Cut:** No explicit enrollment/unenrollment flow.  
**Reason:** Backend has no enrollment model. All students can view all published courses by design for this assessment scope.

### Real-time Notifications
**Cut:** Notification bell is UI stub only.  
**Reason:** Requires WebSocket/SSE infrastructure + notification model on backend. The toast-based feedback covers all user-facing state changes.

### Lesson Progress Tracking
**Cut:** No lesson completion checkmarks or progress bar per course.  
**Reason:** No progress model on backend. Quiz attempts are stored but lesson completion state is not.

### Drag-and-Drop Module Reordering
**Cut:** Module/lesson reordering is done via `order_index` field in backend but no drag UI.  
**Reason:** Would require react-dnd or @dnd-kit integration. Reasonable cut for 72h scope.

### Profile Edit
**Cut:** Profile page shows data but doesn't allow editing name/email.  
**Reason:** Backend has no `/profile/update` endpoint in scope. Would be trivial to add.

### Dark/Light Theme Toggle  
**Cut:** App is dark-only.  
**Reason:** The cockpit aesthetic is inherently dark. A light mode would require a different design direction.
