'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CalendarDays, Users, Clock, ArrowRight, Plane } from 'lucide-react';
import { useAuthStore, getUserDisplayName } from '@/lib/store';
import { courseApi, bookingApi, adminApi } from '@/lib/api';
import { cn, formatDateTime } from '@/lib/utils';
import { Course, Booking } from '@/types';

interface Stats {
  courses: number;
  bookings: number;
  pendingBookings: number;
  users?: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({ courses: 0, bookings: 0, pendingBookings: 0 });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [coursesRes, bookingsRes] = await Promise.allSettled([
          courseApi.list({ limit: 5 }),
          bookingApi.list({ limit: 5 }),
        ]);

        let courses = 0, bookings = 0, pendingBookings = 0, users = 0;

        if (coursesRes.status === 'fulfilled') {
          courses = coursesRes.value.data.pagination?.total || coursesRes.value.data.data?.length || 0;
          setRecentCourses(coursesRes.value.data.data || []);
        }
        if (bookingsRes.status === 'fulfilled') {
          bookings = bookingsRes.value.data.pagination?.total || bookingsRes.value.data.data?.length || 0;
          const pending = (bookingsRes.value.data.data || []).filter((b: Booking) => b.status === 'requested').length;
          pendingBookings = pending;
          setRecentBookings(bookingsRes.value.data.data || []);
        }
        if (user.role === 'ADMIN') {
          try {
            const usersRes = await adminApi.getUsers({ limit: 1 });
            users = usersRes.data.pagination?.total || 0;
          } catch { /* ignore if admin api fails */ }
        }
        setStats({ courses, bookings, pendingBookings, users });
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [user]);

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      requested: 'text-slate-400', approved: 'text-sky-400',
      assigned: 'text-purple-400', completed: 'text-green-400', cancelled: 'text-red-400'
    };
    return map[status] || 'text-slate-400';
  };

  // FIX: handle both camelCase and snake_case from backend
  const displayName = getUserDisplayName(user);

  const statCards = [
    { label: 'Total Courses', value: stats.courses, icon: BookOpen, color: 'sky', href: '/courses' },
    { label: 'My Bookings', value: stats.bookings, icon: CalendarDays, color: 'amber', href: '/bookings' },
    { label: 'Pending Approval', value: stats.pendingBookings, icon: Clock, color: stats.pendingBookings > 0 ? 'red' : 'green', href: '/bookings?status=requested' },
    ...(user?.role === 'ADMIN' ? [{ label: 'Total Users', value: stats.users || 0, icon: Users, color: 'purple', href: '/admin/users' }] : []),
  ];

  return (
    <div className="animate-fade-in space-y-8">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <Plane className="w-5 h-5 text-amber-400" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="page-title">
              Welcome back, <span className="text-amber-400">{displayName}</span>
            </h1>
            <p className="page-subtitle">
              <span className="font-mono text-xs">[{user?.role}]</span> — All systems nominal
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="cockpit-card p-5 h-28 shimmer" />
          ))
        ) : statCards.map((card) => {
          const Icon = card.icon;
          const colorMap: Record<string, { bg: string; border: string; text: string }> = {
            sky: { bg: 'rgba(74,114,196,0.1)', border: 'rgba(74,114,196,0.25)', text: '#7096d8' },
            amber: { bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)', text: '#fb923c' },
            red: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', text: '#f87171' },
            green: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', text: '#4ade80' },
            purple: { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.25)', text: '#c084fc' },
          };
          const c = colorMap[card.color];
          return (
            <Link key={card.label} href={card.href}
              className="cockpit-card p-5 flex items-center gap-4 hover:scale-[1.02] transition-transform group">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                <Icon className="w-5 h-5" style={{ color: c.text }} />
              </div>
              <div>
                <div className="stat-value text-3xl text-white">{card.value}</div>
                <div className="text-xs text-sky-400/60 font-mono tracking-wider mt-0.5">{card.label.toUpperCase()}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-sky-400/20 ml-auto group-hover:text-amber-400 transition-colors" />
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="cockpit-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <div>
              <h3 className="font-display font-semibold text-white">Recent Bookings</h3>
              <p className="text-xs text-sky-400/50 font-mono">FLIGHT SCHEDULE</p>
            </div>
            <Link href="/bookings" className="btn-ghost text-xs flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-2">
            {loading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded-lg shimmer" />)}</div>
            ) : recentBookings.length === 0 ? (
              <div className="p-8 text-center">
                <CalendarDays className="w-8 h-8 text-sky-400/20 mx-auto mb-2" />
                <p className="text-sm text-sky-400/40 font-mono">NO BOOKINGS YET</p>
              </div>
            ) : recentBookings.map((booking) => (
              <Link key={booking.id} href="/bookings"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(74,114,196,0.1)', border: '1px solid rgba(74,114,196,0.15)' }}>
                  <CalendarDays className="w-4 h-4 text-sky-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{booking.title}</div>
                  <div className="text-xs text-sky-400/50 font-mono">
                    {formatDateTime(booking.startTime || booking.start_time || '')}
                  </div>
                </div>
                <span className={cn('text-xs font-mono ml-auto flex-shrink-0', statusColor(booking.status))}>
                  {booking.status.toUpperCase()}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Courses */}
        <div className="cockpit-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <div>
              <h3 className="font-display font-semibold text-white">Available Courses</h3>
              <p className="text-xs text-sky-400/50 font-mono">TRAINING MODULES</p>
            </div>
            <Link href="/courses" className="btn-ghost text-xs flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-2">
            {loading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded-lg shimmer" />)}</div>
            ) : recentCourses.length === 0 ? (
              <div className="p-8 text-center">
                <BookOpen className="w-8 h-8 text-sky-400/20 mx-auto mb-2" />
                <p className="text-sm text-sky-400/40 font-mono">NO COURSES YET</p>
              </div>
            ) : recentCourses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-colors group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.15)' }}>
                  <BookOpen className="w-4 h-4 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white truncate">{course.title}</div>
                  <div className="text-xs text-sky-400/50 font-mono">
                    {course.modules?.length || 0} MODULES
                  </div>
                </div>
                <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0',
                  (course.isPublished || course.is_published) ? 'bg-green-400' : 'bg-slate-500')} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="cockpit-card p-5">
        <h3 className="font-display font-semibold text-white mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {user?.role === 'STUDENT' && (
            <Link href="/bookings" className="btn-primary flex items-center gap-2 text-sm">
              <CalendarDays className="w-4 h-4" /> Book a Flight
            </Link>
          )}
          {(user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN') && (
            <Link href="/courses" className="btn-primary flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4" /> Manage Courses
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link href="/admin/users" className="btn-secondary flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" /> Manage Users
            </Link>
          )}
          <Link href="/courses" className="btn-secondary flex items-center gap-2 text-sm">
            <BookOpen className="w-4 h-4" /> Browse Courses
          </Link>
        </div>
      </div>
    </div>
  );
}
