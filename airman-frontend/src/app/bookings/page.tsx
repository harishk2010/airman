'use client';
import { useEffect, useState, useCallback } from 'react';
import { CalendarDays, Plus, Clock, CheckCircle2, XCircle, User, Loader2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { bookingApi, adminApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cn, formatDateTime, getApiError, statusColor, timeAgo } from '@/lib/utils';
import { Booking, User as UserType, BookingStatus } from '@/types';

const createSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  start_time: z.string().min(1, 'Start time required'),
  end_time: z.string().min(1, 'End time required'),
}).refine(d => new Date(d.end_time) > new Date(d.start_time), {
  message: 'End time must be after start time', path: ['end_time'],
});
type CreateForm = z.infer<typeof createSchema>;

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Requested', value: 'requested' },
  { label: 'Approved', value: 'approved' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function BookingsPage() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState<Booking | null>(null);
  const [instructors, setInstructors] = useState<UserType[]>([]);

  const isAdmin = user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await bookingApi.list(params);
      setBookings(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch { /* ignore */ }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (isAdmin) {
      adminApi.getUsers({ role: 'INSTRUCTOR' })
        .then(r => setInstructors(r.data.data || []))
        .catch(() => {});
    }
  }, [isAdmin]);

  const onCreateSubmit = async (data: CreateForm) => {
    try {
      await bookingApi.create(data);
      toast.success('Booking requested successfully');
      setShowCreate(false);
      reset();
      load();
    } catch (err) { toast.error(getApiError(err)); }
  };

  const handleAssign = async (bookingId: string, instructorId: string) => {
    try {
      await bookingApi.updateStatus(bookingId, { status: 'assigned', instructor_id: instructorId });
      toast.success('Instructor assigned');
      setShowAssign(null);
      load();
    } catch (err) { toast.error(getApiError(err)); }
  };

  const handleApprove = async (booking: Booking) => {
    try {
      await bookingApi.updateStatus(booking.id, { status: 'approved' });
      toast.success('Booking approved');
      load();
    } catch (err) { toast.error(getApiError(err)); }
  };

  const handleComplete = async (booking: Booking) => {
    try {
      await bookingApi.updateStatus(booking.id, { status: 'completed' });
      toast.success('Booking marked complete');
      load();
    } catch (err) { toast.error(getApiError(err)); }
  };

  const handleCancel = async (booking: Booking) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await bookingApi.cancel(booking.id);
      toast.success('Booking cancelled');
      load();
    } catch (err) { toast.error(getApiError(err)); }
  };

  const statusIcon = (status: BookingStatus) => {
    const map: Record<string, React.ReactNode> = {
      requested: <Clock className="w-3.5 h-3.5" />,
      approved: <CheckCircle2 className="w-3.5 h-3.5" />,
      assigned: <User className="w-3.5 h-3.5" />,
      completed: <CheckCircle2 className="w-3.5 h-3.5" />,
      cancelled: <XCircle className="w-3.5 h-3.5" />,
    };
    return map[status];
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Flight Bookings</h1>
          <p className="page-subtitle font-mono text-xs">{total} TOTAL SESSIONS</p>
        </div>
        {isStudent && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Request Session
          </button>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => (
          <button key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-lg text-xs font-mono font-semibold tracking-wider transition-all',
              statusFilter === tab.value
                ? 'bg-sky-800/30 text-amber-400 border border-sky-600/30'
                : 'text-sky-400/50 hover:text-sky-300 hover:bg-white/5'
            )}>
            {tab.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="cockpit-card h-24 shimmer" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="cockpit-card p-16 text-center">
          <CalendarDays className="w-12 h-12 text-sky-400/20 mx-auto mb-3" />
          <h3 className="font-display text-lg text-white mb-1">No Bookings</h3>
          <p className="text-xs text-sky-400/40 font-mono">
            {isStudent ? 'Request your first training session above' : 'No bookings match your filter'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="cockpit-card p-5 flex items-center gap-4 hover:bg-white/[0.01] transition-colors">
              {/* Status indicator */}
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                `badge ${statusColor(booking.status)}`
              )} style={{ fontSize: 0, background: undefined }}>
                <div className={`badge ${statusColor(booking.status)} !bg-transparent !border-0`}>
                  {statusIcon(booking.status)}
                </div>
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display font-semibold text-white text-sm truncate">{booking.title}</h3>
                  <span className={`badge ${statusColor(booking.status)}`}>{booking.status.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-sky-400/50">
                  <span>
  📅 {booking.start_time ? formatDateTime(booking.start_time) : '—'}
</span>
<span>
  → {booking.end_time ? formatDateTime(booking.end_time) : '—'}
</span>
                </div>
                {booking.instructor && (
                  <div className="text-xs text-sky-400/40 font-mono mt-0.5">
                    INSTRUCTOR: {booking.instructor.first_name} {booking.instructor.last_name}
                  </div>
                )}
                {booking.student && isAdmin && (
                  <div className="text-xs text-sky-400/40 font-mono mt-0.5">
                    STUDENT: {booking.student.first_name} {booking.student.last_name}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isAdmin && booking.status === 'requested' && (
                  <button onClick={() => handleApprove(booking)} className="btn-secondary text-xs px-3 py-2">
                    Approve
                  </button>
                )}
                {isAdmin && booking.status === 'approved' && (
                  <button onClick={() => setShowAssign(booking)} className="btn-secondary text-xs px-3 py-2">
                    Assign
                  </button>
                )}
                {user?.role === 'INSTRUCTOR' && booking.status === 'assigned' && (
                  <button onClick={() => handleComplete(booking)} className="btn-secondary text-xs px-3 py-2 text-green-400 border-green-400/30">
                    Complete
                  </button>
                )}
                {['requested', 'approved'].includes(booking.status) && (
                  <button onClick={() => handleCancel(booking)}
                    className="btn-ghost text-xs px-3 py-2 text-red-400/60 hover:text-red-400">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create booking modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="cockpit-card w-full max-w-md p-6 animate-slide-up">
            <h3 className="font-display text-xl font-bold text-white mb-4">Request Training Session</h3>
            <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
              <div>
                <label className="form-label">Session Title *</label>
                <input {...register('title')} className="form-input" placeholder="e.g. Cessna 172 Solo" />
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea {...register('description')} className="form-input h-20 resize-none" placeholder="Training goals..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Start Time *</label>
                  <input {...register('start_time')} type="datetime-local" className="form-input" />
                  {errors.start_time && <p className="text-red-400 text-xs mt-1">{errors.start_time.message}</p>}
                </div>
                <div>
                  <label className="form-label">End Time *</label>
                  <input {...register('end_time')} type="datetime-local" className="form-input" />
                  {errors.end_time && <p className="text-red-400 text-xs mt-1">{errors.end_time.message}</p>}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSubmitting ? 'Submitting...' : 'Request Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign instructor modal */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="cockpit-card w-full max-w-sm p-6 animate-slide-up">
            <h3 className="font-display text-lg font-bold text-white mb-4">Assign Instructor</h3>
            <p className="text-xs text-sky-400/50 font-mono mb-4">BOOKING: {showAssign.title}</p>
            {instructors.length === 0 ? (
              <p className="text-sm text-sky-400/50 text-center py-4">No instructors available</p>
            ) : (
              <div className="space-y-2">
                {instructors.map(inst => (
                  <button key={inst.id}
                    onClick={() => handleAssign(showAssign.id, inst.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-sky-900/20 border border-white/5 hover:border-sky-600/30 transition-all text-left">
                    <div className="w-8 h-8 rounded-lg bg-sky-800/30 flex items-center justify-center text-xs font-bold text-sky-300">
                      {inst.first_name?.[0]}{inst.last_name?.[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{inst.first_name} {inst.last_name}</div>
                      <div className="text-xs text-sky-400/50 font-mono">{inst.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button className="btn-secondary w-full mt-4" onClick={() => setShowAssign(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
