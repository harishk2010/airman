'use client';
import { useEffect, useState, useCallback } from 'react';
import { Users, CheckCircle2, UserPlus, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';
import { cn, getApiError, roleColor, timeAgo } from '@/lib/utils';
import { User } from '@/types';
import Link from 'next/link';

const ROLE_TABS = [
  { label: 'All', value: '' },
  { label: 'Admins', value: 'ADMIN' },
  { label: 'Instructors', value: 'INSTRUCTOR' },
  { label: 'Students', value: 'STUDENT' },
];

// Helper to get user display name from camelCase backend response
const userName = (u: User) => {
  const first = u.firstName || u.first_name || '';
  const last = u.lastName || u.last_name || '';
  return `${first} ${last}`.trim() || u.email;
};
const userInitials = (u: User) => {
  const first = u.firstName || u.first_name || '';
  const last = u.lastName || u.last_name || '';
  return `${first[0] || ''}${last[0] || ''}`.toUpperCase() || u.email[0].toUpperCase();
};
const userApproved = (u: User) => u.isApproved ?? u.is_approved ?? false;
const userCreatedAt = (u: User) => u.createdAt || u.created_at || '';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [newInstructor, setNewInstructor] = useState({ email: '', password: '', first_name: '', last_name: '' });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { limit: 50 };
      if (roleFilter) params.role = roleFilter;
      const res = await adminApi.getUsers(params);
      setUsers(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch { /* ignore */ }
    setLoading(false);
  }, [roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (userId: string) => {
    try {
      await adminApi.approveStudent(userId);
      toast.success('Student approved — they can now log in');
      load();
    } catch (err) { toast.error(getApiError(err)); }
  };

  const handleCreateInstructor = async () => {
    const { email, password, first_name, last_name } = newInstructor;
    if (!email || !password || !first_name || !last_name) return toast.error('All fields required');
    setCreating(true);
    try {
      // FIX: adminApi.createInstructor maps to camelCase internally
      await adminApi.createInstructor(newInstructor);
      toast.success('Instructor created — they can log in immediately');
      setShowCreate(false);
      setNewInstructor({ email: '', password: '', first_name: '', last_name: '' });
      load();
    } catch (err) { toast.error(getApiError(err)); }
    setCreating(false);
  };

  const filtered = users.filter(u =>
    !search ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    userName(u).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-amber-400" />
            <div>
              <h1 className="page-title">User Management</h1>
              <p className="page-subtitle font-mono text-xs">{total} REGISTERED CREW</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/audit-logs" className="btn-secondary flex items-center gap-2 text-sm">
            Audit Logs
          </Link>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Add Instructor
          </button>
        </div>
      </div>

      {/* Search + Role tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="form-input w-full sm:w-64"
          placeholder="Search by name or email..."
        />
        <div className="flex items-center gap-1">
          {ROLE_TABS.map(tab => (
            <button key={tab.value} onClick={() => setRoleFilter(tab.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-mono font-semibold tracking-wider transition-all',
                roleFilter === tab.value
                  ? 'bg-sky-800/30 text-amber-400 border border-sky-600/30'
                  : 'text-sky-400/50 hover:text-sky-300 hover:bg-white/5'
              )}>
              {tab.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Info panel */}
      <div className="instrument p-4 text-xs font-mono text-sky-400/50 space-y-1">
        <p className="text-amber-400/70 tracking-widest">WORKFLOW</p>
        <p>1. Instructors: created here by admin (pre-approved, can login immediately)</p>
        <p>2. Students: self-register at /auth/register → appear here as PENDING → click Approve</p>
      </div>

      <div className="cockpit-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-12 rounded-lg shimmer" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-10 h-10 text-sky-400/20 mx-auto mb-3" />
            <p className="text-sm text-sky-400/40 font-mono">NO USERS FOUND</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ background: 'rgba(74,114,196,0.15)', border: '1px solid rgba(74,114,196,0.2)' }}>
                          {userInitials(u)}
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">{userName(u)}</div>
                          <div className="text-xs text-sky-400/40 font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${roleColor(u.role)}`}>{u.role}</span>
                    </td>
                    <td>
                      {userApproved(u) ? (
                        <span className="badge badge-completed">APPROVED</span>
                      ) : (
                        <span className="badge badge-requested">PENDING</span>
                      )}
                    </td>
                    <td>
                      <span className="font-mono text-xs">{userCreatedAt(u) ? timeAgo(userCreatedAt(u)) : '—'}</span>
                    </td>
                    <td>
                      {!userApproved(u) && u.role === 'STUDENT' && (
                        <button onClick={() => handleApprove(u.id)}
                          className="flex items-center gap-1.5 btn-secondary text-xs px-3 py-1.5 text-green-400 border-green-400/20 hover:border-green-400/50">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create instructor modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="cockpit-card w-full max-w-md p-6 animate-slide-up">
            <h3 className="font-display text-xl font-bold text-white mb-1">Add Flight Instructor</h3>
            <p className="text-xs text-sky-400/50 font-mono mb-4">Instructor will be pre-approved and can login immediately</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">First Name</label>
                  <input value={newInstructor.first_name}
                    onChange={e => setNewInstructor(f => ({ ...f, first_name: e.target.value }))}
                    className="form-input" placeholder="John" />
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <input value={newInstructor.last_name}
                    onChange={e => setNewInstructor(f => ({ ...f, last_name: e.target.value }))}
                    className="form-input" placeholder="Doe" />
                </div>
              </div>
              <div>
                <label className="form-label">Email</label>
                <input value={newInstructor.email}
                  onChange={e => setNewInstructor(f => ({ ...f, email: e.target.value }))}
                  type="email" className="form-input" placeholder="instructor@school.com" />
              </div>
              <div>
                <label className="form-label">Temporary Password</label>
                <input value={newInstructor.password}
                  onChange={e => setNewInstructor(f => ({ ...f, password: e.target.value }))}
                  type="password" className="form-input" placeholder="Min. 8 characters" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-primary flex-1 flex items-center justify-center gap-2"
                onClick={handleCreateInstructor} disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {creating ? 'Creating...' : 'Create Instructor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
