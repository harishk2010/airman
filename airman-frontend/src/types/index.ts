// ─── AUTH ─────────────────────────────────────────────────────────────────────
export type UserRole = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';

// FIX: Backend returns camelCase fields; keep both for compatibility
export interface User {
  id: string;
  email: string;
  // Backend returns camelCase
  firstName?: string;
  lastName?: string;
  // Also accept snake_case (for display consistency)
  first_name?: string;
  last_name?: string;
  role: UserRole;
  isApproved?: boolean;
  is_approved?: boolean;
  tenantId?: string;
  tenant_id?: string;
  lastLoginAt?: string;
  last_login_at?: string;
  createdAt?: string;
  created_at?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;        // FIX: added slug field
  isActive?: boolean;
  is_active?: boolean;
}

// ─── COURSES ──────────────────────────────────────────────────────────────────
export interface Course {
  id: string;
  tenantId?: string;
  tenant_id?: string;
  instructorId?: string;
  instructor_id?: string;
  instructor?: User;
  title: string;
  description?: string;
  isPublished?: boolean;
  is_published?: boolean;
  thumbnailUrl?: string;
  thumbnail_url?: string;
  modules?: Module[];
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface Module {
  id: string;
  courseId?: string;
  course_id?: string;
  title: string;
  description?: string;
  orderIndex?: number;
  order_index?: number;
  lessons?: Lesson[];
}

export type LessonType = 'TEXT' | 'QUIZ';

export interface Lesson {
  id: string;
  moduleId?: string;
  module_id?: string;
  title: string;
  type: LessonType;
  content?: string;
  orderIndex?: number;
  order_index?: number;
  isPublished?: boolean;
  is_published?: boolean;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  lessonId?: string;
  lesson_id?: string;
  questionText?: string;
  question_text?: string;
  options: { id: string; text: string }[];
  correctOptionId?: string;
  correct_option_id?: string;
  explanation?: string;
  orderIndex?: number;
  order_index?: number;
}

export interface QuizAttempt {
  attemptId?: string;
  attempt_id?: string;
  score: number;
  totalQuestions?: number;
  total_questions?: number;
  correctCount?: number;
  correct_count?: number;
  incorrectCount?: number;
  incorrect_count?: number;
  incorrectQuestions?: IncorrectQuestion[];
  incorrect_questions?: IncorrectQuestion[];
  passed: boolean;
}

export interface IncorrectQuestion {
  questionId?: string;
  question_id?: string;
  questionText?: string;
  question_text?: string;
  yourAnswer?: string;
  your_answer?: string;
  correctAnswer?: string;
  correct_answer?: string;
  explanation?: string;
}

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────
export type BookingStatus = 'requested' | 'approved' | 'assigned' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  tenantId?: string;
  tenant_id?: string;
  studentId?: string;
  student_id?: string;
  student?: User;
  instructorId?: string;
  instructor_id?: string;
  instructor?: User;
  title: string;
  description?: string;
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  status: BookingStatus;
  notes?: string;
  escalatedAt?: string;
  escalated_at?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface Availability {
  id: string;
  instructorId?: string;
  instructor_id?: string;
  tenantId?: string;
  tenant_id?: string;
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  isRecurring?: boolean;
  is_recurring?: boolean;
  recurrenceRule?: string;
  recurrence_rule?: string;
}

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  action: string;

  createdAt?: string;
  created_at?: string;

  entityType?: string;
  entity_type?: string;

  entityId?: string;
  entity_id?: string;

  correlationId?: string;
  correlation_id?: string;

  ipAddress?: string;
  ip_address?: string;

  beforeState?: Record<string, unknown> | null;
  before_state?: Record<string, unknown> | null;

  afterState?: Record<string, unknown> | null;
  after_state?: Record<string, unknown> | null;
}

// ─── API ──────────────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  message: string;
  errors?: { field: string; message: string }[];
}
