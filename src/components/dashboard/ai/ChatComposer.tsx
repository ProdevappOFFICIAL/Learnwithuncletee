import { useEffect, useRef } from 'react';
import { SendHorizontal, Square } from 'lucide-react';

export const ChatComposer = ({
  value,
  onChange,
  onSend,
  onStop,
  streaming,
  disabled,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  streaming: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.height = '0px';
    node.style.height = `${Math.min(node.scrollHeight, 180)}px`;
  }, [value]);

  const canSend = value.trim().length > 0 && !streaming && !disabled;

  return (
    <div className="border-t border-line bg-white px-3 py-3 sm:px-4">
      <div className="flex items-end gap-2 rounded border border-line bg-white px-2.5 py-2 focus-within:border-brand-500">
        <textarea
          ref={ref}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              if (canSend) onSend();
            }
          }}
          rows={1}
          maxLength={8000}
          disabled={disabled}
          placeholder="Ask the school agent to create, find, edit or run something…"
          aria-label="Message the school agent"
          className="scroll-db min-h-10 max-h-[180px] flex-1 resize-none bg-transparent px-1 py-1.5 text-sm leading-6 outline-none placeholder:text-muted/70 disabled:opacity-60"
        />
        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-rose-600 text-white hover:bg-rose-700"
            aria-label="Stop the agent"
            title="Stop"
          >
            <Square size={15} fill="currentColor" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-brand-500 text-white hover:bg-brand-700 disabled:opacity-40"
            aria-label="Send message"
            title="Send"
          >
            <SendHorizontal size={16} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] font-semibold text-muted">
        <span>Enter to send · Shift+Enter for a new line</span>
        <span className={value.length > 7400 ? 'text-amber-700' : ''}>{value.length ? `${value.length}/8000` : ''}</span>
      </div>
    </div>
  );
};
