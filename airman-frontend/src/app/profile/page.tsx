'use client';
import { useAuthStore } from '@/lib/store';
import { User, Mail, Shield, CheckCircle2, XCircle, Key, Plane } from 'lucide-react';
import { getInitials, roleColor } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useAuthStore();
  if (!user) return null;

  const fields = [
    { label: 'First Name', value: user.first_name },
    { label: 'Last Name', value: user.last_name },
    { label: 'Email', value: user.email, icon: Mail },
    { label: 'Tenant ID', value: user.tenant_id, mono: true },
    { label: 'User ID', value: user.id, mono: true },
  ];

  return (
    <div className="animate-fade-in space-y-6 max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">Crew Profile</h1>
        <p className="page-subtitle font-mono text-xs">YOUR CLEARANCE DETAILS</p>
      </div>

      {/* Identity card */}
      <div className="cockpit-card p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold font-display"
            style={{ background: 'linear-gradient(135deg, rgba(74,114,196,0.3), rgba(46,82,163,0.2))', border: '1px solid rgba(74,114,196,0.35)' }}>
            {getInitials(user.first_name, user.last_name)}
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-white">
              {user.first_name} {user.last_name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge ${roleColor(user.role)}`}>{user.role}</span>
              {user.is_approved ? (
                <span className="badge badge-completed flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> CLEARED
                </span>
              ) : (
                <span className="badge badge-requested flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> PENDING
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="hud-divider" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(f => (
            <div key={f.label}>
              <label className="form-label">{f.label}</label>
              <div className={`instrument text-sm ${f.mono ? 'font-mono text-xs' : ''}`}>
                {f.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Flight stats stub */}
      <div className="cockpit-card p-6">
        <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
          <Plane className="w-4 h-4 text-amber-400" /> Flight Record
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'FLIGHT HOURS', value: '—' },
            { label: 'SOLO FLIGHTS', value: '—' },
            { label: 'CERTIFICATES', value: '—' },
          ].map(s => (
            <div key={s.label} className="instrument text-center py-4">
              <div className="stat-value text-3xl text-sky-300">{s.value}</div>
              <div className="text-[9px] font-mono text-sky-400/40 tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-sky-400/30 font-mono mt-3">FLIGHT RECORD INTEGRATION COMING SOON</p>
      </div>

      {/* Security */}
      <div className="cockpit-card p-6">
        <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-400" /> Security
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <div className="text-sm text-white font-medium">Password</div>
              <div className="text-xs text-sky-400/40 font-mono">Last changed: Unknown</div>
            </div>
            <button className="btn-secondary text-xs">Change</button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <div className="text-sm text-white font-medium">Two-Factor Authentication</div>
              <div className="text-xs text-sky-400/40 font-mono">Not configured</div>
            </div>
            <button className="btn-secondary text-xs opacity-40 cursor-not-allowed" disabled>Enable</button>
          </div>
        </div>
      </div>
    </div>
  );
}
