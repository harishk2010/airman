import axios, { AxiosInstance, AxiosError } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 with token refresh
let isRefreshing = false;
let refreshQueue: ((token: string) => void)[] = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !original?._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            if (original) original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
            resolve(api(original!));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = localStorage.getItem('refreshToken');
        if (!storedRefreshToken) throw new Error('No refresh token');

        // FIX: use refreshToken (camelCase) matching backend schema
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: storedRefreshToken });
        const { accessToken, refreshToken: newRefresh } = res.data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);

        refreshQueue.forEach((cb) => cb(accessToken));
        refreshQueue = [];

        if (original) original.headers!.Authorization = `Bearer ${accessToken}`;
        return api(original!);
      } catch {
        localStorage.clear();
        if (typeof window !== 'undefined') window.location.href = '/auth/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authApi = {
  // FIX: map frontend snake_case fields → backend camelCase + tenantSlug
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    tenant_slug: string;
  }) =>
    api.post('/auth/register', {
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      password: data.password,
      tenantSlug: data.tenant_slug,
    }),

  // FIX: map tenant_slug → tenantSlug
  login: (data: { email: string; password: string; tenant_slug: string }) =>
    api.post('/auth/login', {
      email: data.email,
      password: data.password,
      tenantSlug: data.tenant_slug,
    }),

  // FIX: refreshToken camelCase
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  logout: () =>
    api.post('/auth/logout'),

  me: () => api.get('/auth/me'),
};

// ─── TENANTS ─────────────────────────────────────────────────────────────────
// FIX: use public /admin/tenants (no auth required for GET)
export const tenantApi = {
  list: () => api.get('/admin/tenants'),
  create: (data: { name: string; slug: string }) => api.post('/admin/tenants', data),
};

// ─── COURSES ──────────────────────────────────────────────────────────────────
export const courseApi = {
  list: (params?: Record<string, unknown>) => api.get('/courses', { params }),
  get: (id: string) => api.get(`/courses/${id}`),
  create: (data: Record<string, unknown>) => api.post('/courses', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/courses/${id}`, data),
  delete: (id: string) => api.delete(`/courses/${id}`),

  createModule: (courseId: string, data: Record<string, unknown>) =>
    api.post(`/courses/${courseId}/modules`, data),
  updateModule: (courseId: string, moduleId: string, data: Record<string, unknown>) =>
    api.put(`/courses/${courseId}/modules/${moduleId}`, data),
  deleteModule: (courseId: string, moduleId: string) =>
    api.delete(`/courses/${courseId}/modules/${moduleId}`),

  createLesson: (courseId: string, moduleId: string, data: Record<string, unknown>) =>
    api.post(`/courses/${courseId}/modules/${moduleId}/lessons`, data),
  updateLesson: (courseId: string, moduleId: string, lessonId: string, data: Record<string, unknown>) =>
    api.put(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, data),

  createQuizQuestions: (courseId: string, moduleId: string, lessonId: string, questions: unknown[]) =>
    api.post(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/questions`, { questions }),

  submitQuiz: (courseId: string, moduleId: string, lessonId: string, answers: unknown[]) =>
    api.post(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/submit`, { answers }),

  getAttempts: (courseId: string, moduleId: string, lessonId: string) =>
    api.get(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/attempts`),
};

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────
export const bookingApi = {
  list: (params?: Record<string, unknown>) => api.get('/bookings', { params }),
  get: (id: string) => api.get(`/bookings/${id}`),
  create: (data: Record<string, unknown>) => api.post('/bookings', data),
  updateStatus: (id: string, data: Record<string, unknown>) => api.patch(`/bookings/${id}/status`, data),
  cancel: (id: string) => api.patch(`/bookings/${id}/cancel`),

  getAvailability: (instructorId: string, params?: Record<string, unknown>) =>
    api.get(`/bookings/availability/${instructorId}`, { params }),
  createAvailability: (data: Record<string, unknown>) => api.post('/bookings/availability', data),
  deleteAvailability: (id: string) => api.delete(`/bookings/availability/${id}`),
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────
export const adminApi = {
  getUsers: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  // FIX: send camelCase to match backend createInstructorSchema
  createInstructor: (data: { email: string; password: string; first_name: string; last_name: string }) =>
    api.post('/admin/users/instructor', {
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      password: data.password,
    }),
  approveStudent: (id: string) => api.patch(`/admin/users/${id}/approve`),
  changeRole: (id: string, role: string) => api.patch(`/admin/users/${id}/role`, { role }),
  getAuditLogs: (params?: Record<string, unknown>) => api.get('/admin/audit-logs', { params }),
};
