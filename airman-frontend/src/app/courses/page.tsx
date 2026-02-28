'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Plus, Search, Loader2, GraduationCap, ChevronRight, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { courseApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cn, getApiError, truncate } from '@/lib/utils';
import { Course } from '@/types';

export default function CoursesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });

  const canCreate = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await courseApi.list({ page, limit: 12, search });
      setCourses(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    setCreating(true);
    try {
      const res = await courseApi.create({ title: form.title, description: form.description });
      // FIX: backend returns { success: true, data: { id, ... } } — not nested .data.data
      const course = res.data.data || res.data;
      toast.success('Course created');
      setShowCreateModal(false);
      setForm({ title: '', description: '' });
      router.push(`/courses/${course.id}`);
    } catch (err) { toast.error(getApiError(err)); }
    setCreating(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Delete this course?')) return;
    try {
      await courseApi.delete(id);
      toast.success('Course deleted');
      load();
    } catch (err) { toast.error(getApiError(err)); }
  };

  const togglePublish = async (course: Course, e: React.MouseEvent) => {
    e.preventDefault();
    // FIX: handle both camelCase and snake_case from backend
    const currentlyPublished = course.isPublished ?? course.is_published;
    try {
      await courseApi.update(course.id, { isPublished: !currentlyPublished });
      toast.success(currentlyPublished ? 'Course unpublished' : 'Course published');
      load();
    } catch (err) { toast.error(getApiError(err)); }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Training Courses</h1>
          <p className="page-subtitle font-mono text-xs">{total} COURSES AVAILABLE</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Course
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400/40" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="form-input pl-10"
          placeholder="Search courses..."
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="cockpit-card h-52 shimmer" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="cockpit-card p-16 text-center">
          <BookOpen className="w-12 h-12 text-sky-400/20 mx-auto mb-3" />
          <h3 className="font-display text-lg text-white mb-1">No Courses Yet</h3>
          <p className="text-sky-400/50 text-sm font-mono">
            {canCreate ? 'Create the first training course' : 'No courses are available yet'}
          </p>
          {canCreate && (
            <button onClick={() => setShowCreateModal(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Course
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course, i) => {
            // FIX: resolve published state from either camelCase or snake_case
            const isPublished = course.isPublished ?? course.is_published ?? false;
            // FIX: resolve instructor name from either camelCase or snake_case
            const instructorFirst = course.instructor?.firstName || course.instructor?.first_name || '';
            const instructorLast = course.instructor?.lastName || course.instructor?.last_name || '';

            return (
              <Link key={course.id} href={`/courses/${course.id}`}
                className="cockpit-card p-5 flex flex-col hover:scale-[1.01] transition-transform group"
                style={{ animationDelay: `${i * 50}ms` }}>
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
                    <GraduationCap className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-semibold text-white text-sm leading-tight group-hover:text-amber-300 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-sky-400/50 font-mono mt-0.5">
                      {instructorFirst} {instructorLast}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-sky-300/50 flex-1 leading-relaxed">
                  {course.description ? truncate(course.description, 100) : 'No description provided.'}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.05]">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-1.5 h-1.5 rounded-full', isPublished ? 'bg-green-400' : 'bg-slate-500')} />
                    <span className="text-[10px] font-mono text-sky-400/40">
                      {isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {canCreate && (
                      <>
                        <button onClick={(e) => togglePublish(course, e)}
                          className="p-1.5 rounded hover:bg-white/5 transition-colors text-sky-400/40 hover:text-sky-300"
                          title={isPublished ? 'Unpublish' : 'Publish'}>
                          {isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={(e) => handleDelete(course.id, e)}
                          className="p-1.5 rounded hover:bg-red-500/10 transition-colors text-sky-400/40 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <ChevronRight className="w-4 h-4 text-sky-400/20 group-hover:text-amber-400 transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 12 && (
        <div className="flex items-center justify-center gap-2">
          <button className="btn-secondary px-4 py-2 text-xs" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            ← Prev
          </button>
          <span className="font-mono text-xs text-sky-400/50 px-3">
            {page} / {Math.ceil(total / 12)}
          </span>
          <button className="btn-secondary px-4 py-2 text-xs" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 12)}>
            Next →
          </button>
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="cockpit-card w-full max-w-md p-6 animate-slide-up">
            <h3 className="font-display text-xl font-bold text-white mb-4">Create New Course</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Course Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="form-input" placeholder="e.g. Private Pilot Ground School" />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="form-input resize-none h-24" placeholder="Course overview..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {creating ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}