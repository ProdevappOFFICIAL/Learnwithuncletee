import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpenCheck, Download, Eye, FileBarChart2, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import {
  Card,
  CardHead,
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  Pill,
} from '@/components/dashboard/DashboardUI';
import { useAuth } from '@/context/AuthContext';
import { apiGet } from '@/lib/api';
import { ACADEMIC_TERMS, useAcademicSettings } from '@/lib/academic';
import { sessionOptions } from '@/data/dashboard';
import { downloadNodeAsPng } from '@/lib/studentIdCard';
import ReportCard, { type ReportSubject } from '@/components/ui/ReportCard';
import type { GeneratedReportCard } from '@/pages/dashboard/admin/result-generator/types';

interface ResultNotificationAvailability {
  session: string;
  term: string;
  disabled: boolean;
  available: boolean;
  status: 'AVAILABLE' | 'DISABLED' | 'NOT_STARTED' | 'CLOSED';
  message: string;
  termStart: string;
  termEnd: string;
  visibleUntil: string;
}

interface AttemptRow {
  id: string;
  overallScore: number;
  attempted_questions: number;
  total_questions: number;
  date: string;
  exam?: { exam_name: string };
  subjectScores?: Record<string, { correct: number; total: number }>;
  subjectNames?: Record<string, string>;
}

export const StudentResultNotificationPage = () => {
  const { user } = useAuth();
  const academic = useAcademicSettings();
  const [session, setSession] = useState('');
  const [term, setTerm] = useState('');
  const [card, setCard] = useState<GeneratedReportCard | null>(null);
  const [fetchedPeriod, setFetchedPeriod] = useState<{ session: string; term: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<ResultNotificationAvailability | null>(null);
  const [availability, setAvailability] = useState<ResultNotificationAvailability | null>(null);
  const [onlineAttempts, setOnlineAttempts] = useState<AttemptRow[]>([]);
  const [offlineAttempts, setOfflineAttempts] = useState<AttemptRow[]>([]);
  const sheetRef = useRef<HTMLDivElement>(null);

  const currentSession = academic.data?.data.session ?? '';
  const currentTerm = academic.data?.data.term ?? '';
  const effectiveSession = session || currentSession;
  const effectiveTerm = term || currentTerm;
  const sessions = academic.data?.data.sessionOptions ?? sessionOptions();

  useEffect(() => {
    if (!session && currentSession) setSession(currentSession);
    if (!term && currentTerm) setTerm(currentTerm);
  }, [currentSession, currentTerm, session, term]);

  const subjects = useMemo<ReportSubject[]>(
    () =>
      (card?.subjects ?? []).map((subject) => ({
        lines: subject.lines,
        cbt1: subject.cbt1 ?? undefined,
        cbt2: subject.cbt2 ?? undefined,
        exam: subject.exam ?? undefined,
        lastCum: subject.lastCum ?? undefined,
        overall: subject.overall ?? undefined,
      })),
    [card],
  );

  const getResults = async () => {
    if (!user?.id || !effectiveSession || !effectiveTerm) {
      setError('Your account or the academic period is not ready yet.');
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);
    setBlocked(null);
    setAvailability(null);
    setCard(null);
    setFetchedPeriod(null);
    setOnlineAttempts([]);
    setOfflineAttempts([]);
    try {
      const availabilityResponse = await apiGet<ResultNotificationAvailability>(
        '/settings/result-notification/availability',
        { session: effectiveSession, term: effectiveTerm },
      );
      setAvailability(availabilityResponse.data);
      if (!availabilityResponse.data.available) {
        setBlocked(availabilityResponse.data);
        return;
      }
      // Full result = the published report sheet plus both exam-attempt stores
      // for the same session and term. The list endpoints force-scope pupils
      // to their own rows on the server.
      const [response, online, offline] = await Promise.all([
        apiGet<GeneratedReportCard | null>(`/report-cards/student/${user.id}`, {
          session: effectiveSession,
          term: effectiveTerm,
        }),
        apiGet<AttemptRow[]>('/results', { session: effectiveSession, term: effectiveTerm, limit: 50 }).catch(() => ({ data: [] })),
        apiGet<AttemptRow[]>('/offline-results', { session: effectiveSession, term: effectiveTerm, limit: 50 }).catch(() => ({ data: [] })),
      ]);
      setCard(response.data);
      setOnlineAttempts(online.data ?? []);
      setOfflineAttempts(offline.data ?? []);
      setFetchedPeriod({ session: effectiveSession, term: effectiveTerm });
      if (!response.data && !(online.data ?? []).length && !(offline.data ?? []).length) {
        setNotice(
          `No result notification or exam attempts have been published for ${effectiveSession} · ${effectiveTerm}.`,
        );
      }
    } catch (err: any) {
      setError(err?.message ?? 'Could not load your full result.');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async () => {
    if (!sheetRef.current || !card) return;
    setDownloading(true);
    setNotice(null);
    try {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      await downloadNodeAsPng(sheetRef.current, {
        fileName: `result-notification-${card.studentName || user?.user_name || 'pupil'}-${card.term}-${card.session}`,
        pixelRatio: 2.5,
      });
      setNotice('Downloaded the result notification as a PNG image.');
    } catch (err: any) {
      setError(err?.message ?? 'Could not download the result notification image.');
    } finally {
      setDownloading(false);
    }
  };

  const selectClass = 'min-h-11 w-full rounded border border-line bg-white px-3 text-sm font-semibold';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Results"
        title="Result Notification"
        text="Choose a session and term, then get your full result: the published report card and every online/offline exam attempt for that term."
      />

      <Card>
        <CardHead
          title="Find your result"
          sub={
            user?.user_name
              ? `${user.user_name}${user.student?.className ? ` · ${user.student.className}` : ''}`
              : 'Your pupil account'
          }
        />
        <div className="grid gap-3 px-5 py-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="block text-sm font-semibold">
            Session
            <select
              value={effectiveSession}
              onChange={(event) => {
                setSession(event.target.value);
                setNotice(null);
              }}
              className={`${selectClass} mt-2`}
            >
              {!sessions.length && <option value="">Loading sessions…</option>}
              {sessions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Term
            <select
              value={effectiveTerm}
              onChange={(event) => {
                setTerm(event.target.value);
                setNotice(null);
              }}
              className={`${selectClass} mt-2`}
            >
              {ACADEMIC_TERMS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void getResults()}
            disabled={loading || !effectiveSession || !effectiveTerm}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <FileBarChart2 size={15} aria-hidden="true" />
            {loading ? 'Loading…' : 'Get full result'}
          </button>
        </div>
        {error && (
          <p role="alert" className="mx-5 mb-5 border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mx-5 mb-5 border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">
            {notice}
          </p>
        )}
      </Card>

      {blocked ? (
        <Card>
          <div className="px-5 py-8 text-center">
            <p className="font-display text-xl font-extrabold text-ink">
              {blocked.status === 'DISABLED'
                ? 'Result is being worked on'
                : blocked.status === 'NOT_STARTED'
                  ? 'Result notification not open yet'
                  : 'Result notification closed'}
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">{blocked.message}</p>
            <p className="mt-2 text-xs text-muted">
              Visibility window: {blocked.termStart} to {blocked.termEnd}
            </p>
          </div>
        </Card>
      ) : loading ? (
        <LoadingSkeleton rows={8} />
      ) : card && fetchedPeriod ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand-700">
                Published result notification
              </p>
              <p className="mt-1 text-sm text-muted">
                {fetchedPeriod.session} · {fetchedPeriod.term}
                {availability ? ` · visible until ${availability.termEnd}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill tone="emerald">Published</Pill>
              <button
                type="button"
                onClick={() => void downloadImage()}
                disabled={downloading}
                className="inline-flex min-h-10 items-center gap-2 rounded border border-line bg-white px-4 text-sm font-bold text-brand-800 hover:border-brand-500 hover:text-brand-700 disabled:opacity-50"
              >
                <Download size={15} aria-hidden="true" />
                {downloading ? 'Preparing…' : 'Download image'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-10 items-center gap-2 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700"
              >
                <Printer size={15} aria-hidden="true" /> Print
              </button>
            </div>
          </div>

          <div
            id="report-card-print"
            className="overflow-x-auto border border-line bg-cream p-3 md:p-5"
          >
            <div ref={sheetRef} className="mx-auto w-[794px]">
              <ReportCard
                variant={card.variant}
                term={card.term}
                session={card.session}
                studentName={card.studentName}
                admissionNumber={card.admissionNumber}
                className={card.className}
                photoUrl={card.photoUrl}
                subjects={subjects}
                present={card.present ?? undefined}
                absent={card.absent ?? undefined}
                totalSchoolDays={card.totalSchoolDays ?? undefined}
                affective={card.affective}
                psychomotor={card.psychomotor}
                classTeacherRemark={card.classTeacherRemark}
                principalComment={card.principalComment}
                newsLetter={card.newsLetter}
                nextTermBegins={card.nextTermBegins}
                grading={academic.data?.data.grading}
              />
            </div>
          </div>
          <p className="text-center text-[10px] font-semibold text-muted sm:hidden">
            Swipe sideways to see the full result sheet.
          </p>
        </>
      ) : fetchedPeriod ? (
        <Card>
          <div className="px-5 py-5">
            <EmptyState
              message={`No result notification has been published for ${fetchedPeriod.session} · ${fetchedPeriod.term}.`}
            />
          </div>
        </Card>
      ) : null}

      {fetchedPeriod && !loading && !blocked && (onlineAttempts.length > 0 || offlineAttempts.length > 0) && (
        <Card className="print:hidden">
          <CardHead
            title={`Exam attempts — ${fetchedPeriod.session} · ${fetchedPeriod.term}`}
            sub={`${onlineAttempts.length + offlineAttempts.length} sitting(s) recorded for this term`}
          />
          <ul className="divide-y divide-line">
            {[
              ...onlineAttempts.map((row) => ({ ...row, origin: 'ONLINE' as const })),
              ...offlineAttempts.map((row) => ({ ...row, origin: 'OFFLINE' as const })),
            ]
              .sort((a, b) => +new Date(b.date) - +new Date(a.date))
              .map((row) => (
                <li key={`${row.origin}:${row.id}`} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold">{row.exam?.exam_name ?? 'Exam'}</p>
                      <p className="text-xs text-muted">
                        {new Date(row.date).toLocaleString()} · attempted {row.attempted_questions}/{row.total_questions}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={row.origin === 'OFFLINE' ? 'amber' : 'sky'}>{row.origin === 'OFFLINE' ? 'Offline' : 'Online'}</Pill>
                      <Pill tone={row.overallScore >= 75 ? 'emerald' : row.overallScore < 40 ? 'rose' : 'sky'}>{Math.round(row.overallScore)}%</Pill>
                      <Link
                        to={ROUTES.studentResultDetail
                          .replace(':origin', row.origin === 'OFFLINE' ? 'offline' : 'online')
                          .replace(':id', row.id)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded border border-line bg-white px-3 text-xs font-bold text-brand-700 hover:border-brand-500 hover:bg-brand-50"
                      >
                        <Eye size={13} aria-hidden="true" /> View
                      </Link>
                      <Link
                        to={ROUTES.studentResultReport
                          .replace(':origin', row.origin === 'OFFLINE' ? 'offline' : 'online')
                          .replace(':id', row.id)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded bg-brand-900 px-3 text-xs font-bold text-white hover:bg-brand-700"
                      >
                        <BookOpenCheck size={13} aria-hidden="true" /> Exam report
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </Card>
      )}
    </div>
  );
};
