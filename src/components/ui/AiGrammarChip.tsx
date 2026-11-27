import { useRef, useState } from 'react';
import { LoaderCircle, Redo2, Sparkles, Undo2 } from 'lucide-react';
import { apiPost } from '@/lib/api';

/**
 * Green AI grammar chip used beside long-form remark boxes.
 *
 * It keeps its own AI history so Undo/Redo can move between the original and
 * each corrected version without touching the parent form's state model.
 */
export const AiGrammarChip = ({
  value,
  onChange,
  disabled = false,
  preserveFocus = false,
  className = '',
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  /** Prevent a parent inline editor from blurring when the chip is clicked. */
  preserveFocus?: boolean;
  className?: string;
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const valueRef = useRef(value);
  valueRef.current = value;

  const moveTo = (nextIndex: number) => {
    if (!history.length) return;
    const clamped = Math.max(0, Math.min(nextIndex, history.length - 1));
    const next = history[clamped];
    if (next === undefined) return;
    setIndex(clamped);
    setError(null);
    setMessage(null);
    onChange(next);
  };

  const correct = async () => {
    if (busy || disabled) return;
    const before = valueRef.current;
    if (!before.trim()) {
      setError('Write the remark first, then let AI correct it.');
      setMessage(null);
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await apiPost<{ corrected: string }>('/ai/agent/correct-text', {
        text: before,
      });
      const corrected = String(response.data?.corrected ?? '').trim();
      if (!corrected) throw new Error('The AI did not return corrected text.');
      if (valueRef.current !== before) {
        setError('The text changed while AI was correcting. Please try again.');
        return;
      }
      if (corrected === before.trim()) {
        setMessage('No grammar changes were needed.');
        return;
      }
      const base = history.slice(0, index + 1);
      if (!base.length) base.push(before);
      else if (base[base.length - 1] !== before) base.push(before);
      const nextHistory = [...base, corrected];
      setHistory(nextHistory);
      setIndex(nextHistory.length - 1);
      onChange(corrected);
      setMessage('Corrected. Use Undo/Redo if you prefer the original.');
    } catch (err: any) {
      setError(err?.message ?? 'AI correction failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`flex max-w-full flex-wrap items-center gap-1 rounded-md border border-brand-400 bg-white/95 px-1.5 py-1 shadow-sm ${className}`}
      onMouseDown={preserveFocus ? (event) => event.preventDefault() : undefined}
    >
      <span className="inline-flex items-center gap-1 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-brand-800">
        <Sparkles size={11} aria-hidden="true" /> AI
      </span>
      <button
        type="button"
        onClick={() => void correct()}
        disabled={busy || disabled}
        title="Correct spelling and grammar with AI"
        className="inline-flex min-h-7 items-center gap-1 rounded border border-brand-300 bg-brand-50 px-2 text-[10px] font-bold text-brand-800 hover:border-brand-500 hover:bg-brand-100 disabled:opacity-60"
      >
        {busy ? (
          <LoaderCircle size={11} className="animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles size={11} aria-hidden="true" />
        )}
        {busy ? 'Correcting…' : 'AI auto correct'}
      </button>
      <button
        type="button"
        onClick={() => moveTo(index - 1)}
        disabled={busy || !history.length || index <= 0}
        title="Undo AI correction"
        className="inline-flex min-h-7 items-center gap-1 rounded border border-line bg-white px-2 text-[10px] font-bold text-brand-800 hover:border-brand-400 disabled:opacity-40"
      >
        <Undo2 size={11} aria-hidden="true" /> Undo
      </button>
      <button
        type="button"
        onClick={() => moveTo(index + 1)}
        disabled={busy || !history.length || index >= history.length - 1}
        title="Redo AI correction"
        className="inline-flex min-h-7 items-center gap-1 rounded border border-line bg-white px-2 text-[10px] font-bold text-brand-800 hover:border-brand-400 disabled:opacity-40"
      >
        <Redo2 size={11} aria-hidden="true" /> Redo
      </button>
      {error && <span className="w-full text-[10px] font-semibold text-rose-700">{error}</span>}
      {message && !error && (
        <span className="w-full text-[10px] font-semibold text-emerald-700">{message}</span>
      )}
    </div>
  );
};
