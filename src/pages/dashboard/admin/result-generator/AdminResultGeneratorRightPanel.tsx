import { useMemo } from 'react';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Link2,
  RotateCcw,
  SlidersHorizontal,
  Wand2,
} from 'lucide-react';
import { SearchSelect, type SearchOption } from '@/components/dashboard/SearchSelect';
import {
  clampNumber,
  cTotalOf,
  bestSubjectMatch,
  mappedScore,
  sourcePercentage,
  termDateRange,
  totalOf,
  VARIANT_LABELS,
} from './helpers';
import {
  parseSubjectField,
  type AttendanceSummary,
  type GeneratedSubject,
  type ReportCardDraft,
  type ReportField,
  type SourceResult,
} from './types';

interface AdminResultGeneratorRightPanelProps {
  open: boolean;
  onToggle: () => void;
  draft: ReportCardDraft;
  selectedField: ReportField | null;
  onSelectField: (field: ReportField | null) => void;
  onPatchDraft: (patch: Partial<ReportCardDraft>) => void;
  onPatchSubject: (index: number, patch: Partial<GeneratedSubject>) => void;
  sourceResults: SourceResult[];
  selectedSourceKey: string;
  onSourceChange: (key: string) => void;
  onCalculateAttendance: (from: string, to: string) => void;
  attendanceBusy: boolean;
  attendanceError: string | null;
  attendance: AttendanceSummary | null;
  onUseTermDates: () => void;
  onAutoMap: () => void;
  profilePhotoUrl: string;
  attachOptions: SearchOption[];
  onAttachStudent: (studentId: string) => void;
  attaching: boolean;
}

const TEXT_FIELDS: Record<
  string,
  { label: string; hint?: string; multiline?: boolean; placeholder?: string }
> = {
  studentName: { label: 'Student name', placeholder: 'Pupil full name' },
  admissionNumber: { label: 'Admission number', placeholder: 'e.g. UTSS/26/127' },
  className: { label: 'Class', placeholder: 'e.g. JS2' },
  photo: { label: 'Pupil photo', hint: 'Paste a photo URL, or use the profile photo on the pupil record.' },
  'affective.puntuality': { label: 'Affective trait · Punctuality', placeholder: 'e.g. Excellent' },
  'affective.respect': { label: 'Affective trait · Respect for authority', placeholder: 'e.g. Very good' },
  'psychomotor.handwriting': { label: 'Psychomotor skill · Handwriting', placeholder: 'e.g. Good' },
  'psychomotor.recreation': { label: 'Psychomotor skill · Recreation', placeholder: 'e.g. Excellent' },
  classTeacherRemark: {
    label: 'Class teacher remark',
    multiline: true,
    placeholder: 'Brief remark from the class teacher',
  },
  principalComment: {
    label: 'Principal comment',
    multiline: true,
    placeholder: 'Principal’s comment for this pupil',
  },
  newsLetter: { label: 'News letter', multiline: true, placeholder: 'News / resumption notice' },
};

const traitOptions = ['Excellent', 'Very good', 'Good', 'Fair', 'Poor'];

const readFieldValue = (draft: ReportCardDraft, field: keyof typeof TEXT_FIELDS) => {
  switch (field) {
    case 'studentName':
      return draft.studentName;
    case 'admissionNumber':
      return draft.admissionNumber;
    case 'className':
      return draft.className;
    case 'photo':
      return draft.photoUrl;
    case 'affective.puntuality':
      return draft.affectivePuntuality;
    case 'affective.respect':
      return draft.affectiveRespect;
    case 'psychomotor.handwriting':
      return draft.psychomotorHandwriting;
    case 'psychomotor.recreation':
      return draft.psychomotorRecreation;
    case 'classTeacherRemark':
      return draft.classTeacherRemark;
    case 'principalComment':
      return draft.principalComment;
    case 'newsLetter':
      return draft.newsLetter;
    default:
      return '';
  }
};

export const AdminResultGeneratorRightPanel = ({
  open,
  onToggle,
  draft,
  selectedField,
  onSelectField,
  onPatchDraft,
  onPatchSubject,
  sourceResults,
  selectedSourceKey,
  onSourceChange,
  onCalculateAttendance,
  attendanceBusy,
  attendanceError,
  attendance,
  onUseTermDates,
  onAutoMap,
  profilePhotoUrl,
  attachOptions,
  onAttachStudent,
  attaching,
}: AdminResultGeneratorRightPanelProps) => {
  const subjectField = parseSubjectField(selectedField);
  const subject = subjectField ? draft.subjects[subjectField.index] : null;
  const selectedSource = useMemo(
    () => sourceResults.find((source) => source.key === selectedSourceKey) ?? sourceResults[0] ?? null,
    [sourceResults, selectedSourceKey],
  );
  const textField = selectedField && TEXT_FIELDS[selectedField] ? selectedField : null;
  const firstTerm = /first/i.test(draft.term);

  if (!open) {
    return (
      <aside className="flex w-12 shrink-0 flex-col items-center gap-2 border border-line bg-white py-3 print:hidden">
        <button
          type="button"
          onClick={onToggle}
          aria-label="Open inspector panel"
          title="Open inspector"
          className="flex h-9 w-9 items-center justify-center rounded bg-brand-50 text-brand-800 hover:bg-brand-100"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <SlidersHorizontal size={18} className="text-muted" aria-hidden="true" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Edit</span>
      </aside>
    );
  }

  return (
    <aside className="flex w-full shrink-0 flex-col border border-line bg-white lg:w-[360px] print:hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-brand-700">Inspector</p>
          <p className="font-display text-sm font-extrabold text-ink">
            {selectedField ? 'Edit selected box' : 'Box settings'}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Collapse inspector panel"
          className="rounded border border-line p-1.5 text-muted hover:border-brand-300 hover:text-ink"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="scroll-db max-h-[760px] space-y-4 overflow-y-auto px-4 py-4">
        {/* Source picker is always available: the inspector maps from it. */}
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[.15em] text-muted">Score source</p>
            {sourceResults.length > 0 && (
              <button
                type="button"
                onClick={onAutoMap}
                className="inline-flex items-center gap-1 rounded border border-line px-2 py-1 text-[10px] font-bold text-brand-700 hover:border-brand-500"
                title="Map the best matching source subject into Last Cum for every row"
              >
                <Wand2 size={11} aria-hidden="true" /> Auto-map
              </button>
            )}
          </div>
          {sourceResults.length === 0 ? (
            <p className="border border-dashed border-line bg-cream px-3 py-3 text-xs text-muted">
              Select a pupil with results, or load an imported Excel row, to make scores available here.
            </p>
          ) : (
            <>
              <select
                value={selectedSource?.key ?? ''}
                onChange={(event) => onSourceChange(event.target.value)}
                aria-label="Choose result source"
                className="min-h-10 w-full rounded border border-line bg-white px-2 text-xs font-semibold"
              >
                {sourceResults.map((source) => (
                  <option key={source.key} value={source.key}>
                    {source.origin === 'IMPORT' ? 'Imported' : source.origin === 'OFFLINE' ? 'Offline' : 'Online'} · {source.examName}
                  </option>
                ))}
              </select>
              {selectedSource?.overallScore != null && (
                <p className="text-[11px] text-muted">
                  Overall result: <b className="text-ink">{Math.round(selectedSource.overallScore)}%</b>
                  {selectedSource.date ? ` · ${new Date(selectedSource.date).toLocaleDateString()}` : ''}
                </p>
              )}
            </>
          )}
        </section>

        {!selectedField ? (
          <section className="space-y-3 border-t border-line pt-4">
            <div className="flex items-start gap-2">
              <CircleHelp size={16} className="mt-0.5 shrink-0 text-brand-700" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-ink">Click any box on the sheet</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Name, admission number, class, photo, score cells, attendance, remarks and comments are all editable. Click a box to open its controls here.
                </p>
              </div>
            </div>

            {!draft.studentId && attachOptions.length > 0 && (
              <div className="border border-amber-200 bg-amber-50 p-3">
                <p className="mb-2 text-xs font-bold text-amber-900">This imported row is not linked to a pupil yet.</p>
                <SearchSelect
                  label="Attach to pupil"
                  placeholder="Search pupils..."
                  items={attachOptions}
                  value={draft.studentId}
                  onChange={onAttachStudent}
                  disabled={attaching}
                  loading={attaching}
                  emptyText="No pupils found."
                />
              </div>
            )}

            <div className="border border-line bg-cream px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[.15em] text-muted">Sheet</p>
              <p className="mt-1 text-sm font-bold text-ink">{VARIANT_LABELS[draft.variant]}</p>
              <p className="text-xs text-muted">{draft.term} · {draft.session}</p>
            </div>
          </section>
        ) : selectedField === 'attendance' ? (
          <section className="space-y-3 border-t border-line pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-ink">Attendance settings</p>
              <button
                type="button"
                onClick={onUseTermDates}
                className="inline-flex items-center gap-1 rounded border border-line px-2 py-1 text-[10px] font-bold text-brand-700 hover:border-brand-500"
              >
                <CalendarDays size={11} aria-hidden="true" /> Term dates
              </button>
            </div>
            <p className="text-xs leading-5 text-muted">
              Choose the term window. Saturdays and Sundays are excluded, then present and absent days are calculated from this pupil’s register.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs font-semibold text-muted">
                From
                <input
                  type="date"
                  value={draft.attendanceFrom ?? ''}
                  onChange={(event) => onPatchDraft({ attendanceFrom: event.target.value })}
                  className="mt-1 block min-h-10 w-full rounded border border-line bg-white px-2 text-xs font-semibold"
                />
              </label>
              <label className="block text-xs font-semibold text-muted">
                To
                <input
                  type="date"
                  value={draft.attendanceTo ?? ''}
                  onChange={(event) => onPatchDraft({ attendanceTo: event.target.value })}
                  className="mt-1 block min-h-10 w-full rounded border border-line bg-white px-2 text-xs font-semibold"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() =>
                onCalculateAttendance(
                  draft.attendanceFrom || termDateRange(draft.term, draft.session).from,
                  draft.attendanceTo || termDateRange(draft.term, draft.session).to,
                )
              }
              disabled={attendanceBusy || !draft.studentId}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded bg-brand-500 px-3 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              <CalendarDays size={13} aria-hidden="true" />
              {attendanceBusy ? 'Calculating...' : 'Calculate from attendance'}
            </button>
            {!draft.studentId && (
              <p className="text-[11px] text-amber-800">Attach this row to a pupil first to read attendance.</p>
            )}
            {attendanceError && (
              <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                {attendanceError}
              </p>
            )}
            {(attendance || draft.totalSchoolDays != null) && (
              <div className="grid grid-cols-3 gap-2">
                <label className="block text-[10px] font-bold uppercase tracking-wide text-muted">
                  School days
                  <input
                    type="number"
                    min={0}
                    value={draft.totalSchoolDays ?? ''}
                    onChange={(event) =>
                      onPatchDraft({ totalSchoolDays: clampNumber(event.target.value, 366) ?? undefined })
                    }
                    className="mt-1 block min-h-9 w-full rounded border border-line bg-white px-2 text-xs font-semibold"
                  />
                </label>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-muted">
                  Present
                  <input
                    type="number"
                    min={0}
                    value={draft.present ?? ''}
                    onChange={(event) => onPatchDraft({ present: clampNumber(event.target.value, 366) ?? undefined })}
                    className="mt-1 block min-h-9 w-full rounded border border-line bg-white px-2 text-xs font-semibold"
                  />
                </label>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-muted">
                  Absent
                  <input
                    type="number"
                    min={0}
                    value={draft.absent ?? ''}
                    onChange={(event) => onPatchDraft({ absent: clampNumber(event.target.value, 366) ?? undefined })}
                    className="mt-1 block min-h-9 w-full rounded border border-line bg-white px-2 text-xs font-semibold"
                  />
                </label>
              </div>
            )}
            {attendance && (
              <p className="border-l-2 border-lime-accent bg-brand-50 px-3 py-2 text-[11px] text-brand-800">
                {attendance.from} to {attendance.to}: {attendance.present} present, {attendance.absent} absent, {attendance.totalSchoolDays} school days. Weekends excluded.
              </p>
            )}
          </section>
        ) : textField ? (
          <section className="space-y-3 border-t border-line pt-4">
            <p className="text-sm font-bold text-ink">{TEXT_FIELDS[textField].label}</p>
            {TEXT_FIELDS[textField].hint && (
              <p className="text-xs leading-5 text-muted">{TEXT_FIELDS[textField].hint}</p>
            )}
            {textField === 'photo' ? (
              <div className="space-y-2">
                {(draft.photoUrl || profilePhotoUrl) && (
                  <img
                    src={draft.photoUrl || profilePhotoUrl}
                    alt="Pupil preview"
                    className="h-28 w-24 rounded border border-line object-cover"
                  />
                )}
                <input
                  value={draft.photoUrl}
                  onChange={(event) => onPatchDraft({ photoUrl: event.target.value })}
                  placeholder="https://..."
                  className="min-h-10 w-full rounded border border-line bg-white px-3 text-xs outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => onPatchDraft({ photoUrl: profilePhotoUrl })}
                  disabled={!profilePhotoUrl}
                  className="min-h-9 rounded border border-line px-3 text-xs font-bold hover:border-brand-500 hover:text-brand-700 disabled:opacity-50"
                >
                  Use profile photo
                </button>
              </div>
            ) : TEXT_FIELDS[textField].multiline ? (
              <textarea
                value={readFieldValue(draft, textField)}
                onChange={(event) => onPatchDraft({ [textField]: event.target.value })}
                rows={5}
                placeholder={TEXT_FIELDS[textField].placeholder}
                className="w-full rounded border border-line bg-white px-3 py-2 text-xs leading-5 outline-none focus:border-brand-500"
              />
            ) : (
              <input
                value={readFieldValue(draft, textField)}
                onChange={(event) => onPatchDraft({ [textField]: event.target.value })}
                placeholder={TEXT_FIELDS[textField].placeholder}
                list={textField.startsWith('affective.') || textField.startsWith('psychomotor.') ? 'trait-options' : undefined}
                className="min-h-10 w-full rounded border border-line bg-white px-3 text-xs outline-none focus:border-brand-500"
              />
            )}
            <datalist id="trait-options">
              {traitOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
            <button
              type="button"
              onClick={() => onSelectField(null)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-muted hover:text-ink"
            >
              <RotateCcw size={11} aria-hidden="true" /> Back to sheet settings
            </button>
          </section>
        ) : subject && subjectField ? (
          <section className="space-y-3 border-t border-line pt-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.15em] text-muted">
                  Subject row {subjectField.index + 1}
                </p>
                <p className="text-sm font-bold text-ink">{subject.lines.join(' ')}</p>
              </div>
              <button
                type="button"
                onClick={() => onSelectField(null)}
                aria-label="Close inspector"
                className="rounded border border-line p-1.5 text-muted hover:border-brand-300 hover:text-ink"
              >
                <ChevronRight size={14} aria-hidden="true" className="rotate-90" />
              </button>
            </div>

            {subjectField.part === 'label' ? (
              <div className="space-y-3">
                <p className="text-xs leading-5 text-muted">
                  This printed subject line is fixed by the school template. Choose which imported result subject feeds this row.
                </p>
                <label className="block text-xs font-semibold text-muted">
                  Source subject
                  <select
                    value={subject.sourceSubjectId ?? ''}
                    onChange={(event) => {
                      const chosen = selectedSource?.subjects.find((item, index) =>
                        (item.id ?? `${index}`) === event.target.value,
                      );
                      onPatchSubject(subjectField.index, {
                        sourceSubjectId: chosen?.id || event.target.value || null,
                        sourceSubjectName: chosen?.name ?? null,
                      });
                    }}
                    className="mt-1 min-h-10 w-full rounded border border-line bg-white px-2 text-xs"
                  >
                    <option value="">No source selected</option>
                    {(selectedSource?.subjects ?? []).map((item, index) => (
                      <option key={`${item.id ?? item.name}-${index}`} value={item.id ?? `${index}`}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                {sourceResults.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-[.15em] text-muted">Quick match</p>
                    {(selectedSource?.subjects ?? []).map((item, index) => (
                      <button
                        key={`${item.name}-${index}`}
                        type="button"
                        onClick={() =>
                          onPatchSubject(subjectField.index, {
                            sourceSubjectId: item.id ?? `${index}`,
                            sourceSubjectName: item.name,
                          })
                        }
                        className="flex w-full items-center justify-between gap-2 rounded border border-line px-2.5 py-2 text-left text-[11px] hover:border-brand-500"
                      >
                        <span className="truncate font-semibold">{item.name}</span>
                        <span className="shrink-0 text-muted">{sourcePercentage(item) != null ? `${Math.round(sourcePercentage(item)!)}%` : '—'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <ScoreMini label="CBT 1" value={subject.cbt1} max={20} />
                  <ScoreMini label="CBT 2" value={subject.cbt2} max={20} />
                  <ScoreMini label="CTotal" value={cTotalOf(subject)} />
                  <ScoreMini label="Exam" value={subject.exam} max={60} />
                  <ScoreMini label="Total" value={totalOf(subject)} />
                  <ScoreMini label="Last Cum." value={subject.lastCum} max={100} />
                  <ScoreMini label="Overall" value={subject.overall} />
                </div>

                {subjectField.part === 'lastCum' && firstTerm ? (
                  <div className="border border-line bg-cream px-3 py-3 text-xs leading-5 text-muted">
                    <b className="text-ink">First term has no previous cumulative.</b> Last Cum. prints as a dash and Overall Total is the same as Total. Switch to Second or Third Term to carry the previous term’s Overall Total forward.
                  </div>
                ) : ['cbt1', 'cbt2', 'exam', 'lastCum'].includes(subjectField.part) ? (
                  <>
                    <label className="block text-xs font-semibold text-muted">
                      {subjectField.part === 'cbt1'
                        ? 'CBT 1 (max 20)'
                        : subjectField.part === 'cbt2'
                          ? 'CBT 2 (max 20)'
                          : subjectField.part === 'exam'
                            ? 'Exam (max 60)'
                            : 'Last cumulative (max 100)'}
                      <input
                        type="number"
                        min={0}
                        max={subjectField.part === 'exam' ? 60 : subjectField.part === 'cbt1' || subjectField.part === 'cbt2' ? 20 : 100}
                        step="any"
                        value={subject[subjectField.part as 'cbt1' | 'cbt2' | 'exam' | 'lastCum'] ?? ''}
                        onChange={(event) => {
                          const max = subjectField.part === 'exam' ? 60 : subjectField.part === 'cbt1' || subjectField.part === 'cbt2' ? 20 : 100;
                          onPatchSubject(subjectField.index, {
                            [subjectField.part]: clampNumber(event.target.value, max),
                          });
                        }}
                        className="mt-1 block min-h-10 w-full rounded border border-line bg-white px-3 text-sm font-semibold outline-none focus:border-brand-500"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onPatchSubject(subjectField.index, { [subjectField.part]: null })}
                        className="min-h-9 rounded border border-line px-3 text-xs font-bold text-muted hover:text-ink"
                      >
                        Clear value
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onPatchSubject(subjectField.index, {
                            cbt1: null,
                            cbt2: null,
                            exam: null,
                            lastCum: null,
                            overall: null,
                          })
                        }
                        className="min-h-9 rounded border border-line px-3 text-xs font-bold text-rose-700 hover:border-rose-300"
                      >
                        Clear row
                      </button>
                    </div>

                    {selectedSource && (
                      <div className="space-y-2 border-t border-line pt-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-bold uppercase tracking-[.15em] text-muted">
                            Map from imported/live result
                          </p>
                          {bestSubjectMatch(subject, selectedSource.subjects) && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800">
                              <Check size={11} aria-hidden="true" /> name match
                            </span>
                          )}
                        </div>
                        <div className="scroll-db max-h-56 space-y-1.5 overflow-y-auto pr-1">
                          {selectedSource.subjects.map((sourceSubject, index) => {
                            const value = mappedScore(sourceSubject, subjectField.part as 'cbt1' | 'cbt2' | 'exam' | 'lastCum');
                            const matched = bestSubjectMatch(subject, [sourceSubject]);
                            return (
                              <button
                                key={`${sourceSubject.name}-${index}`}
                                type="button"
                                disabled={value == null}
                                onClick={() =>
                                  onPatchSubject(subjectField.index, {
                                    [subjectField.part]: value,
                                    sourceSubjectId: sourceSubject.id ?? `${index}`,
                                    sourceSubjectName: sourceSubject.name,
                                  })
                                }
                                className={`flex w-full items-center justify-between gap-2 rounded border px-2.5 py-2 text-left text-[11px] disabled:opacity-40 ${
                                  matched ? 'border-emerald-200 bg-emerald-50' : 'border-line hover:border-brand-500'
                                }`}
                              >
                                <span className="min-w-0">
                                  <span className="block truncate font-semibold">{sourceSubject.name}</span>
                                  <span className="block text-[10px] text-muted">
                                    {sourceSubject.correct != null && sourceSubject.total != null
                                      ? `${sourceSubject.correct}/${sourceSubject.total}`
                                      : sourcePercentage(sourceSubject) != null
                                        ? `${Math.round(sourcePercentage(sourceSubject)!)}%`
                                        : 'No score'}
                                  </span>
                                </span>
                                <span className="shrink-0 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-extrabold text-brand-800">
                                  {value == null ? '—' : value}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[10px] leading-4 text-muted">
                          Mapping scales a percentage into the selected column: CBT /20, Exam /60, Last Cum /100. CTotal, Total and Overall recalculate automatically.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="border border-line bg-cream px-3 py-3 text-xs leading-5 text-muted">
                    <b className="text-ink">Calculated column.</b> CTotal = CBT 1 + CBT 2. Total = CTotal + Exam. Overall = (Total + Last Cum.) ÷ 2. A blank Last Cum. prints as a dash, not zero.
                  </div>
                )}
              </div>
            )}
          </section>
        ) : (
          <section className="space-y-3 border-t border-line pt-4">
            <p className="text-sm font-bold text-ink">This box is not editable</p>
            <p className="text-xs text-muted">Select another box on the sheet.</p>
          </section>
        )}

        {!draft.studentId && attachOptions.length > 0 && selectedField && (
          <section className="space-y-2 border-t border-line pt-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <Link2 size={13} aria-hidden="true" /> Link this imported row
            </div>
            <SearchSelect
              label="Attach to pupil"
              placeholder="Search pupils..."
              items={attachOptions}
              value={draft.studentId}
              onChange={onAttachStudent}
              disabled={attaching}
              loading={attaching}
              emptyText="No pupils found."
            />
          </section>
        )}
      </div>
    </aside>
  );
};

const ScoreMini = ({ label, value, max }: { label: string; value?: number | null; max?: number }) => (
  <div className="rounded border border-line bg-cream px-2 py-1.5">
    <p className="text-[9px] font-bold uppercase tracking-wide text-muted">{label}</p>
    <p className="text-sm font-extrabold text-ink">
      {value == null ? '—' : value}
      {max != null && <span className="text-[10px] font-semibold text-muted"> /{max}</span>}
    </p>
  </div>
);
