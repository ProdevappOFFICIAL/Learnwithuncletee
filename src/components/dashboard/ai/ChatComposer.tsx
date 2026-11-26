import { useEffect, useRef } from 'react';
import { Camera, LoaderCircle, Paperclip, SendHorizontal, Square, X } from 'lucide-react';
import type { AiAttachment } from '@/lib/aiChat';

export const ChatComposer = ({
  value,
  onChange,
  onSend,
  onStop,
  streaming,
  disabled,
  autoFocus,
  attachments = [],
  onRemoveAttachment,
  onUploadFiles,
  uploading,
  onOpenCamera,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  streaming: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  attachments?: AiAttachment[];
  onRemoveAttachment?: (id: string) => void;
  onUploadFiles?: (files: File[]) => void;
  uploading?: boolean;
  onOpenCamera?: () => void;
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.height = '0px';
    node.style.height = `${Math.min(node.scrollHeight, 180)}px`;
  }, [value]);

  const canSend = (value.trim().length > 0 || attachments.length > 0) && !streaming && !disabled && !uploading;

  return (
    <div className="border-t border-line bg-white px-3 py-3 sm:px-4">
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <span key={attachment.id} className="group relative block overflow-hidden rounded border border-line bg-cream">
              <img
                src={attachment.url}
                alt={attachment.name ?? 'Attached image'}
                className="h-14 w-14 object-cover"
              />
              <button
                type="button"
                onClick={() => onRemoveAttachment?.(attachment.id)}
                aria-label="Remove attached image"
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-900/80 text-white hover:bg-rose-600"
              >
                <X size={11} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-1.5 rounded border border-line bg-white px-2 py-2 focus-within:border-brand-500">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          aria-label="Upload images"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length) onUploadFiles?.(files);
            event.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || uploading || streaming || attachments.length >= 4}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-brand-800 hover:bg-brand-50 disabled:opacity-40"
          aria-label="Upload images"
          title="Upload images (max 4)"
        >
          {uploading ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : <Paperclip size={17} aria-hidden="true" />}
        </button>
        <button
          type="button"
          onClick={onOpenCamera}
          disabled={disabled || uploading || streaming || attachments.length >= 4}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-brand-800 hover:bg-brand-50 disabled:opacity-40"
          aria-label="Snap a photo"
          title="Snap a photo"
        >
          <Camera size={17} aria-hidden="true" />
        </button>
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
          placeholder={attachments.length ? 'Add a note about the image…' : 'Ask the school agent to create, find, edit or run something…'}
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
      <div className="mt-1.5 flex items-center justify-between gap-2 px-1 text-[10px] font-semibold text-muted">
        <span>Enter to send · Shift+Enter for a new line · Attach up to 4 images</span>
        <span className={value.length > 7400 ? 'text-amber-700' : ''}>
          {attachments.length ? `${attachments.length}/4 images` : value.length ? `${value.length}/8000` : ''}
        </span>
      </div>
    </div>
  );
};
