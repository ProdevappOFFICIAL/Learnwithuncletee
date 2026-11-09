import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Image as ImageIcon,
  Mail,
  Phone,
  ScanLine,
  School,
  Trash2,
  User,
} from 'lucide-react';
import { Pill } from '@/components/dashboard/DashboardUI';
import { apiDelete, apiPatch } from '@/lib/api';
import {
  flagLabel,
  flagTone,
  scoreTone,
  type OmrScanDetail,
  type OmrSubject,
} from './types';

const inputClass =
  'mt-1 min-h-10 w-full rounded border border-line bg-white px-3 text-sm text-ink outline-none focus:border-brand-500';

const fieldIcon = 'pointer-events-none absolute left-3 top-[38px] text-muted';

interface LocalScore {
  correct: number;
  answered: number;
  total: number;
  percentage: number;
}

const scoreRows = (
  keySubjects: OmrSubject[],
  answers: Array<Array<string | null>>,
): { subjects: LocalScore[]; totalScore: number; totalQuestions: number; percentage: number } => {
  const subjects = keySubjects.map((subject, subjectIndex) => {
    const expectedAnswers = (subject.answers ?? []).slice(0, subject.questionCount);
    const actualAnswers = answers[subjectIndex] ?? [];
    let correct = 0;
    let answered = 0;
    expectedAnswers.forEach((expected, questionIndex) => {
      const actual = actualAnswers[questionIndex] ?? null;
      if (actual) answered += 1;
      if (expected && actual && expected.toUpperCase() === actual.toUpperCase()) correct += 1;
    });
    const total = expectedAnswers.length || subject.questionCount;
    return {
      correct,
      answered,
      total,
      percentage: total ? Math.round((correct / total) * 10000) / 100 : 0,
    };
  });
  const totalScore = subjects.reduce((sum, row) => sum + row.correct, 0);
  const totalQuestions = subjects.reduce((sum, row) => sum + row.total, 0);
  return {
    subjects,
    totalScore,
    totalQuestions,
    percentage: totalQuestions ? Math.round((totalScore / totalQuestions) * 10000) / 100 : 0,
  };
};

export const ScanReview = ({
  detail,
  onConfirmed,
  onDiscarded,
}: {
  detail: OmrScanDetail;
  onConfirmed: (scan: OmrScanDetail) => void;
  onDiscarded: () => void;
}) => {
  const confirmed = detail.status === 'CONFIRMED';
  const keySubjects = detail.answerKey?.subjects ?? [];

  const [answers, setAnswers] = useState<Array<Array<string | null>>>([]);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [university, setUniversity] = useState('');
  const [firstChoice, setFirstChoice] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [personalNos, setPersonalNos] = useState('');
  const [isAlumni, setIsAlumni] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSubject, setOpenSubject] = useState<number | null>(0);
  const [showSheet, setShowSheet] = useState(false);

  useEffect(() => {
    setAnswers(
      keySubjects.map((subject, subjectIndex) => {
        const stored = detail.answers?.[subjectIndex] ?? [];
        return Array.from({ length: subject.questionCount }, (_, questionIndex) => stored[questionIndex] ?? null);
      }),
    );
    setStudentName(detail.studentName ?? '');
    setStudentEmail(detail.studentEmail ?? '');
    setUniversity(detail.university ?? '');
    setFirstChoice(detail.firstChoice ?? '');
    setGuardianPhone(detail.guardianPhone ?? '');
    setPersonalNos(detail.personalNos ?? '');
    setIsAlumni(typeof detail.isAlumni === 'boolean' ? detail.isAlumni : null);
    setError(null);
    setOpenSubject(0);
    setShowSheet(false);
  }, [detail.id]);

  const localScores = useMemo(() => scoreRows(keySubjects, answers), [keySubjects, answers]);
  const warnings = detail.detection?.warnings ?? [];
  const aiMeta = detail.detection?.ai ?? null;
  const aiConfidence = aiMeta?.student?.confidence ?? {};

  const aiFieldBadge = (field: string) => {
    if (!aiMeta?.enabled) return null;
    const level = aiConfidence[field];
    if (!level) return null;
    const tone =
      level === 'high'
        ? 'bg-emerald-100 text-emerald-700'
        : level === 'medium'
          ? 'bg-amber-100 text-amber-700'
          : 'bg-rose-100 text-rose-700';
    return (
      <span className={`ml-1 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide ${tone}`}>
        AI {level}
      </span>
    );
  };

  const pickAnswer = (subjectIndex: number, questionIndex: number, option: string) => {
    if (confirmed) return;
    setAnswers((previous) =>
      previous.map((row, index) => {
        if (index !== subjectIndex) return row;
        const next = [...row];
        next[questionIndex] = next[questionIndex] === option ? null : option;
        return next;
      }),
    );
  };

  const confirm = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        studentName: studentName.trim() || null,
        studentEmail: studentEmail.trim() || null,
        university: university.trim() || null,
        firstChoice: firstChoice.trim() || null,
        guardianPhone: guardianPhone.trim() || null,
        personalNos: personalNos.trim() || null,
        isAlumni,
      };
      if (!confirmed) payload.answers = answers;
      const response = await apiPatch<OmrScanDetail>(`/omr/scans/${detail.id}`, payload);
      onConfirmed(response.data);
    } catch (err: any) {
      setError(err?.message ?? 'Could not save this scan');
    } finally {
      setSaving(false);
    }
  };

  const discard = async () => {
    if (discarding) return;
    if (!window.confirm('Delete this scan and its images? This cannot be undone.')) return;
    setDiscarding(true);
    setError(null);
    try {
      await apiDelete(`/omr/scans/${detail.id}`);
      onDiscarded();
    } catch (err: any) {
      setError(err?.message ?? 'Could not delete this scan');
    } finally {
      setDiscarding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-900 text-white">
            <ScanLine size={15} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">Review scanned sheet</p>
            <p className="text-[11px] text-muted">
              {detail.answerKey?.title ?? detail.answerKeyTitle ?? 'Answer key'} ·{' '}
              {detail.detection?.rowCount ?? '—'} rows read
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={confirmed ? 'emerald' : 'amber'}>{confirmed ? 'Confirmed' : 'Draft'}</Pill>
          <button
            type="button"
            onClick={discard}
            disabled={discarding || saving}
            className="inline-flex min-h-9 items-center gap-1 rounded border border-rose-200 px-3 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
          >
            <Trash2 size={13} aria-hidden="true" /> {discarding ? 'Deleting…' : 'Delete scan'}
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={saving || discarding}
            className="inline-flex min-h-9 items-center gap-1.5 rounded bg-brand-900 px-4 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <CheckCircle2 size={14} aria-hidden="true" />
            {saving ? 'Saving…' : confirmed ? 'Save details' : 'Confirm & save marks'}
          </button>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
          <p className="flex items-center gap-1.5 font-bold">
            <AlertTriangle size={13} aria-hidden="true" /> Review these before saving
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p role="alert" className="border-l-2 border-rose-400 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.05fr_1fr]">
        <div className="border border-line bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-brand-700">
              Header fields
              {aiMeta?.enabled && <Pill tone="sky">AI assisted</Pill>}
            </p>
            {(detail.image || detail.preview) && (
              <button
                type="button"
                onClick={() => setShowSheet((value) => !value)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-500"
              >
                <ImageIcon size={12} aria-hidden="true" />
                {showSheet ? 'Hide sheet' : 'View sheet'}
              </button>
            )}
          </div>
          {detail.header ? (
            <img
              src={detail.header}
              alt="Crop of the sheet header fields"
              className="w-full rounded border border-line object-contain"
            />
          ) : (
            <p className="rounded border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
              No header crop was stored for this scan.
            </p>
          )}
          {showSheet && (detail.image || detail.preview) && (
            <img
              src={detail.image ?? detail.preview ?? ''}
              alt="Full scanned sheet"
              className="mt-3 max-h-80 w-full rounded border border-line object-contain"
            />
          )}
          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            {aiMeta?.enabled && aiMeta.student
              ? `AI pre-filled the fields from this crop using ${aiMeta.model ?? 'the vision model'}. Verify every value before saving.`
              : "Read the handwritten fields from the crop and type them below."}
          </p>
        </div>

        <div className="border border-line bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-700">Student details</p>
            {aiMeta?.enabled && aiMeta.student && (
              <Pill tone="sky">AI pre-filled</Pill>
            )}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="relative block text-[11px] font-bold text-ink">
              Full name {aiFieldBadge('studentName')}
              <User size={13} className={fieldIcon} aria-hidden="true" />
              <input
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                className={`${inputClass} pl-8`}
                placeholder="From the sheet"
              />
            </label>
            <label className="relative block text-[11px] font-bold text-ink">
              Email address {aiFieldBadge('studentEmail')}
              <Mail size={13} className={fieldIcon} aria-hidden="true" />
              <input
                value={studentEmail}
                onChange={(event) => setStudentEmail(event.target.value)}
                className={`${inputClass} pl-8`}
                placeholder="name@email.com"
              />
            </label>
            <label className="relative block text-[11px] font-bold text-ink">
              University {aiFieldBadge('university')}
              <School size={13} className={fieldIcon} aria-hidden="true" />
              <input
                value={university}
                onChange={(event) => setUniversity(event.target.value)}
                className={`${inputClass} pl-8`}
                placeholder="First choice university"
              />
            </label>
            <label className="relative block text-[11px] font-bold text-ink">
              First choice {aiFieldBadge('firstChoice')}
              <School size={13} className={fieldIcon} aria-hidden="true" />
              <input
                value={firstChoice}
                onChange={(event) => setFirstChoice(event.target.value)}
                className={`${inputClass} pl-8`}
                placeholder="Course / university"
              />
            </label>
            <label className="relative block text-[11px] font-bold text-ink">
              Guardian phone {aiFieldBadge('guardianPhone')}
              <Phone size={13} className={fieldIcon} aria-hidden="true" />
              <input
                value={guardianPhone}
                onChange={(event) => setGuardianPhone(event.target.value)}
                className={`${inputClass} pl-8`}
                placeholder="0700 000 0000"
              />
            </label>
            <label className="relative block text-[11px] font-bold text-ink">
              Personal number {aiFieldBadge('personalNos')}
              <Phone size={13} className={fieldIcon} aria-hidden="true" />
              <input
                value={personalNos}
                onChange={(event) => setPersonalNos(event.target.value)}
                className={`${inputClass} pl-8`}
                placeholder="Optional"
              />
            </label>
          </div>
          <div className="mt-3">
            <p className="text-[11px] font-bold text-ink">
              Wants to be an alumni? {aiFieldBadge('isAlumni')}
            </p>
            <div className="mt-1 flex gap-2">
              {[
                { value: true, label: 'Yes' },
                { value: false, label: 'No' },
                { value: null, label: 'Not marked' },
              ].map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => setIsAlumni(option.value)}
                  className={`min-h-8 rounded border px-3 text-xs font-bold transition-colors ${
                    isAlumni === option.value
                      ? 'border-brand-900 bg-brand-900 text-white'
                      : 'border-line bg-white text-ink hover:border-brand-500'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="border border-brand-200 bg-brand-50/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-700">Overall</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-brand-900">
            {localScores.percentage}%
          </p>
          <p className="text-[11px] text-muted">
            {localScores.totalScore}/{localScores.totalQuestions} correct
          </p>
        </div>
        {keySubjects.map((subject, index) => {
          const score = localScores.subjects[index];
          if (!score) return null;
          return (
            <div key={`${subject.id ?? subject.name}-${index}`} className="border border-line bg-white p-4">
              <p className="truncate text-[10px] font-bold uppercase tracking-widest text-muted">
                {subject.name}
              </p>
              <p className={`mt-1 font-display text-2xl font-extrabold ${score.percentage >= 50 ? 'text-emerald-700' : score.percentage >= 30 ? 'text-amber-700' : 'text-rose-700'}`}>
                {score.percentage}%
              </p>
              <p className="text-[11px] text-muted">
                {score.correct}/{score.total} · {score.answered} answered
              </p>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {keySubjects.map((subject, subjectIndex) => {
          const detectionSubject = detail.detection?.subjects?.[subjectIndex];
          const keyAnswers = (subject.answers ?? []).slice(0, subject.questionCount);
          const subjectAnswers = answers[subjectIndex] ?? [];
          const score = localScores.subjects[subjectIndex];
          const open = openSubject === subjectIndex;
          return (
            <section key={`${subject.id ?? subject.name}-review-${subjectIndex}`} className="border border-line bg-white">
              <button
                type="button"
                onClick={() => setOpenSubject(open ? null : subjectIndex)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-brand-50/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-900 text-[11px] font-bold text-white">
                    {subjectIndex + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{subject.name}</p>
                    <p className="text-[11px] text-muted">
                      {score ? `${score.correct}/${score.total} correct · ${score.answered} answered` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {score && <Pill tone={scoreTone(score.percentage)}>{score.percentage}%</Pill>}
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {open && (
                <div className="border-t border-line px-3 py-2">
                  {confirmed && (
                    <p className="mb-2 text-[11px] text-muted">
                      Confirmed scans are read-only. Delete the scan and rescan to change answers.
                    </p>
                  )}
                  <div className="max-h-80 overflow-y-auto">
                    {Array.from({ length: subject.questionCount }, (_, questionIndex) => {
                      const actual = subjectAnswers[questionIndex] ?? null;
                      const expected = keyAnswers[questionIndex] ?? null;
                      const reading = detectionSubject?.questions?.[questionIndex];
                      const flag = reading?.flag ?? 'blank';
                      const correct = Boolean(expected && actual && expected === actual);
                      const wrong = Boolean(expected && actual && expected !== actual);
                      return (
                        <div
                          key={questionIndex}
                          className={`flex items-center gap-2 border-b border-line/60 py-1 last:border-0 ${
                            flag === 'multiple' || flag === 'ai-conflict'
                              ? 'bg-amber-50/60'
                              : flag === 'ai-corrected'
                                ? 'bg-sky-50/50'
                                : ''
                          }`}
                        >
                          <span className="w-7 shrink-0 text-right text-[11px] font-medium text-muted">
                            {questionIndex + 1}.
                          </span>
                          <div className="flex flex-1 gap-1.5">
                            {['A', 'B', 'C', 'D'].map((option) => {
                              const selected = actual === option;
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  disabled={confirmed}
                                  onClick={() => pickAnswer(subjectIndex, questionIndex, option)}
                                  aria-label={`${subject.name} question ${questionIndex + 1} option ${option}`}
                                  aria-pressed={selected}
                                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold transition-colors ${
                                    selected
                                      ? correct
                                        ? 'border-emerald-600 bg-emerald-600 text-white'
                                        : wrong
                                          ? 'border-rose-600 bg-rose-600 text-white'
                                          : 'border-brand-900 bg-brand-900 text-white'
                                      : 'border-line bg-white text-brand-800 hover:border-brand-500 disabled:hover:border-line'
                                  }`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                          <span className="w-28 shrink-0 text-right text-[10px] leading-tight">
                            <span className="block text-muted">Key: {expected ?? '—'}</span>
                            <span className={`block ${flagTone[flag]}`}>{flagLabel[flag]}</span>
                            {reading?.ai && (
                              <span className="block text-sky-700">
                                AI: {reading.ai.option ?? 'check'}
                                {reading.ai.confidence !== 'high' ? ` (${reading.ai.confidence})` : ''}
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};
