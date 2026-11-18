import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronDown,
  Database,
  Download,
  FileQuestion,
  Upload,
  Users,
} from 'lucide-react';
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
  Pill,
  StatTile,
  Td,
  Th,
} from '@/components/dashboard/DashboardUI';
import { apiGet, apiPost } from '@/lib/api';
import { ROUTES } from '@/routes/paths';
import type {
  DatabaseImportResult,
  ExamDatabaseFullDetail,
  ExamDatabaseSnapshot,
  SnapshotExam,
  SnapshotQuestion,
  SnapshotResult,
} from './exam-database/types';

const formatDate = (value?: string | null) => {
  if (!value) return 'Not yet';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not yet' : date.toLocaleString();
};

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const modeLabel = (mode?: string | null) =>
  mode === 'MOVE' ? 'Exported & removed' : mode === 'COPY' ? 'Exported only' : 'No export yet';

const resultRows = (exam: SnapshotExam) => [
  ...(exam.onlineResults ?? []).map((result) => ({ ...result, mode: 'Online' as const })),
  ...(exam.offlineResults ?? []).map((result) => ({ ...result, mode: 'Offline' as const })),
];

const QuestionDetails = ({ question, index, subjects }: {
  question: SnapshotQuestion;
  index: number;
  subjects: Record<string, string>;
}) => (
  <details className="group border border-line bg-white">
    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-3 py-2.5">
      <span className="min-w-0">
        <span className="block text-xs font-bold text-ink">
          Q{index + 1} · {subjects[question.subjectId] ?? 'Unknown subject'}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{question.question}</span>
      </span>
      <ChevronDown size={14} className="mt-0.5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
    </summary>
    <div className="space-y-2 border-t border-line px-3 py-3 text-xs">
      <p className="whitespace-pre-wrap leading-5 text-ink">{question.question}</p>
      <div className="flex flex-wrap gap-2">
        <Pill tone="sky">{question.type ?? 'MULTIPLE_CHOICE'}</Pill>
        <Pill tone="emerald">Answer: {question.correct_answer}</Pill>
      </div>
      {Array.isArray(question.incorrect_answers) && question.incorrect_answers.length > 0 && (
        <p className="text-muted">
          <b className="text-ink">Options:</b> {question.incorrect_answers.join(' · ')}
        </p>
      )}
      {question.explanation && (
        <p className="text-muted">
          <b className="text-ink">Explanation:</b> {question.explanation}
        </p>
      )}
      {question.author && (
        <p className="text-muted">
          <b className="text-ink">Author:</b> {question.author}
        </p>
      )}
      {question.img && (
        <p className="text-muted">
          <b className="text-ink">Image:</b>{' '}
          <a href={question.img} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            Open image
          </a>
        </p>
      )}
      {question.question_file && (
        <p className="text-muted">
          <b className="text-ink">Question file:</b>{' '}
          <a href={question.question_file} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            Open file
          </a>
        </p>
      )}
      {question.custom != null && (
        <div>
          <p className="font-bold text-ink">Custom / AI metadata</p>
          <pre className="scroll-db mt-1 max-h-40 overflow-auto rounded bg-cream p-2 text-[10px] leading-4 text-muted">
            {JSON.stringify(question.custom, null, 2)}
          </pre>
        </div>
      )}
    </div>
  </details>
);

const ResultDetails = ({ result, subjects }: { result: SnapshotResult & { mode: 'Online' | 'Offline' }; subjects: Record<string, string> }) => (
  <details className="group border border-line bg-white">
    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-3 py-2.5">
      <span className="min-w-0">
        <span className="block text-xs font-bold text-ink">{result.userName || result.userEmail}</span>
        <span className="block text-[11px] text-muted">
          {result.userEmail} · {result.mode} · {new Date(result.date).toLocaleString()}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <Pill tone={result.overallScore >= 75 ? 'emerald' : result.overallScore < 40 ? 'rose' : 'sky'}>
          {Math.round(result.overallScore)}%
        </Pill>
        <span className="text-[10px] text-muted">
          {result.attempted_questions}/{result.total_questions}
        </span>
        <ChevronDown size={14} className="text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
      </span>
    </summary>
    <div className="space-y-3 border-t border-line px-3 py-3">
      <div className="flex flex-wrap gap-2 text-[11px] text-muted">
        <span>Submitted: <b className="text-ink">{result.submitted ? 'Yes' : 'No'}</b></span>
        <span>Deployment: <b className="text-ink">{result.deploymentId ?? '—'}</b></span>
        <span>Attempts: <b className="text-ink">{result.attempts?.length ?? 0}</b></span>
      </div>
      {result.subjectScores && Object.keys(result.subjectScores).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(result.subjectScores).map(([subjectId, raw]) => {
            const value = raw as { correct?: number; total?: number };
            return (
              <span key={subjectId} className="rounded border border-line bg-cream px-2 py-1 text-[10px]">
                <b>{subjects[subjectId] ?? 'Subject'}</b> {value?.correct ?? 0}/{value?.total ?? 0}
              </span>
            );
          })}
        </div>
      )}
      {result.attempts && result.attempts.length > 0 ? (
        <div className="scroll-db max-h-56 overflow-auto">
          <table className="w-full min-w-[560px] text-left text-[11px]">
            <thead className="bg-cream">
              <tr>
                <Th>Question ID</Th>
                <Th>Attempted</Th>
                <Th>Visited</Th>
                <Th>Option</Th>
                <Th>Text answer</Th>
              </tr>
            </thead>
            <tbody>
              {result.attempts.map((attempt, index) => (
                <tr key={`${attempt.questionId}-${index}`} className="border-t border-line">
                  <Td className="font-mono text-[10px] text-muted">{attempt.questionId}</Td>
                  <Td>{attempt.attempted ? 'Yes' : 'No'}</Td>
                  <Td>{attempt.visited ? 'Yes' : 'No'}</Td>
                  <Td>{attempt.userOption ?? '—'}</Td>
                  <Td>{attempt.userTextAnswer ?? '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-muted">No answer attempts saved with this result.</p>
      )}
    </div>
  </details>
);

const SnapshotSection = ({ snapshot }: { snapshot: ExamDatabaseSnapshot }) => {
  const subjects = Object.fromEntries(snapshot.subjects.map((subject) => [subject.id, subject.name]));
  return (
    <details className="border border-line bg-white">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 bg-cream px-4 py-3">
        <span>
          <span className="block font-display text-base font-extrabold text-ink">{snapshot.class.name}</span>
          <span className="mt-0.5 block text-xs text-muted">
            {snapshot.summary.exams} exam(s) · {snapshot.summary.subjects} subject(s) · {snapshot.summary.questions} question(s) · {snapshot.summary.results} result(s) · {snapshot.summary.attempts} attempt(s)
          </span>
        </span>
        <span className="flex items-center gap-2">
          <Pill tone={snapshot.mode === 'MOVE' ? 'rose' : 'emerald'}>{modeLabel(snapshot.mode)}</Pill>
          <span className="text-[11px] text-muted">{formatDate(snapshot.exportedAt)}</span>
          <ChevronDown size={16} className="text-muted" aria-hidden="true" />
        </span>
      </summary>
      <div className="space-y-3 border-t border-line px-4 py-4">
        {snapshot.subjects.length > 0 && (
          <div>
            <p className="text-xs font-bold text-ink">Subjects in this snapshot</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {snapshot.subjects.map((subject) => (
                <span key={subject.id} className="rounded border border-line bg-cream px-2 py-1 text-[11px]">
                  {subject.name}
                  {subject.code ? <span className="ml-1 text-muted">({subject.code})</span> : null}
                </span>
              ))}
            </div>
          </div>
        )}

        {snapshot.exams.length === 0 ? (
          <p className="border border-dashed border-line bg-cream px-4 py-4 text-sm text-muted">
            This snapshot has no exams.
          </p>
        ) : (
          snapshot.exams.map((exam) => {
            const results = resultRows(exam);
            return (
              <details key={exam.id} className="border border-line">
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 bg-brand-50/70 px-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink">{exam.exam_name}</span>
                    <span className="mt-0.5 block text-[11px] text-muted">
                      {exam.combination?.name ? `${exam.combination.name} · ` : ''}
                      {exam.minutes} minutes · {exam.subjectIds.length} subject(s) · {exam.questions.length} question(s) · {results.length} result(s)
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    {exam.visible === false && <Pill tone="rose">Hidden</Pill>}
                    <ChevronDown size={14} className="text-muted" aria-hidden="true" />
                  </span>
                </summary>
                <div className="space-y-4 border-t border-line px-3 py-3">
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-ink">
                      <FileQuestion size={13} aria-hidden="true" /> Questions
                    </p>
                    {exam.questions.length === 0 ? (
                      <p className="text-xs text-muted">No questions in this exam snapshot.</p>
                    ) : (
                      <div className="scroll-db max-h-80 space-y-1.5 overflow-y-auto pr-1">
                        {exam.questions.map((question, index) => (
                          <QuestionDetails key={question.id} question={question} index={index} subjects={subjects} />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-ink">
                      <Users size={13} aria-hidden="true" /> Results and answer attempts
                    </p>
                    {results.length === 0 ? (
                      <p className="text-xs text-muted">No results saved in this exam snapshot.</p>
                    ) : (
                      <div className="scroll-db max-h-96 space-y-1.5 overflow-y-auto pr-1">
                        {results.map((result) => (
                          <ResultDetails key={`${result.mode}-${result.id}`} result={result} subjects={subjects} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </details>
            );
          })
        )}
      </div>
    </details>
  );
};

export const AdminDatabaseDetailPage = () => {
  const { databaseId = '' } = useParams<{ databaseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [importing, setImporting] = useState(false);

  const detail = useQuery({
    queryKey: ['exam-database-full', databaseId],
    queryFn: async () => (await apiGet<ExamDatabaseFullDetail>(`/exam-databases/${databaseId}/full`)).data,
    enabled: Boolean(databaseId),
  });

  const download = async () => {
    if (!detail.data) return;
    setDownloading(true);
    setNotice(null);
    try {
      const response = await apiGet(`/exam-databases/${detail.data.id}/download`);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${detail.data.name.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || 'exam-database'}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setNotice({ text: `Downloaded "${detail.data.name}".`, tone: 'ok' });
    } catch (error: any) {
      setNotice({ text: error?.message ?? 'Download failed', tone: 'error' });
    } finally {
      setDownloading(false);
    }
  };

  const importDatabase = async () => {
    if (!detail.data) return;
    if (
      !window.confirm(
        `Import "${detail.data.name}" back into Exam & Test? Existing exams, questions and results with the same identity are updated in place.`,
      )
    ) {
      return;
    }
    setImporting(true);
    setNotice(null);
    try {
      const response = await apiPost<DatabaseImportResult>(`/exam-databases/${detail.data.id}/import`);
      const result = response.data;
      setNotice({
        text: `Imported ${result.exams} exam(s), ${result.questions} question(s), ${result.results} result(s) and ${result.attempts} attempt(s).`,
        tone: 'ok',
      });
      void queryClient.invalidateQueries({ queryKey: ['exam-databases'] });
      void queryClient.invalidateQueries({ queryKey: ['exam-databases-overview'] });
      void queryClient.invalidateQueries({ queryKey: ['exam-database-full', databaseId] });
    } catch (error: any) {
      setNotice({ text: error?.message ?? 'Import failed', tone: 'error' });
    } finally {
      setImporting(false);
    }
  };

  if (detail.isPending) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Exam & Test" title="Database details" text="Loading every saved snapshot, exam, question, result and attempt." />
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Exam & Test" title="Database details" text="The requested database could not be loaded." />
        <ErrorState message="Could not load this database." onRetry={() => detail.refetch()} />
        <button type="button" onClick={() => navigate(ROUTES.adminDatabase)} className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
          Back to databases
        </button>
      </div>
    );
  }

  const database = detail.data;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exam & Test"
        title={database.name}
        text={database.description || 'Every class snapshot, subject, exam, question, result and answer attempt saved in this database.'}
        actions={
          <>
            <Link
              to={ROUTES.adminDatabase}
              className="inline-flex min-h-11 items-center gap-2 rounded border border-line bg-white px-4 py-2.5 text-sm font-bold hover:border-brand-500 hover:text-brand-700"
            >
              <ArrowLeft size={15} aria-hidden="true" /> Databases
            </Link>
            <button
              type="button"
              onClick={download}
              disabled={downloading}
              className="inline-flex min-h-11 items-center gap-2 rounded border border-line bg-white px-4 py-2.5 text-sm font-bold hover:border-brand-500 hover:text-brand-700 disabled:opacity-50"
            >
              <Download size={15} aria-hidden="true" /> {downloading ? 'Preparing...' : 'Download JSON'}
            </button>
            <button
              type="button"
              onClick={importDatabase}
              disabled={importing || database.examCount === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              <Upload size={15} aria-hidden="true" /> {importing ? 'Importing...' : 'Import to Exam & Test'}
            </button>
          </>
        }
      />

      {notice && (
        <p
          role="status"
          className={`border-l-2 px-4 py-3 text-sm ${
            notice.tone === 'error'
              ? 'border-rose-400 bg-rose-50 text-rose-800'
              : 'border-lime-accent bg-brand-50 text-brand-800'
          }`}
        >
          {notice.text}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Classes" value={String(database.classCount)} hint="saved snapshots" />
        <StatTile label="Exams" value={String(database.examCount)} hint={`${database.subjectCount} subjects`} />
        <StatTile label="Questions" value={String(database.questionCount)} hint={`${database.attemptCount} attempts`} />
        <StatTile label="Results" value={String(database.resultCount)} hint={formatBytes(database.sizeBytes)} />
      </div>

      <Card>
        <CardHead title="Database record" sub={`Created ${formatDate(database.createdAt)}`} />
        <div className="grid gap-4 px-5 py-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Last export</p>
            <p className="mt-1 font-semibold text-ink">{formatDate(database.lastExportedAt)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Last import</p>
            <p className="mt-1 font-semibold text-ink">{formatDate(database.lastImportedAt)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Last mode</p>
            <p className="mt-1"><Pill tone={database.lastMode === 'MOVE' ? 'rose' : 'emerald'}>{modeLabel(database.lastMode)}</Pill></p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Created by</p>
            <p className="mt-1 font-semibold text-ink">{database.createdByName || 'Unknown'}</p>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-brand-700">Snapshots</p>
            <h2 className="font-display text-lg font-extrabold text-ink">Class-by-class detail</h2>
          </div>
          <p className="text-xs text-muted">
            <Database size={13} className="mr-1 inline" aria-hidden="true" />
            {database.snapshots.length} snapshot(s)
          </p>
        </div>
        {database.snapshots.length === 0 ? (
          <Card className="p-5">
            <EmptyState message="This database is empty. Export a class from Exam & Test into it." />
          </Card>
        ) : (
          database.snapshots.map((snapshot) => <SnapshotSection key={snapshot.id} snapshot={snapshot} />)
        )}
      </div>
    </div>
  );
};
