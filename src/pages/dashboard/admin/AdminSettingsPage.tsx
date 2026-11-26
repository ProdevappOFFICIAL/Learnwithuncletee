import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHead, ErrorState, LoadingSkeleton, PageHeader, Pill } from '@/components/dashboard/DashboardUI';
import { apiGet, apiPatch, apiPut } from '@/lib/api';
import {
  ACADEMIC_KEY,
  ACADEMIC_TERMS,
  gradingSummary,
  useAcademicSettings,
  type AcademicSettings,
  type AcademicTerm,
  type GradingScale,
} from '@/lib/academic';
import { LIST_GC, LIST_STALE } from '@/lib/pagedQuery';

interface MatrixRow {
  key: string;
  label: string;
  module: string;
  roles: Record<string, boolean>;
}

const ROLES = ['MEMBER', 'TEACHER', 'STUDENT', 'PARENT'];

const SETTINGS_KEY = ['admin-settings'];
const MATRIX_KEY = ['permissions-matrix'];

const GRADE_ORDER: Array<{ key: keyof GradingScale; grade: string; label: string; tone: string }> = [
  { key: 'a', grade: 'A', label: 'Excellent', tone: 'bg-brand-500' },
  { key: 'b', grade: 'B', label: 'Very good', tone: 'bg-brand-400' },
  { key: 'c', grade: 'C', label: 'Good', tone: 'bg-lime-accent' },
  { key: 'd', grade: 'D', label: 'Pass', tone: 'bg-amber-400' },
];

const input = 'mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500';

const gradingIsValid = (grading: GradingScale) =>
  [grading.a, grading.b, grading.c, grading.d].every((value) => Number.isFinite(value) && value >= 1 && value <= 100) &&
  grading.a > grading.b &&
  grading.b > grading.c &&
  grading.c > grading.d;

export const AdminSettingsPage = () => {
  const qc = useQueryClient();
  // School profile changes rarely — long cache, instant back-navigation.
  const settings = useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: () => apiGet<Record<string, string>>('/settings'),
    staleTime: LIST_STALE,
    gcTime: LIST_GC,
  });
  const academic = useAcademicSettings();
  // Permission matrix: cached, but every toggle invalidates immediately.
  const matrix = useQuery({
    queryKey: MATRIX_KEY,
    queryFn: () => apiGet<{ permissions: unknown; matrix: MatrixRow[] }>('/permissions/matrix'),
    staleTime: LIST_STALE,
    gcTime: LIST_GC,
  });
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const [academicDraft, setAcademicDraft] = useState<AcademicSettings | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [academicBusy, setAcademicBusy] = useState(false);

  const values = draft ?? settings.data?.data ?? {};
  const academicValues = academicDraft ?? academic.data?.data ?? null;
  const gradingValid = academicValues ? gradingIsValid(academicValues.grading) : false;

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const res = await apiPatch<Record<string, string>>('/settings', values);
      qc.setQueryData(SETTINGS_KEY, { data: res.data });
      setDraft(null);
      setNotice('School settings saved.');
    } catch (err: any) {
      setNotice(err?.message ?? 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const saveAcademic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academicValues) return;
    if (!gradingValid) {
      setNotice('Grade boundaries must descend: A > B > C > D, with each boundary between 1 and 100.');
      return;
    }
    setAcademicBusy(true);
    setNotice(null);
    try {
      const res = await apiPut<AcademicSettings>('/settings/academic', {
        session: academicValues.session,
        term: academicValues.term,
        termDates: academicValues.termDates,
        grading: academicValues.grading,
      });
      qc.setQueryData(ACADEMIC_KEY, { data: res.data });
      await Promise.all([
        qc.invalidateQueries({ queryKey: SETTINGS_KEY }),
        qc.invalidateQueries({ queryKey: ['report-cards'] }),
      ]);
      setAcademicDraft(null);
      setNotice('Academic period, term dates and grading scale saved.');
    } catch (err: any) {
      setNotice(err?.message ?? 'Academic settings save failed');
    } finally {
      setAcademicBusy(false);
    }
  };

  const flip = async (role: string, key: string, current: boolean) => {
    setNotice(null);
    try {
      await apiPut('/permissions/matrix', { role, key, allowed: !current });
      await qc.invalidateQueries({ queryKey: MATRIX_KEY });
      setNotice(`${role} ${!current ? 'granted' : 'denied'} ${key}. Sidebar and API update immediately.`);
    } catch (err: any) {
      setNotice(err?.message ?? 'Permission update failed');
    }
  };

  const set = (k: string, v: string) => setDraft({ ...values, [k]: v });

  const patchAcademic = (patch: Partial<AcademicSettings>) => {
    if (!academicValues) return;
    setAcademicDraft({ ...academicValues, ...patch });
  };

  const patchTermDate = (term: AcademicTerm, key: 'from' | 'to', value: string) => {
    if (!academicValues) return;
    patchAcademic({
      termDates: {
        ...academicValues.termDates,
        [term]: { ...academicValues.termDates[term], [key]: value },
      },
    });
  };

  const patchGrade = (key: keyof GradingScale, value: string) => {
    if (!academicValues) return;
    const parsed = Number(value);
    patchAcademic({
      grading: { ...academicValues.grading, [key]: Number.isFinite(parsed) ? parsed : 0 },
    });
  };

  const bandRange = (key: keyof GradingScale) => {
    if (!academicValues) return '';
    const g = academicValues.grading;
    if (key === 'a') return `${g.a} – 100`;
    if (key === 'b') return `${g.b} – ${Math.max(g.a - 1, g.b)}`;
    if (key === 'c') return `${g.c} – ${Math.max(g.b - 1, g.c)}`;
    if (key === 'd') return `${g.d} – ${Math.max(g.c - 1, g.d)}`;
    return `0 – ${Math.max(g.d - 1, 0)}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Control" title="Settings" text="School profile, current session and term, term dates, grading bands and role permissions." />
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">School profile</p>
          <h3 className="mt-2 font-display text-lg font-extrabold">Identity & contacts</h3>
          {settings.isPending ? (
            <div className="mt-4"><LoadingSkeleton rows={4} /></div>
          ) : settings.isError || !settings.data ? (
            <div className="mt-4"><ErrorState message="Could not load settings" onRetry={() => settings.refetch()} /></div>
          ) : (
            <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={saveSettings}>
              {[
                ['school.name', 'School name'],
                ['school.address', 'Address'],
                ['school.phone', 'Phone'],
                ['school.email', 'Email'],
                ['session.midtermBreak', 'Mid-term break'],
              ].map(([k, label]) => (
                <label key={k} className="block text-sm font-semibold">{label}
                  <input value={values[k] ?? ''} onChange={(e) => set(k, e.target.value)} className={input} />
                </label>
              ))}
              <div className="sm:col-span-2">
                <button type="submit" disabled={busy} className="min-h-11 w-full rounded bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                  {busy ? 'Saving…' : 'Save school profile'}
                </button>
              </div>
            </form>
          )}
        </Card>

        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Academic period</p>
          <h3 className="mt-2 font-display text-lg font-extrabold">Session, term & term dates</h3>
          <p className="mt-1 text-sm text-muted">These values lock the Result Generator and filter results, questions and exports.</p>
          {academic.isPending ? (
            <div className="mt-4"><LoadingSkeleton rows={5} /></div>
          ) : academic.isError || !academicValues ? (
            <div className="mt-4"><ErrorState message="Could not load academic settings" onRetry={() => academic.refetch()} /></div>
          ) : (
            <form className="mt-5 space-y-4" onSubmit={saveAcademic}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">Current session
                  <select
                    value={academicValues.session}
                    onChange={(e) => patchAcademic({ session: e.target.value })}
                    className={input}
                  >
                    {academicValues.sessionOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold">Current term
                  <select
                    value={academicValues.term}
                    onChange={(e) => patchAcademic({ term: e.target.value as AcademicTerm })}
                    className={input}
                  >
                    {ACADEMIC_TERMS.map((term) => (
                      <option key={term} value={term}>{term}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="space-y-3 border-t border-line pt-4">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Term start & end dates</p>
                {ACADEMIC_TERMS.map((term) => (
                  <div key={term} className="grid gap-3 rounded border border-line bg-brand-50/40 p-3 sm:grid-cols-[1fr_auto_1fr]">
                    <p className="self-center text-sm font-bold sm:col-span-3">{term}</p>
                    <label className="block text-xs font-semibold text-muted">Starts
                      <input
                        type="date"
                        value={academicValues.termDates[term]?.from ?? ''}
                        onChange={(e) => patchTermDate(term, 'from', e.target.value)}
                        className={input}
                      />
                    </label>
                    <span className="hidden self-end pb-3 text-muted sm:block">→</span>
                    <label className="block text-xs font-semibold text-muted">Ends
                      <input
                        type="date"
                        value={academicValues.termDates[term]?.to ?? ''}
                        onChange={(e) => patchTermDate(term, 'to', e.target.value)}
                        className={input}
                      />
                    </label>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-line pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Grading scale</p>
                  <Pill tone={gradingValid ? 'emerald' : 'rose'}>{gradingValid ? 'Valid boundaries' : 'Check boundaries'}</Pill>
                </div>
                <p className="text-xs text-muted">{gradingSummary(academicValues.grading)}. Click a number to move a boundary.</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {GRADE_ORDER.map((band) => (
                    <label key={band.key} className="flex items-center gap-3 rounded border border-line px-3 py-2">
                      <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white ${band.tone}`}>
                        {band.grade}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold">{band.label}</span>
                        <span className="block text-xs text-muted">Score {bandRange(band.key)}</span>
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={academicValues.grading[band.key]}
                        onChange={(e) => patchGrade(band.key, e.target.value)}
                        aria-label={`${band.grade} boundary`}
                        className="h-10 w-20 rounded border border-line bg-white px-2 text-center text-sm font-bold outline-none focus:border-brand-500"
                      />
                    </label>
                  ))}
                  <div className="flex items-center gap-3 rounded border border-line bg-brand-50/50 px-3 py-2">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500 text-sm font-extrabold text-white">F</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">Fail</span>
                      <span className="block text-xs text-muted">Score {bandRange('f')}</span>
                    </span>
                    <span className="text-xs font-semibold text-muted">below D</span>
                  </div>
                </div>
                <div className="flex h-3 overflow-hidden rounded-full border border-line">
                  <span className="bg-brand-500" style={{ width: `${100 - academicValues.grading.a}%` }} />
                  <span className="bg-brand-400" style={{ width: `${Math.max(academicValues.grading.a - academicValues.grading.b, 0)}%` }} />
                  <span className="bg-lime-accent" style={{ width: `${Math.max(academicValues.grading.b - academicValues.grading.c, 0)}%` }} />
                  <span className="bg-amber-400" style={{ width: `${Math.max(academicValues.grading.c - academicValues.grading.d, 0)}%` }} />
                  <span className="bg-rose-500" style={{ width: `${Math.max(academicValues.grading.d, 0)}%` }} />
                </div>
              </div>

              <button
                type="submit"
                disabled={academicBusy || !gradingValid}
                className="min-h-11 w-full rounded bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {academicBusy ? 'Saving…' : 'Save academic settings'}
              </button>
            </form>
          )}
        </Card>
      </div>

      <Card>
        <CardHead title="Roles & access" sub="Toggle what each role can see and do" />
        {matrix.isPending ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={6} /></div>
        ) : matrix.isError || !matrix.data ? (
          <div className="px-5 py-5"><ErrorState message="Could not load permissions" onRetry={() => matrix.refetch()} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-line bg-brand-50/60 px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-brand-700">Permission</th>
                  {ROLES.map((r) => (
                    <th key={r} className="border-b border-line bg-brand-50/60 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-brand-700">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.data.data.matrix.map((row) => (
                  <tr key={row.key}>
                    <td className="border-b border-line px-5 py-2.5">
                      <span className="font-bold">{row.label}</span>
                      <span className="block font-mono text-[11px] text-muted">{row.key}</span>
                    </td>
                    {ROLES.map((r) => (
                      <td key={r} className="border-b border-line px-3 py-2.5 text-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={row.roles[r]}
                          aria-label={`${r} ${row.key}`}
                          onClick={() => flip(r, row.key, row.roles[r])}
                          className={`inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors ${row.roles[r] ? 'bg-brand-500' : 'bg-line'}`}
                        >
                          <span className={`h-4 w-4 rounded-full bg-white transition-transform ${row.roles[r] ? 'translate-x-5' : ''}`} />
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-line bg-brand-50/60 px-5 py-3 text-xs text-muted">OWNER and ADMIN always have full access and cannot be restricted. Denied sidebar items disappear on next navigation; denied API calls return 403.</p>
      </Card>
    </div>
  );
};
