'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ChevronDown, ChevronRight, BookOpen, CheckCircle2, XCircle,
  PlayCircle, Plus, Loader2, FileText, HelpCircle, Trash2, Edit3, Save
} from 'lucide-react';
import { toast } from 'sonner';
import { courseApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cn, getApiError, scoreColor } from '@/lib/utils';
import { Course, Lesson, QuizAttempt, QuizQuestion } from '@/types';

// ─── Unwrap API response ───────────────────────────────────────────────────────
const unwrap = (res: { data: { data?: unknown;[key: string]: unknown } }) =>
  res.data.data ?? res.data;

// ─── Quiz Player (for students) ────────────────────────────────────────────────
function QuizPlayer({ lesson, courseId, moduleId, onComplete }: {
  lesson: Lesson; courseId: string; moduleId: string; onComplete: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizAttempt | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const questions = lesson.questions || [];

  const handleSubmit = async () => {
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) return toast.error(`Please answer all ${questions.length} questions`);
    setSubmitting(true);
    try {
      const res = await courseApi.submitQuiz(courseId, moduleId, lesson.id,
        Object.entries(answers).map(([question_id, selected_option_id]) => ({ question_id, selected_option_id }))
      );
      setResult(unwrap(res) as QuizAttempt);
    } catch (err) { toast.error(getApiError(err)); }
    setSubmitting(false);
  };

  if (result) {
    const correctCount = result.correctCount ?? result.correct_count ?? 0;
    const totalQuestions = result.totalQuestions ?? result.total_questions ?? 0;
    const incorrectQuestions = result.incorrectQuestions ?? result.incorrect_questions ?? [];

    return (
      <div className="space-y-4 animate-slide-up">
        <div className="cockpit-card p-6 text-center">
          <div className={cn('text-6xl font-display font-bold mb-1', scoreColor(result.score))}>
            {result.score.toFixed(0)}%
          </div>
          <div className="text-sm text-sky-400/50 font-mono mb-3">
            {correctCount}/{totalQuestions} CORRECT
          </div>
          <div className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold font-display',
            result.passed
              ? 'text-green-400 bg-green-400/10 border border-green-400/30'
              : 'text-red-400 bg-red-400/10 border border-red-400/30'
          )}>
            {result.passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {result.passed ? 'MISSION ACCOMPLISHED' : 'RETRY REQUIRED (70% to pass)'}
          </div>
        </div>

        {incorrectQuestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-display text-sm font-semibold text-white">Review Incorrect Answers</h4>
            {incorrectQuestions.map((q, i) => {
              const questionText = q.questionText ?? q.question_text ?? '';
              const yourAnswer = q.yourAnswer ?? q.your_answer ?? '';
              const correctAnswer = q.correctAnswer ?? q.correct_answer ?? '';
              return (
                <div key={i} className="cockpit-card p-4 space-y-2">
                  <p className="text-sm text-white">{questionText}</p>
                  <div className="flex gap-4 text-xs font-mono">
                    <span className="text-red-400">YOUR: {yourAnswer}</span>
                    <span className="text-green-400">CORRECT: {correctAnswer}</span>
                  </div>
                  {q.explanation && <p className="text-xs text-sky-300/60 italic">{q.explanation}</p>}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => { setResult(null); setAnswers({}); }}>
            Retry Quiz
          </button>
          <button className="btn-primary flex-1" onClick={onComplete}>Continue</button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center">
        <HelpCircle className="w-10 h-10 text-sky-400/20 mx-auto mb-3" />
        <p className="text-sm text-sky-400/40 font-mono">NO QUESTIONS YET</p>
        <p className="text-xs text-sky-400/30 mt-1">An instructor needs to add questions to this quiz.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="instrument text-xs text-sky-400/60 font-mono">
        {questions.length} QUESTIONS — 70% REQUIRED TO PASS
      </div>
      {questions.map((q, qi) => {
        const questionText = (q as any).question || q.questionText || q.question_text || '';
        return (
          <div key={q.id} className="cockpit-card p-4 space-y-3">
            <p className="text-sm text-white font-medium">{qi + 1}. {questionText}</p>
            <div className="space-y-2">
              {q.options.map((opt) => (
                <button key={opt.id} onClick={() => setAnswers(a => ({ ...a, [q.id]: opt.id }))}
                  className={cn('quiz-option w-full text-left', answers[q.id] === opt.id && 'selected')}>
                  <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    answers[q.id] === opt.id ? 'border-amber-400 bg-amber-400' : 'border-sky-600/40'
                  )}>
                    {answers[q.id] === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm text-sky-200/80">{opt.text}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
      <button className="btn-primary w-full flex items-center justify-center gap-2"
        onClick={handleSubmit} disabled={submitting}>
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {submitting ? 'Scoring...' : 'Submit Answers'}
      </button>
    </div>
  );
}

// ─── Quiz Editor (for instructors/admins) ──────────────────────────────────────
function QuizEditor({ lesson, courseId, moduleId, onSaved }: {
  lesson: Lesson; courseId: string; moduleId: string; onSaved: () => void;
}) {
  const OPTION_IDS = ['A', 'B', 'C', 'D'];

  const blankQuestion = () => ({
    question: '',
    options: OPTION_IDS.map(id => ({ id, text: '' })),
    correctOptionId: 'A',
    explanation: '',
  });

  const [questions, setQuestions] = useState([blankQuestion()]);
  const [saving, setSaving] = useState(false);

  const existing: QuizQuestion[] = lesson.questions || [];

  const updateQuestion = (qi: number, field: string, value: string) => {
    setQuestions(qs => qs.map((q, i) => i === qi ? { ...q, [field]: value } : q));
  };

  const updateOption = (qi: number, optId: string, text: string) => {
    setQuestions(qs => qs.map((q, i) => i === qi
      ? { ...q, options: q.options.map(o => o.id === optId ? { ...o, text } : o) }
      : q
    ));
  };

  const addQuestion = () => setQuestions(qs => [...qs, blankQuestion()]);
  const removeQuestion = (qi: number) => setQuestions(qs => qs.filter((_, i) => i !== qi));

  const handleSave = async () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) return toast.error(`Question ${i + 1} text is required`);
      if (q.options.some(o => !o.text.trim())) return toast.error(`All options in question ${i + 1} must be filled`);
    }
    setSaving(true);
    try {
      await courseApi.createQuizQuestions(courseId, moduleId, lesson.id,
        questions.map((q, i) => ({
          question: q.question,
          options: q.options,
          correctOptionId: q.correctOptionId,
          explanation: q.explanation || null,
          order: existing.length + i,
        }))
      );
      toast.success(`${questions.length} question${questions.length > 1 ? 's' : ''} added`);
      setQuestions([blankQuestion()]);
      onSaved();
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Existing questions */}
      {existing.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-display text-sm font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            Existing Questions ({existing.length})
          </h4>
          {existing.map((q, i) => {
            const questionText = (q as any).question || q.questionText || q.question_text || '';
            return (
              <div key={q.id} className="cockpit-card p-4 border border-white/[0.05]">
                <p className="text-xs text-sky-400/50 font-mono mb-1">Q{i + 1}</p>
                <p className="text-sm text-white">{questionText}</p>
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {q.options.map(o => {
                    const isCorrect = o.id === ((q as any).correctOptionId ?? (q as any).correct_option_id);
                    return (
                      <div key={o.id} className={cn('text-xs px-2 py-1 rounded font-mono',
                        isCorrect ? 'text-green-400 bg-green-400/10' : 'text-sky-400/40'
                      )}>
                        {o.id}: {o.text} {isCorrect && '✓'}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New questions form */}
      <div className="space-y-3">
        <h4 className="font-display text-sm font-semibold text-white">
          {existing.length > 0 ? 'Add More Questions' : 'Add Questions'}
        </h4>

        {questions.map((q, qi) => (
          <div key={qi} className="cockpit-card p-5 space-y-4 border border-sky-600/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-amber-400/70 tracking-widest">
                QUESTION {existing.length + qi + 1}
              </span>
              {questions.length > 1 && (
                <button onClick={() => removeQuestion(qi)}
                  className="text-red-400/40 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div>
              <label className="form-label">Question Text *</label>
              <textarea
                value={q.question}
                onChange={e => updateQuestion(qi, 'question', e.target.value)}
                className="form-input resize-none h-16"
                placeholder="Enter your question..."
              />
            </div>

            <div>
              <label className="form-label">Answer Options * — click a letter to mark correct answer</label>
              <div className="space-y-2">
                {q.options.map(opt => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuestion(qi, 'correctOptionId', opt.id)}
                      className={cn(
                        'w-7 h-7 rounded-lg text-xs font-bold font-mono flex-shrink-0 transition-all border',
                        q.correctOptionId === opt.id
                          ? 'bg-green-400/20 border-green-400/50 text-green-400'
                          : 'bg-white/5 border-white/10 text-sky-400/40 hover:border-sky-400/30'
                      )}
                      title="Set as correct answer"
                    >
                      {opt.id}
                    </button>
                    <input
                      value={opt.text}
                      onChange={e => updateOption(qi, opt.id, e.target.value)}
                      className="form-input flex-1"
                      placeholder={`Option ${opt.id}...`}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-sky-400/30 font-mono mt-1">
                Correct: <span className="text-green-400">{q.correctOptionId}</span>
              </p>
            </div>

            <div>
              <label className="form-label">Explanation (optional)</label>
              <input
                value={q.explanation}
                onChange={e => updateQuestion(qi, 'explanation', e.target.value)}
                className="form-input"
                placeholder="Explain why the correct answer is correct..."
              />
            </div>
          </div>
        ))}

        <div className="flex gap-3">
          <button onClick={addQuestion} className="btn-secondary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Another Question
          </button>
          <button onClick={handleSave} disabled={saving}
            className="btn-primary flex items-center gap-2 text-sm flex-1 justify-center">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : `Save ${questions.length} Question${questions.length > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Text Lesson Editor (for instructors/admins) ───────────────────────────────
function TextLessonEditor({ lesson, courseId, moduleId, onSaved }: {
  lesson: Lesson; courseId: string; moduleId: string; onSaved: () => void;
}) {
  const [content, setContent] = useState(lesson.content || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await courseApi.updateLesson(courseId, moduleId, lesson.id, { content, isPublished: true });
      toast.success('Lesson content saved');
      onSaved();
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="instrument text-xs text-sky-400/60 font-mono">
        EDITING LESSON CONTENT
      </div>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        className="form-input resize-none w-full h-64 font-mono text-sm"
        placeholder="Write your lesson content here..."
      />
      <button onClick={handleSave} disabled={saving}
        className="btn-primary flex items-center gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Saving...' : 'Save Content'}
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<{ lesson: Lesson; moduleId: string } | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [contentMode, setContentMode] = useState<'view' | 'edit'>('view');

  const canEdit = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  const loadCourse = async (courseId: string) => {
    const res = await courseApi.get(courseId);
    const data = unwrap(res) as Course;
    setCourse(data);
    return data;
  };

  useEffect(() => {
    if (!id) return;
    loadCourse(id as string)
      .then(data => {
        if (data.modules?.[0]) setExpandedModules(new Set([data.modules[0].id]));
      })
      .catch(() => toast.error('Failed to load course'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSelectLesson = (lesson: Lesson, moduleId: string) => {
    setActiveLesson({ lesson, moduleId });
    const isEmpty = lesson.type === 'TEXT'
      ? !lesson.content
      : (!lesson.questions || lesson.questions.length === 0);
    // Auto-open edit mode for instructors on empty lessons
    setContentMode(canEdit && isEmpty ? 'edit' : 'view');
  };

  const addModule = async () => {
    if (!newModuleTitle.trim() || !course) return;
    try {
      await courseApi.createModule(course.id, { title: newModuleTitle, order: course.modules?.length || 0 });
      toast.success('Module added');
      await loadCourse(course.id);
      setShowAddModule(false);
      setNewModuleTitle('');
    } catch (err) { toast.error(getApiError(err)); }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId); else next.add(moduleId);
      return next;
    });
  };

  const handleContentSaved = async () => {
    if (!course || !activeLesson) return;
    const updated = await loadCourse(course.id);
    for (const mod of updated.modules || []) {
      const found = (mod.lessons || []).find(l => l.id === activeLesson.lesson.id);
      if (found) {
        setActiveLesson({ lesson: found, moduleId: mod.id });
        break;
      }
    }
    setContentMode('view');
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 cockpit-card shimmer" />
      <div className="h-64 cockpit-card shimmer" />
    </div>
  );

  if (!course) return (
    <div className="cockpit-card p-16 text-center">
      <p className="text-sky-400/50 font-mono">COURSE NOT FOUND</p>
    </div>
  );

  const isPublished = course.isPublished ?? course.is_published ?? false;
  const instructorFirst = course.instructor?.firstName || course.instructor?.first_name || '';

  return (
    <div className="animate-fade-in">
      <div className="flex gap-6 flex-col lg:flex-row">

        {/* ── Sidebar ── */}
        <div className="w-full lg:w-80 space-y-4 flex-shrink-0">
          <div className="cockpit-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span className="badge badge-approved">{isPublished ? 'PUBLISHED' : 'DRAFT'}</span>
            </div>
            <h1 className="font-display text-lg font-bold text-white mb-2">{course.title}</h1>
            {course.description && (
              <p className="text-xs text-sky-300/50 leading-relaxed">{course.description}</p>
            )}
            <div className="hud-divider my-3" />
            <div className="instrument text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-sky-400/40">MODULES</span>
                <span className="text-sky-300">{course.modules?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sky-400/40">INSTRUCTOR</span>
                <span className="text-sky-300">{instructorFirst || '—'}</span>
              </div>
            </div>
          </div>

          <div className="cockpit-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
              <h3 className="font-display text-sm font-semibold text-white">Course Content</h3>
              {canEdit && (
                <button onClick={() => setShowAddModule(!showAddModule)} className="btn-ghost p-1">
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {showAddModule && (
              <div className="p-3 border-b border-white/[0.05] flex gap-2">
                <input value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)}
                  className="form-input flex-1 py-2 text-xs" placeholder="Module title..." />
                <button className="btn-primary px-3 py-2 text-xs" onClick={addModule}>Add</button>
              </div>
            )}

            {(course.modules || []).length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-sky-400/30">NO MODULES YET</div>
            ) : (
              <div>
                {(course.modules || []).map((mod, mi) => (
                  <div key={mod.id} className="border-b border-white/[0.04] last:border-0">
                    <button onClick={() => toggleModule(mod.id)}
                      className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left">
                      {expandedModules.has(mod.id)
                        ? <ChevronDown className="w-3.5 h-3.5 text-sky-400/40 flex-shrink-0" />
                        : <ChevronRight className="w-3.5 h-3.5 text-sky-400/40 flex-shrink-0" />}
                      <span className="text-xs font-mono text-sky-400/50 w-5">{mi + 1}.</span>
                      <span className="text-sm font-medium text-white truncate">{mod.title}</span>
                    </button>

                    {expandedModules.has(mod.id) && (
                      <div className="pb-2">
                        {(mod.lessons || []).map((lesson) => {
                          const hasContent = lesson.type === 'TEXT'
                            ? !!lesson.content
                            : (lesson.questions?.length ?? 0) > 0;
                          return (
                            <button key={lesson.id}
                              onClick={() => handleSelectLesson(lesson, mod.id)}
                              className={cn(
                                'w-full flex items-center gap-2 px-8 py-2 text-left transition-colors hover:bg-white/[0.03]',
                                activeLesson?.lesson.id === lesson.id && 'bg-sky-900/20'
                              )}>
                              {lesson.type === 'QUIZ'
                                ? <HelpCircle className="w-3.5 h-3.5 text-amber-400/60 flex-shrink-0" />
                                : <FileText className="w-3.5 h-3.5 text-sky-400/40 flex-shrink-0" />}
                              <span className={cn('text-xs truncate flex-1',
                                activeLesson?.lesson.id === lesson.id ? 'text-amber-300' : 'text-sky-300/60'
                              )}>
                                {lesson.title}
                              </span>
                              {/* Red dot = no content yet */}
                              {!hasContent && canEdit && (
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400/60 flex-shrink-0" title="No content yet" />
                              )}
                            </button>
                          );
                        })}
                        {canEdit && (
                          <AddLessonButton
                            courseId={course.id}
                            moduleId={mod.id}
                            onAdded={() => loadCourse(course.id)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex-1 min-w-0">
          {activeLesson ? (
            <div className="cockpit-card p-6 animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                {activeLesson.lesson.type === 'QUIZ'
                  ? <HelpCircle className="w-5 h-5 text-amber-400" />
                  : <FileText className="w-5 h-5 text-sky-400" />}
                <h2 className="font-display text-xl font-bold text-white">{activeLesson.lesson.title}</h2>
                <span className="badge badge-approved ml-2">{activeLesson.lesson.type}</span>

                {canEdit && (
                  <button
                    onClick={() => setContentMode(m => m === 'view' ? 'edit' : 'view')}
                    className={cn(
                      'ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all border',
                      contentMode === 'edit'
                        ? 'bg-amber-400/10 border-amber-400/30 text-amber-400'
                        : 'bg-white/5 border-white/10 text-sky-400/50 hover:text-sky-300'
                    )}>
                    <Edit3 className="w-3 h-3" />
                    {contentMode === 'edit' ? 'Editing' : 'Edit'}
                  </button>
                )}
              </div>
              <div className="hud-divider" />

              {activeLesson.lesson.type === 'TEXT' ? (
                contentMode === 'edit' && canEdit ? (
                  <TextLessonEditor
                    lesson={activeLesson.lesson}
                    courseId={course.id}
                    moduleId={activeLesson.moduleId}
                    onSaved={handleContentSaved}
                  />
                ) : (
                  <div className="text-sm text-sky-200/70 leading-relaxed whitespace-pre-wrap">
                    {activeLesson.lesson.content || (
                      <span className="text-sky-400/30 italic">
                        No content yet.{canEdit && ' Click "Edit" to add content.'}
                      </span>
                    )}
                  </div>
                )
              ) : (
                contentMode === 'edit' && canEdit ? (
                  <QuizEditor
                    lesson={activeLesson.lesson}
                    courseId={course.id}
                    moduleId={activeLesson.moduleId}
                    onSaved={handleContentSaved}
                  />
                ) : (
                  <QuizPlayer
                    lesson={activeLesson.lesson}
                    courseId={course.id}
                    moduleId={activeLesson.moduleId}
                    onComplete={() => setActiveLesson(null)}
                  />
                )
              )}
            </div>
          ) : (
            <div className="cockpit-card p-16 text-center">
              <PlayCircle className="w-12 h-12 text-sky-400/20 mx-auto mb-3" />
              <h3 className="font-display text-lg text-white mb-1">Select a Lesson</h3>
              <p className="text-xs text-sky-400/40 font-mono">CHOOSE FROM THE COURSE OUTLINE</p>
              {canEdit && (
                <p className="text-xs text-amber-400/40 font-mono mt-2">
                  Red dots = lessons with no content yet
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add Lesson Button ─────────────────────────────────────────────────────────
function AddLessonButton({ courseId, moduleId, onAdded }: {
  courseId: string; moduleId: string; onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'TEXT' });

  const add = async () => {
    if (!form.title.trim()) return;
    try {
      await courseApi.createLesson(courseId, moduleId, { title: form.title, type: form.type, isPublished: true });
      toast.success('Lesson added — click it to add content');
      onAdded();
      setOpen(false);
      setForm({ title: '', type: 'TEXT' });
    } catch (err) { toast.error(getApiError(err)); }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="flex items-center gap-1.5 px-8 py-1.5 text-xs text-sky-400/30 hover:text-sky-300 transition-colors w-full">
      <Plus className="w-3 h-3" /> Add Lesson
    </button>
  );

  return (
    <div className="px-6 pb-3 space-y-2">
      <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        className="form-input text-xs py-2" placeholder="Lesson title..." />
      <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
        className="form-input text-xs py-2">
        <option value="TEXT">Text Lesson</option>
        <option value="QUIZ">Quiz</option>
      </select>
      <div className="flex gap-2">
        <button className="btn-ghost text-xs py-1.5 flex-1" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn-primary text-xs py-1.5 flex-1" onClick={add}>Add</button>
      </div>
    </div>
  );
}