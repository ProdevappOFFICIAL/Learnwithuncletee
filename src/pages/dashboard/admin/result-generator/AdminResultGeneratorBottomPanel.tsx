import { Download, Eraser, Printer, Save, Trash2 } from 'lucide-react';
import type { ReportCardDraft } from './types';
import { cTotalOf, totalOf, VARIANT_LABELS } from './helpers';

interface AdminResultGeneratorBottomPanelProps {
  draft: ReportCardDraft | null;
  dirty: boolean;
  saving: boolean;
  exporting: boolean;
  onSave: () => void;
  onPrint: () => void;
  onExport: () => void;
  onReset: () => void;
  onClear: () => void;
}

export const AdminResultGeneratorBottomPanel = ({
  draft,
  dirty,
  saving,
  exporting,
  onSave,
  onPrint,
  onExport,
  onReset,
  onClear,
}: AdminResultGeneratorBottomPanelProps) => {
  const filled = draft
    ? draft.subjects.filter(
        (subject) =>
          subject.cbt1 != null ||
          subject.cbt2 != null ||
          subject.exam != null ||
          subject.lastCum != null,
      ).length
    : 0;
  const scores = draft
    ? draft.subjects
        .map((subject) => subject.overall)
        .filter((score): score is number => score != null && Number.isFinite(score))
    : [];
  const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;

  return (
    <div className="sticky bottom-0 z-20 border border-line bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(31,61,43,0.06)] backdrop-blur print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          {draft?.studentId ? (
            <>
              <p className="truncate text-sm font-extrabold text-ink">
                {draft.studentName || 'Unnamed pupil'}
                <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-muted">
                  {VARIANT_LABELS[draft.variant]}
                </span>
              </p>
              <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted">
                <span>{draft.className || 'No class'}</span>
                <span>{draft.term} · {draft.session}</span>
                <span>{filled}/{draft.subjects.length} rows scored</span>
                <span>{average != null ? `Average ${average}%` : 'No overall score yet'}</span>
                <span>{draft.present != null ? `${draft.present} present` : 'Attendance not set'}</span>
                {dirty && <span className="font-bold text-amber-800">Unsaved changes</span>}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">
              Select a pupil from the left panel, or load an imported Excel row to start a report card.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            disabled={!draft || saving}
            className="inline-flex min-h-10 items-center gap-1.5 rounded border border-line px-3 text-xs font-bold text-rose-700 hover:border-rose-300 hover:bg-rose-50 disabled:opacity-40"
            title="Clear every score, attendance value and comment on this card"
          >
            <Eraser size={13} aria-hidden="true" /> Clear
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={!draft?.studentId || saving}
            className="inline-flex min-h-10 items-center gap-1.5 rounded border border-line px-3 text-xs font-bold text-muted hover:border-rose-300 hover:text-rose-700 disabled:opacity-40"
            title="Reload this pupil's saved card"
          >
            <Trash2 size={13} aria-hidden="true" /> Reset
          </button>
          <button
            type="button"
            onClick={onPrint}
            disabled={!draft?.studentId}
            className="inline-flex min-h-10 items-center gap-1.5 rounded border border-line px-3 text-xs font-bold hover:border-brand-500 hover:text-brand-700 disabled:opacity-40"
          >
            <Printer size={13} aria-hidden="true" /> Print / PDF
          </button>
          <button
            type="button"
            onClick={onExport}
            disabled={!draft?.studentId || exporting}
            className="inline-flex min-h-10 items-center gap-1.5 rounded border border-line px-3 text-xs font-bold hover:border-brand-500 hover:text-brand-700 disabled:opacity-40"
          >
            <Download size={13} aria-hidden="true" /> {exporting ? 'Exporting...' : 'Excel'}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!draft?.studentId || saving}
            className="inline-flex min-h-10 items-center gap-1.5 rounded bg-brand-500 px-4 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Save size={13} aria-hidden="true" /> {saving ? 'Saving...' : 'Save report card'}
          </button>
        </div>
      </div>

      {draft?.studentId && (
        <div className="mt-2 flex flex-wrap gap-2 border-t border-line pt-2 text-[10px] text-muted">
          {draft.subjects.slice(0, 6).map((subject, index) => {
            const cTotal = cTotalOf(subject);
            const total = totalOf(subject);
            return (
              <span key={`${subject.lines[0]}-${index}`} className="rounded bg-cream px-1.5 py-0.5">
                {subject.lines[0]?.replace(/^\d+\.\s*/, '')}: {total != null ? total : cTotal != null ? `${cTotal}+exam` : '—'}
              </span>
            );
          })}
          {draft.subjects.length > 6 && <span className="px-1.5 py-0.5">+{draft.subjects.length - 6} more</span>}
        </div>
      )}
    </div>
  );
};
