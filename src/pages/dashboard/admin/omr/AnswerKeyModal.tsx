import { useEffect, useState } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { Modal, Pill } from '@/components/dashboard/DashboardUI';
import { apiPost, apiPut } from '@/lib/api';
import {
  OMR_OPTIONS,
  cloneSubjects,
  defaultSubjects,
  type OmrKeySummary,
  type OmrSubject,
} from './types';

export const AnswerKeyModal = ({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: OmrKeySummary | null;
  onSaved: () => void;
}) => {
  const [title, setTitle] = useState('');
  const [session, setSession] = useState('');
  const [subjects, setSubjects] = useState<OmrSubject[]>(defaultSubjects(40));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? '');
    setSession(initial?.session ?? '');
    setSubjects(initial ? cloneSubjects(initial.subjects) : defaultSubjects(40));
    setSaving(false);
    setError(null);
  }, [open, initial?.id]);

  const updateSubject = (index: number, patch: Partial<OmrSubject>) =>
    setSubjects((previous) =>
      previous.map((subject, subjectIndex) =>
        subjectIndex === index ? { ...subject, ...patch } : subject,
      ),
    );

  const setQuestionCount = (index: number, raw: string) => {
    const count = Math.max(1, Math.min(100, Number(raw) || 1));
    setSubjects((previous) =>
      previous.map((subject, subjectIndex) => {
        if (subjectIndex !== index) return subject;
        return {
          ...subject,
          questionCount: count,
          answers: Array.from({ length: count }, (_, question) => subject.answers[question] ?? null),
        };
      }),
    );
  };

  const pickAnswer = (subjectIndex: number, questionIndex: number, option: string) => {
    setSubjects((previous) =>
      previous.map((subject, index) => {
        if (index !== subjectIndex) return subject;
        const answers = [...subject.answers];
        answers[questionIndex] = answers[questionIndex] === option ? null : option;
        return { ...subject, answers };
      }),
    );
  };

  const clearSubject = (index: number) => {
    setSubjects((previous) =>
      previous.map((subject, subjectIndex) =>
        subjectIndex === index
          ? { ...subject, answers: Array.from({ length: subject.questionCount }, () => null) }
          : subject,
      ),
    );
  };

  const addSubject = () => {
    if (subjects.length >= 4) return;
    setSubjects((previous) => [
      ...previous,
      {
        name: `Subject ${previous.length + 1}`,
        questionCount: previous[0]?.questionCount ?? 40,
        options: [...OMR_OPTIONS],
        answers: Array.from({ length: previous[0]?.questionCount ?? 40 }, () => null),
      },
    ]);
  };

  const removeSubject = (index: number) => {
    if (subjects.length <= 1) return;
    setSubjects((previous) => previous.filter((_, subjectIndex) => subjectIndex !== index));
  };

  const unset = subjects.reduce(
    (total, subject) =>
      total + subject.answers.slice(0, subject.questionCount).filter((answer) => !answer).length,
    0,
  );

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;

    if (!title.trim()) {
      setError('Give this answer key a title (e.g. “2026 Mock — Week 4”).');
      return;
    }
    const names = subjects.map((subject) => subject.name.trim().toLowerCase());
    if (names.some((name) => !name)) {
      setError('Every subject needs a name — the sheet is read left to right in this order.');
      return;
    }
    if (new Set(names).size !== names.length) {
      setError('Subject names must be unique.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        session: session.trim() || null,
        subjects: subjects.map((subject, index) => ({
          name: subject.name.trim(),
          order: index,
          questionCount: subject.questionCount,
          options: [...OMR_OPTIONS],
          answers: subject.answers.slice(0, subject.questionCount),
        })),
      };
      if (initial) {
        await apiPut(`/omr/keys/${initial.id}`, payload);
      } else {
        await apiPost('/omr/keys', payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Could not save the answer key');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit answer key' : 'New answer key'}
      size="xl"
    >
      <form onSubmit={save} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-brand-700">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="2026 Mock — Week 4"
              className="mt-1.5 min-h-10 w-full rounded border border-line bg-white px-3 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand-500"
            />
          </label>
          <label className="block text-xs font-bold uppercase tracking-widest text-brand-700">
            Session / term (optional)
            <input
              value={session}
              onChange={(event) => setSession(event.target.value)}
              placeholder="First term · 2026"
              className="mt-1.5 min-h-10 w-full rounded border border-line bg-white px-3 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand-500"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3 border border-line bg-brand-50/50 px-4 py-3">
          <div>
            <p className="text-sm font-bold text-ink">Sheet layout</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              Subjects are marked left → right in this exact order. Use the same number of bubble rows
              as the printed sheet.
            </p>
          </div>
          <Pill tone={unset === 0 ? 'emerald' : 'amber'}>{unset === 0 ? 'Key complete' : `${unset} unset`}</Pill>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {subjects.map((subject, subjectIndex) => {
            const selectedCount = subject.answers
              .slice(0, subject.questionCount)
              .filter(Boolean).length;
            return (
              <section key={subjectIndex} className="overflow-hidden border border-line bg-white">
                <div className="flex items-center gap-2 border-b border-line bg-brand-50/40 px-3 py-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-900 text-[11px] font-bold text-white">
                    {subjectIndex + 1}
                  </span>
                  <input
                    value={subject.name}
                    onChange={(event) => updateSubject(subjectIndex, { name: event.target.value })}
                    aria-label={`Subject ${subjectIndex + 1} name`}
                    className="min-h-8 min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 text-sm font-bold text-ink outline-none hover:border-line focus:border-brand-500 focus:bg-white"
                  />
                  <label className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-muted">
                    Rows
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={subject.questionCount}
                      onChange={(event) => setQuestionCount(subjectIndex, event.target.value)}
                      aria-label={`${subject.name} question count`}
                      className="h-8 w-14 rounded border border-line bg-white px-1 text-center text-xs text-ink outline-none focus:border-brand-500"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeSubject(subjectIndex)}
                    disabled={subjects.length <= 1}
                    title="Remove subject"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-muted hover:bg-rose-50 hover:text-rose-700 disabled:opacity-30"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>

                <div className="flex items-center justify-between border-b border-line px-3 py-1.5 text-[11px] text-muted">
                  <span>
                    {selectedCount}/{subject.questionCount} answers set
                  </span>
                  <button
                    type="button"
                    onClick={() => clearSubject(subjectIndex)}
                    className="inline-flex items-center gap-1 font-medium text-brand-700 hover:text-brand-500"
                  >
                    <X size={11} aria-hidden="true" /> Clear
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto px-3 py-2">
                  {Array.from({ length: subject.questionCount }, (_, questionIndex) => {
                    const selected = subject.answers[questionIndex] ?? null;
                    return (
                      <div
                        key={questionIndex}
                        className="flex items-center gap-2 border-b border-line/60 py-1 last:border-0"
                      >
                        <span className="w-6 shrink-0 text-right text-[11px] font-medium text-muted">
                          {questionIndex + 1}.
                        </span>
                        <div className="flex flex-1 gap-1.5">
                          {OMR_OPTIONS.map((option) => {
                            const isSelected = selected === option;
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => pickAnswer(subjectIndex, questionIndex, option)}
                                aria-label={`${subject.name} question ${questionIndex + 1} option ${option}`}
                                aria-pressed={isSelected}
                                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold transition-colors ${
                                  isSelected
                                    ? 'border-brand-900 bg-brand-900 text-white'
                                    : 'border-line bg-white text-brand-800 hover:border-brand-500 hover:bg-brand-50'
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                        {selected && (
                          <Check size={12} className="shrink-0 text-emerald-600" aria-hidden="true" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {subjects.length < 4 && (
          <button
            type="button"
            onClick={addSubject}
            className="inline-flex min-h-10 items-center gap-2 rounded border border-dashed border-brand-300 px-4 text-xs font-bold text-brand-700 hover:bg-brand-50"
          >
            <Plus size={14} aria-hidden="true" /> Add subject (max 4)
          </button>
        )}

        {unset > 0 && (
          <p className="border-l-2 border-amber-400 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
            {unset} answer{unset === 1 ? '' : 's'} not set yet. You can save now and finish the key later;
            those questions will not score as correct until an answer is chosen.
          </p>
        )}

        {error && (
          <p role="alert" className="border-l-2 border-rose-400 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded border border-line px-4 text-sm font-bold text-ink hover:bg-cream"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="min-h-10 rounded bg-brand-900 px-5 text-sm font-bold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving…' : initial ? 'Save changes' : 'Create answer key'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
