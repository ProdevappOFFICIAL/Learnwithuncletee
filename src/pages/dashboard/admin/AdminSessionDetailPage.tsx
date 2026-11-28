import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiDelete, apiGet } from '@/lib/api';
import {
  Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, Modal, PageHeader, Pill,
} from '@/components/dashboard/DashboardUI';
import { ArrowLeft, Camera, CheckCircle2, Trash2, XCircle, Clock, User, BookOpen, Minus } from 'lucide-react';

interface QuestionDetail {
  questionId: string;
  questionText: string;
  correctAnswer: string;
  incorrectAnswers: string[];
  type: string;
  studentAnswer: string | null;
  isCorrect: boolean;
  subjectId?: string;
  subjectName?: string | null;
  visited: boolean;
  attempted: boolean;
}

interface SessionDetail {
  id: string;
  submitted: boolean;
  marked: boolean;
  timeLeft?: number | null;
  overallScore?: number | null;
  startedAt?: string | null;
  lastActive?: string | null;
  lastAction?: string | null;
  currentQuestion?: number | null;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  user?: { id: string; user_name: string; user_email: string; class?: { name: string } | null };
  exam?: { id: string; exam_name: string; minutes: number };
  deployment?: { id: string; code: string } | null;
  clientEnvironment?: 'WEB' | 'DESKTOP';
  proctorPhotoUrl?: string | null;
  proctorPhotoCapturedAt?: string | null;
  proctorPhotoSource?: string | null;
  proctorPhotoStatus?: string;
  questionDetail: QuestionDetail[];
}

const fmtTime = (secs?: number | null) => {
  if (secs == null) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const stripHtml = (html: string) => {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || html;
  } catch {
    return html;
  }
};

export const AdminSessionDetailPage = () => {
  const { mode, id } = useParams<{ mode: string; id: string }>();
  const navigate = useNavigate();
  const [photoOpen, setPhotoOpen] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);

  const endpoint = mode === 'online'
    ? `/exam-sessions/online/${id}`
    : `/exam-sessions/offline/${id}`;

  const { data: res, isPending, isError, refetch } = useQuery({
    queryKey: ['session-detail', mode, id],
    queryFn: () => apiGet<SessionDetail>(endpoint),
    enabled: !!id && !!mode,
  });

  const session: SessionDetail | undefined = (res as any)?.data ?? res;

  const deletePhoto = async () => {
    if (!session || !confirm('Delete this proctoring photo? This cannot be undone.')) return;
    setDeletingPhoto(true);
    try {
      await apiDelete(`/exam-sessions/online/${session.id}/photo`);
      await refetch();
      setPhotoOpen(false);
    } catch (error: any) {
      alert(error?.message ?? 'Could not delete the photo.');
    } finally {
      setDeletingPhoto(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 rounded border border-line px-3 py-2 text-xs font-medium text-muted hover:border-brand-500 hover:text-brand-700 transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <PageHeader
          eyebrow={`Sessions — ${mode === 'online' ? 'Online' : 'Offline'}`}
          title="Session Detail"
          text="Full question-by-question breakdown of this student's exam sitting."
        />
      </div>

      {isPending && <div className="px-5 py-5"><LoadingSkeleton rows={8} /></div>}
      {isError && <ErrorState message="Could not load session detail" onRetry={refetch} />}

      {session && (
        <>
          {/* ── Info Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Student */}
            <div className="border border-line bg-white rounded-md p-4 space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted font-medium flex items-center gap-1">
                <User size={10} /> Student
              </p>
              <p className="font-bold text-sm text-ink">{session.user?.user_name ?? '—'}</p>
              <p className="text-xs text-muted">{session.user?.user_email ?? ''}</p>
              {session.user?.class && <p className="text-xs text-muted">{session.user.class.name}</p>}
            </div>
            {/* Exam */}
            <div className="border border-line bg-white rounded-md p-4 space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted font-medium flex items-center gap-1">
                <BookOpen size={10} /> Exam
              </p>
              <p className="font-bold text-sm text-ink">{session.exam?.exam_name ?? '—'}</p>
              <p className="text-xs text-muted">{session.exam?.minutes} min allowed</p>
              {session.deployment && <p className="text-xs font-mono text-violet-700">{session.deployment.code}</p>}
            </div>
            {/* Status */}
            <div className="border border-line bg-white rounded-md p-4 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-muted font-medium flex items-center gap-1">
                <Clock size={10} /> Status
              </p>
              <div className="flex flex-wrap gap-1.5">
                {session.submitted
                  ? <Pill tone="emerald">Submitted</Pill>
                  : <Pill tone="rose">Not Submitted</Pill>}
                {session.marked
                  ? <Pill tone="emerald">Marked</Pill>
                  : <Pill tone="amber">Unmarked</Pill>}
              </div>
              <p className="text-xs text-muted">Time left: <b className="text-ink">{fmtTime(session.timeLeft)}</b></p>
              {session.lastActive && (
                <p className="text-xs text-muted">Last active: {new Date(session.lastActive).toLocaleString()}</p>
              )}
              {session.lastAction && (
                <p className="text-xs text-muted">
                  Last action:{' '}
                  <b className="text-ink">
                    {session.lastAction
                      .toLowerCase()
                      .split('_')
                      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                      .join(' ')}
                  </b>
                  {session.currentQuestion != null ? ` · question ${session.currentQuestion + 1}` : ''}
                </p>
              )}
            </div>
            {/* Score */}
            <div className="border border-line bg-white rounded-md p-4 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-muted font-medium">Score</p>
              {session.overallScore != null ? (
                <p className={`text-3xl font-display font-bold ${session.overallScore >= 75 ? 'text-emerald-700' : session.overallScore < 40 ? 'text-rose-700' : 'text-sky-700'}`}>
                  {Math.round(session.overallScore)}%
                </p>
              ) : (
                <p className="text-xl font-display text-muted">Unscored</p>
              )}
              <p className="text-xs text-muted">
                {session.correctCount ?? 0}/{session.totalQuestions ?? 0} correct
                {' · '}
                {session.answeredCount ?? 0} answered
              </p>
            </div>
          </div>

          <Card>
            <CardHead
              title="Identity photo"
              sub="Admins only · captured before the exam questions were released"
            />
            <div className="flex flex-wrap items-center gap-5 p-5">
              {session.proctorPhotoUrl ? (
                <>
                  <button
                    type="button"
                    onClick={() => setPhotoOpen(true)}
                    className="overflow-hidden rounded border border-line"
                    aria-label="View proctoring photo"
                  >
                    <img
                      src={session.proctorPhotoUrl}
                      alt="Pupil identity snapshot"
                      className="h-28 w-36 object-cover"
                    />
                  </button>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-bold text-ink">
                      {session.user?.user_name ?? 'Pupil'} ·{' '}
                      <span className="font-normal text-muted">
                        {session.clientEnvironment === 'DESKTOP' ? 'Desktop browser' : 'Web browser'}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Captured:{' '}
                      {session.proctorPhotoCapturedAt
                        ? new Date(session.proctorPhotoCapturedAt).toLocaleString()
                        : 'Time not recorded'}
                      {session.proctorPhotoSource ? ` · ${session.proctorPhotoSource}` : ''}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setPhotoOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded bg-brand-900 px-3 py-2 text-xs font-bold text-white hover:bg-brand-700"
                      >
                        <Camera size={13} /> View image
                      </button>
                      <button
                        type="button"
                        onClick={deletePhoto}
                        disabled={deletingPhoto}
                        className="inline-flex items-center gap-1.5 rounded border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Trash2 size={13} /> {deletingPhoto ? 'Deleting…' : 'Delete image'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 text-sm text-muted">
                  <Camera size={22} className="text-muted" />
                  <span>
                    {session.proctorPhotoStatus === 'PENDING'
                      ? 'The pupil has not captured a photo yet.'
                      : 'No proctoring photo was captured for this sitting.'}
                  </span>
                </div>
              )}
            </div>
          </Card>

          <Modal
            open={photoOpen && Boolean(session.proctorPhotoUrl)}
            onClose={() => setPhotoOpen(false)}
            title={`Identity photo — ${session.user?.user_name ?? 'Pupil'}`}
            size="lg"
          >
            {session.proctorPhotoUrl && (
              <div className="space-y-3">
                <img
                  src={session.proctorPhotoUrl}
                  alt="Pupil identity snapshot"
                  className="max-h-[65vh] w-full rounded border border-line object-contain"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={deletePhoto}
                    disabled={deletingPhoto}
                    className="inline-flex items-center gap-1.5 rounded border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <Trash2 size={13} /> Delete image
                  </button>
                </div>
              </div>
            )}
          </Modal>

          {/* ── Question Breakdown ── */}
          <Card>
            <CardHead
              title="Question Responses"
              sub={`${session.questionDetail?.length ?? 0} question(s)`}
            />

            {!session.questionDetail || session.questionDetail.length === 0 ? (
              <div className="px-5 py-5">
                <EmptyState message="No question responses found for this session." />
              </div>
            ) : (
              <div className="divide-y divide-line">
                {session.questionDetail.map((q, idx) => (
                  <div key={q.questionId} className="px-5 py-4 space-y-2">
                    {/* Question header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-cream text-[10px] font-bold text-muted">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          {q.subjectName && (
                            <span className="text-[10px] font-medium uppercase tracking-wider text-brand-700 mb-0.5 block">{q.subjectName}</span>
                          )}
                          <p className="text-sm text-ink leading-relaxed font-medium">
                            {stripHtml(q.questionText)}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {!q.attempted ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted border border-line rounded px-2 py-0.5">
                            <Minus size={11} /> Not answered
                          </span>
                        ) : q.isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 border border-emerald-200 bg-emerald-50 rounded px-2 py-0.5 font-medium">
                            <CheckCircle2 size={12} /> Correct
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-rose-700 border border-rose-200 bg-rose-50 rounded px-2 py-0.5 font-medium">
                            <XCircle size={12} /> Wrong
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Answers grid */}
                    <div className="ml-9 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Student's answer */}
                      <div className={`rounded border px-3 py-2 text-xs ${
                        !q.attempted
                          ? 'border-line bg-cream text-muted'
                          : q.isCorrect
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-rose-200 bg-rose-50 text-rose-800'
                      }`}>
                        <p className="text-[10px] font-medium uppercase tracking-wider mb-0.5 opacity-60">Student's Answer</p>
                        <p className="font-medium">{q.studentAnswer ?? <em className="opacity-50">No answer</em>}</p>
                      </div>
                      {/* Correct answer */}
                      {!q.isCorrect && q.attempted && (
                        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                          <p className="text-[10px] font-medium uppercase tracking-wider mb-0.5 opacity-60">Correct Answer</p>
                          <p className="font-medium">{q.correctAnswer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};
