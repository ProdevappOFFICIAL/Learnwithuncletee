import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  Lightbulb,
  Printer,
  Target,
  XCircle,
} from 'lucide-react';
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  Pill,
  StatTile,
} from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { ROUTES } from '@/routes/paths';

interface ReportQuestion {
  id: string;
  question: string;
  yourAnswer: string;
}

interface ReportWrongQuestion extends ReportQuestion {
  correctAnswer: string;
  explanation: string | null;
  focus: string;
  status: 'wrong' | 'skipped';
}

interface ReportSubject {
  id: string;
  name: string;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
  percentage: number;
  grade: string;
  remark: string;
  correctQuestions: ReportQuestion[];
  wrongQuestions: ReportWrongQuestion[];
  advice: { title: string; text: string };
}

interface ExamReport {
  result: {
    id: string;
    origin: 'ONLINE' | 'OFFLINE';
    examName: string;
    minutes?: number;
    date: string;
    session: string | null;
    term: string | null;
    pupil: { id: string; name: string; className: string | null };
    overallScore: number;
    attemptedQuestions: number;
    totalQuestions: number;
  };
  summary: {
    overall: number;
    grade: string;
    remark: string;
    correct: number;
    wrong: number;
    skipped: number;
    totalQuestions: number;
  };
  subjects: ReportSubject[];
  weakTopics: Array<{
    subject: string;
    subjectId: string;
    topic: string;
    mistakes: number;
    examples: string[];
  }>;
  priorities: Array<{
    subjectId: string;
    subject: string;
    percentage: number;
    grade: string;
    reason: string;
    adviceTitle: string;
    adviceText: string;
    focusPoints: string[];
  }>;
  improvementPlan: Array<{ title: string; text: string }>;
  guides: Array<{ kind: string; title: string; text: string }>;
  generatedAt: string;
}

const pctLabel = (value: number) => `${Math.round(value * 10) / 10}%`;

const toneFor = (value: number): 'emerald' | 'sky' | 'amber' | 'rose' => {
  if (value >= 75) return 'emerald';
  if (value >= 60) return 'sky';
  if (value >= 40) return 'amber';
  return 'rose';
};

const guideLink = (kind: string) => {
  if (kind === 'materials') return { to: ROUTES.studentMaterials, label: 'Open study materials' };
  if (kind === 'assignments') return { to: ROUTES.studentAssignments, label: 'Open assignments' };
  return null;
};

const GuideIcon = ({ kind }: { kind: string }) => {
  if (kind === 'materials') return <BookOpenCheck size={18} aria-hidden="true" />;
  if (kind === 'assignments') return <ClipboardList size={18} aria-hidden="true" />;
  if (kind === 'exam-technique') return <Target size={18} aria-hidden="true" />;
  return <Lightbulb size={18} aria-hidden="true" />;
};

export const StudentExamReportPage = () => {
  const { origin = 'online', id = '' } = useParams<{ origin: string; id: string }>();
  const offline = origin.toLowerCase() === 'offline';
  const res = useResource<ExamReport>(
    id ? `${offline ? '/offline-results' : '/results'}/${id}/report` : null,
  );

  const backLink = (
    <Link
      to={ROUTES.studentResults}
      className="inline-flex min-h-11 items-center gap-2 rounded border border-line bg-white px-4 py-2.5 text-sm font-bold text-brand-800 hover:border-brand-500 hover:text-brand-700"
    >
      <ArrowLeft size={15} aria-hidden="true" /> Back to results
    </Link>
  );

  if (res.loading) {
    return (
      <div className="space-y-4">
        {backLink}
        <LoadingSkeleton rows={8} />
      </div>
    );
  }

  if (res.error || !res.data) {
    return (
      <div className="space-y-4">
        {backLink}
        <ErrorState message={res.error ?? 'Exam report not found'} onRetry={res.reload} />
      </div>
    );
  }

  const report = res.data;
  const { result, summary, subjects } = report;
  const weakest = subjects[0];
  const reportLink = (
    <Link
      to={ROUTES.studentResultDetail
        .replace(':origin', offline ? 'offline' : 'online')
        .replace(':id', id)}
      className="inline-flex min-h-11 items-center gap-2 rounded border border-line bg-white px-4 py-2.5 text-sm font-bold text-brand-800 hover:border-brand-500 hover:text-brand-700"
    >
      <ClipboardList size={15} aria-hidden="true" /> Full answer sheet
    </Link>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-700">
            {offline ? 'Offline sitting' : 'Online sitting'} · exam report
          </p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-ink">{result.examName}</h2>
          <p className="mt-1 text-sm text-muted">
            {new Date(result.date).toLocaleString()}
            {result.pupil.name ? ` · ${result.pupil.name}` : ''}
            {result.pupil.className ? ` · ${result.pupil.className}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          {reportLink}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-11 items-center gap-2 rounded bg-brand-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            <Printer size={15} aria-hidden="true" /> Print report
          </button>
          {backLink}
        </div>
      </div>

      <div className="border border-line bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Overall performance</p>
            <p className="mt-1 font-display text-4xl font-extrabold text-brand-700">
              {pctLabel(summary.overall)}
            </p>
            <p className="mt-1 text-sm text-muted">
              Grade {summary.grade} · {summary.remark}
            </p>
          </div>
          <Pill tone={toneFor(summary.overall)}>
            {summary.grade} · {summary.remark}
          </Pill>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Questions correct"
            value={`${summary.correct}/${summary.totalQuestions}`}
            hint={`${pctLabel(summary.totalQuestions ? (summary.correct / summary.totalQuestions) * 100 : 0)} accuracy`}
          />
          <StatTile
            label="Subjects reviewed"
            value={String(subjects.length)}
            hint={subjects.length ? 'Detailed breakdown below' : 'No subject data'}
          />
          <StatTile
            label="Attempted"
            value={`${result.attemptedQuestions}/${result.totalQuestions}`}
            hint="Questions you answered"
          />
          <StatTile
            label="Weakest subject"
            value={weakest?.name ?? '—'}
            hint={weakest ? pctLabel(weakest.percentage) : 'No subject data'}
          />
        </div>
      </div>

      {subjects.length === 0 ? (
        <Card>
          <div className="px-5 py-5">
            <EmptyState message="This sitting only has an overall score — no subject or question breakdown was stored." />
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <CardHead
              title="Subject summary"
              sub="Sorted from the weakest subject to the strongest. Use this order to plan your revision."
            />
            <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject) => (
                <div key={subject.id} className="rounded border border-line bg-cream p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-extrabold text-ink">{subject.name}</p>
                    <Pill tone={toneFor(subject.percentage)}>{pctLabel(subject.percentage)}</Pill>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className={`h-full rounded-full ${
                        subject.percentage >= 75
                          ? 'bg-emerald-500'
                          : subject.percentage >= 60
                            ? 'bg-sky-500'
                            : subject.percentage >= 40
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.max(2, Math.min(100, subject.percentage))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-muted">
                    {subject.correct}/{subject.total} correct
                    {subject.wrong > 0 ? ` · ${subject.wrong} wrong` : ''}
                    {subject.skipped > 0 ? ` · ${subject.skipped} skipped` : ''}
                  </p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-brand-700">
                    Grade {subject.grade} · {subject.remark}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead
              title="Weak areas and next focus"
              sub="The topics and questions to revisit first. Start at the top and work down."
            />
            <div className="grid gap-3 px-5 py-5 lg:grid-cols-3">
              {report.priorities.map((priority) => (
                <div key={priority.subjectId} className="rounded border border-line bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-extrabold text-ink">{priority.subject}</p>
                    <Pill tone={toneFor(priority.percentage)}>
                      {pctLabel(priority.percentage)}
                    </Pill>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-muted">{priority.reason}</p>
                  {priority.focusPoints.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {priority.focusPoints.map((focus) => (
                        <li key={focus} className="border-l-2 border-rose-300 pl-2">
                          <p className="text-xs font-bold leading-snug text-ink">{focus}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-muted">
                      No question-level detail is stored for this subject. Review your class notes and
                      ask your teacher for the marked script.
                    </p>
                  )}
                  <div className="mt-3 border-l-2 border-brand-400 bg-brand-50/60 px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700">
                      {priority.adviceTitle}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{priority.adviceText}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand-700">
                Detailed subject reports
              </p>
              <p className="mt-1 text-sm text-muted">
                Every subject, with the questions you got right, the ones to revisit, and the correct
                answers and explanations.
              </p>
            </div>
            {subjects.map((subject) => {
              const hasDetail =
                subject.correctQuestions.length > 0 || subject.wrongQuestions.length > 0;
              return (
                <Card key={subject.id}>
                  <CardHead
                    title={`${subject.name} · detailed report`}
                    sub={`${subject.correct}/${subject.total} correct · ${pctLabel(subject.percentage)} · Grade ${subject.grade}`}
                  />
                  <div className="space-y-4 px-5 py-5">
                    <div className="rounded border border-brand-200 bg-brand-50/60 px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700">
                        {subject.advice.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{subject.advice.text}</p>
                    </div>

                    {!hasDetail ? (
                      <p className="rounded border border-dashed border-line bg-cream px-4 py-4 text-sm text-muted">
                        Your recorded score for this subject is {subject.correct}/{subject.total}. The
                        question-by-question review was not stored for this sitting, so use the
                        explanation in your marked script or ask your teacher for the topics to revise.
                      </p>
                    ) : (
                      <>
                        {subject.wrongQuestions.length > 0 && (
                          <section>
                            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-rose-700">
                              <XCircle size={14} aria-hidden="true" /> Needs work (
                              {subject.wrongQuestions.length})
                            </h4>
                            <ul className="mt-2 space-y-2">
                              {subject.wrongQuestions.map((question) => (
                                <li
                                  key={question.id}
                                  className={`rounded border px-3 py-3 ${
                                    question.status === 'wrong'
                                      ? 'border-rose-200 bg-rose-50'
                                      : 'border-amber-200 bg-amber-50'
                                  }`}
                                >
                                  <p className="text-xs font-bold leading-snug text-ink">
                                    {question.question}
                                  </p>
                                  <dl className="mt-2 grid gap-1 text-[11px] sm:grid-cols-2">
                                    <div>
                                      <dt className="font-bold uppercase tracking-wider text-muted">
                                        Your answer
                                      </dt>
                                      <dd className="mt-0.5 break-words font-semibold text-rose-900">
                                        {question.yourAnswer}
                                      </dd>
                                    </div>
                                    <div>
                                      <dt className="font-bold uppercase tracking-wider text-muted">
                                        Correct answer
                                      </dt>
                                      <dd className="mt-0.5 break-words font-semibold text-emerald-800">
                                        {question.correctAnswer}
                                      </dd>
                                    </div>
                                  </dl>
                                  {question.explanation && (
                                    <p className="mt-2 border-l-2 border-rose-300 bg-white/70 px-2 py-1.5 text-[11px] leading-relaxed text-muted">
                                      <span className="font-bold text-rose-800">Why: </span>
                                      {question.explanation}
                                    </p>
                                  )}
                                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-brand-700">
                                    Focus: {question.focus}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          </section>
                        )}

                        <details className="rounded border border-emerald-200 bg-emerald-50/60">
                          <summary className="cursor-pointer list-none px-4 py-3 text-xs font-bold uppercase tracking-widest text-emerald-800">
                            <span className="inline-flex items-center gap-1.5">
                              <CheckCircle2 size={14} aria-hidden="true" /> Correct answers (
                              {subject.correctQuestions.length})
                            </span>
                          </summary>
                          <div className="border-t border-emerald-200 px-4 py-3">
                            {subject.correctQuestions.length === 0 ? (
                              <p className="text-xs text-muted">
                                No correct answers recorded for this subject yet.
                              </p>
                            ) : (
                              <ul className="space-y-2">
                                {subject.correctQuestions.map((question) => (
                                  <li
                                    key={question.id}
                                    className="rounded border border-emerald-200 bg-white px-3 py-2"
                                  >
                                    <p className="text-xs font-semibold leading-snug text-ink">
                                      {question.question}
                                    </p>
                                    <p className="mt-1 text-[11px] text-emerald-800">
                                      Your answer: {question.yourAnswer}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </details>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHead
              title="How to improve"
              sub="A simple routine you can start today. Small, consistent practice beats last-minute cramming."
            />
            <ol className="grid gap-3 px-5 py-5 sm:grid-cols-2">
              {report.improvementPlan.map((step, index) => (
                <li key={step.title} className="flex gap-3 rounded border border-line bg-cream px-4 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-extrabold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink">{step.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <CardHead
              title="Guides and support"
              sub="Use these resources when you are stuck or want to practise more."
            />
            <div className="grid gap-3 px-5 py-5 sm:grid-cols-2">
              {report.guides.map((guide) => {
                const link = guideLink(guide.kind);
                const content = (
                  <>
                    <span className="flex h-9 w-9 items-center justify-center rounded bg-brand-50 text-brand-700">
                      <GuideIcon kind={guide.kind} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink">{guide.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">{guide.text}</p>
                      {link && (
                        <p className="mt-2 text-xs font-bold text-brand-700 underline underline-offset-4">
                          {link.label}
                        </p>
                      )}
                    </div>
                  </>
                );
                return link ? (
                  <Link
                    key={guide.kind}
                    to={link.to}
                    className="flex gap-3 rounded border border-line bg-white px-4 py-3 hover:border-brand-500 hover:bg-brand-50/40"
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={guide.kind} className="flex gap-3 rounded border border-line bg-cream px-4 py-3">
                    {content}
                  </div>
                );
              })}
            </div>
          </Card>

          <p className="text-center text-[11px] text-muted">
            Report generated {new Date(report.generatedAt).toLocaleString()}
          </p>
        </>
      )}
    </div>
  );
};
