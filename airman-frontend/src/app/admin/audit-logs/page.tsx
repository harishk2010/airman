'use client';
import { useEffect, useState, useCallback } from 'react';
import { Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { timeAgo, formatDateTime } from '@/lib/utils';
import { AuditLog } from '@/types';

const ACTION_COLORS: Record<string, string> = {
  USER_LOGIN: 'text-sky-400',
  USER_REGISTERED: 'text-green-400',
  USER_APPROVED: 'text-green-400',
  BOOKING_CREATED: 'text-amber-400',
  BOOKING_STATUS_CHANGED: 'text-purple-400',
  BOOKING_CANCELLED: 'text-red-400',
  COURSE_CREATED: 'text-amber-400',
  COURSE_UPDATED: 'text-sky-400',
  COURSE_DELETED: 'text-red-400',
  ROLE_CHANGED: 'text-orange-400',
  INSTRUCTOR_CREATED: 'text-green-400',
};

// Helper: resolve field that may come back as camelCase or snake_case
const field = (log: AuditLog, camel: keyof AuditLog, snake: keyof AuditLog): string =>
  ((log[camel] ?? log[snake]) as string | undefined) ?? '';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAuditLogs({ page, limit: 30 });
      setLogs(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch { /* ignore */ }
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="btn-ghost flex items-center gap-1.5 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="page-header mb-0">
          <h1 className="page-title">Audit Trail</h1>
          <p className="page-subtitle font-mono text-xs">{total} EVENTS LOGGED</p>
        </div>
      </div>

      <div className="cockpit-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 shimmer rounded-lg" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center">
            <Clock className="w-10 h-10 text-sky-400/20 mx-auto mb-3" />
            <p className="text-sm text-sky-400/40 font-mono">NO AUDIT EVENTS YET</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Correlation ID</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  // FIX: resolve all fields with camelCase/snake_case fallbacks
                  const createdAt = field(log, 'createdAt', 'created_at');
                  const entityType = field(log, 'entityType', 'entity_type');
                  const entityId = field(log, 'entityId', 'entity_id');
                  const correlationId = field(log, 'correlationId', 'correlation_id');
                  const ipAddress = field(log, 'ipAddress', 'ip_address');
                  const beforeState = (log.beforeState ?? log.before_state) as Record<string, unknown> | null | undefined;
                  const afterState = (log.afterState ?? log.after_state) as Record<string, unknown> | null | undefined;

                  return (
                    <>
                      <tr key={log.id} className="cursor-pointer"
                        onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                        <td>
                          {/* FIX: createdAt is now always a string (never undefined) */}
                          <div className="font-mono text-xs">{createdAt ? formatDateTime(createdAt) : '—'}</div>
                          <div className="font-mono text-[10px] text-sky-400/30">{createdAt ? timeAgo(createdAt) : ''}</div>
                        </td>
                        <td>
                          <span className={`font-mono text-xs font-semibold ${ACTION_COLORS[log.action] || 'text-sky-300'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td>
                          <div className="text-xs text-sky-300/70">{entityType}</div>
                          {entityId && (
                            <div className="font-mono text-[10px] text-sky-400/30">{entityId.slice(0, 8)}...</div>
                          )}
                        </td>
                        <td>
                          <span className="font-mono text-[10px] text-sky-400/30">
                            {correlationId ? correlationId.slice(0, 12) : '—'}
                          </span>
                        </td>
                        <td>
                          <button className="text-xs text-sky-400/40 hover:text-sky-300 font-mono">
                            {expanded === log.id ? '▲ HIDE' : '▼ SHOW'}
                          </button>
                        </td>
                      </tr>
                      {expanded === log.id && (
                        <tr key={`${log.id}-expanded`}>
                          <td colSpan={5} className="bg-sky-950/30 !py-4 !px-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-[10px] font-mono text-amber-400/60 mb-1">BEFORE STATE</div>
                                <pre className="instrument text-[10px] text-sky-300/60 p-3 overflow-auto max-h-32">
                                  {beforeState ? JSON.stringify(beforeState, null, 2) : 'null'}
                                </pre>
                              </div>
                              <div>
                                <div className="text-[10px] font-mono text-amber-400/60 mb-1">AFTER STATE</div>
                                <pre className="instrument text-[10px] text-sky-300/60 p-3 overflow-auto max-h-32">
                                  {afterState ? JSON.stringify(afterState, null, 2) : 'null'}
                                </pre>
                              </div>
                            </div>
                            <div className="flex gap-6 mt-2 text-[10px] font-mono text-sky-400/30">
                              {ipAddress && <span>IP: {ipAddress}</span>}
                              {correlationId && <span>CID: {correlationId}</span>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {total > 30 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-white/[0.05]">
            <button className="btn-secondary px-4 py-2 text-xs"
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              ← Prev
            </button>
            <span className="font-mono text-xs text-sky-400/50 px-3">
              {page} / {Math.ceil(total / 30)}
            </span>
            <button className="btn-secondary px-4 py-2 text-xs"
              onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 30)}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}