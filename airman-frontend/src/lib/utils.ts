import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string, fmt = 'MMM d, yyyy') {
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy · HH:mm');
  } catch {
    return dateStr;
  }
}

export function formatDateTimeShort(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'dd MMM HH:mm');
  } catch {
    return dateStr;
  }
}

export function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export function getApiError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return err.response?.data?.message || err.message || 'An error occurred';
  }
  return 'An error occurred';
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    requested: 'badge-requested',
    approved: 'badge-approved',
    assigned: 'badge-assigned',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
  };
  return map[status] ?? 'badge-requested';
}

export function roleColor(role: string): string {
  const map: Record<string, string> = {
    ADMIN: 'badge-admin',
    INSTRUCTOR: 'badge-instructor',
    STUDENT: 'badge-student',
  };
  return map[role] ?? 'badge-student';
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 70) return 'text-amber-400';
  return 'text-red-400';
}

export function truncate(str: string, length = 60): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '…';
}
