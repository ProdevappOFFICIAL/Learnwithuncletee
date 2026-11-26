import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';
import type { AiChatMessage } from '@/lib/aiChat';
import { ChatMessage } from './ChatMessage';
import { LoadingSkeleton } from '@/components/dashboard/DashboardUI';

const SUGGESTIONS = [
  { title: 'Create an exam', text: 'Create a JSS2 exam called Mid-Term Test with 5 questions per subject.' },
  { title: 'Add a pupil', text: 'Add a new pupil to JSS 1A and generate login details.' },
  { title: 'Results health', text: 'Summarise this term’s results by class and flag missing grades.' },
  { title: 'Start a deployment', text: 'Start an offline deployment for SS3 covering all current exams.' },
  { title: 'Question audit', text: 'How many questions do we have this term, grouped by subject?' },
  { title: 'Fees follow-up', text: 'List pupils with unpaid fees and the amount outstanding.' },
];

export const ChatThread = ({
  messages,
  streaming,
  loading,
  streamError,
  onRegenerate,
  onSuggestion,
}: {
  messages: AiChatMessage[];
  streaming: boolean;
  loading?: boolean;
  streamError?: string | null;
  onRegenerate: () => void;
  onSuggestion: (text: string) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState(true);

  const lastLength = messages.length
    ? messages[messages.length - 1].content.length + (messages[messages.length - 1].parts?.steps?.length ?? 0)
    : 0;

  useEffect(() => {
    if (!stick) return;
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, lastLength, stick]);

  useEffect(() => {
    setStick(true);
  }, [messages.length]);

  const onScroll = () => {
    const node = containerRef.current;
    if (!node) return;
    setStick(node.scrollHeight - node.scrollTop - node.clientHeight < 120);
  };

  const lastAssistantId = [...messages].reverse().find((message) => message.role === 'assistant')?.id;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-cream/30">
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="scroll-db min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6"
        aria-live="polite"
        aria-busy={streaming}
      >
        {loading ? (
          <div className="mx-auto max-w-3xl">
            <LoadingSkeleton rows={6} />
          </div>
        ) : !messages.length ? (
          <div className="mx-auto flex max-w-2xl flex-col items-center py-8 text-center sm:py-12">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-900 text-lime-accent">
              <Sparkles size={24} aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-xl font-extrabold sm:text-2xl">Ask Uncle Tee AI</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted">
              Create exams and questions, add pupils, enter results, build report cards, start deployments and more.
              Every action follows your permissions and is logged.
            </p>
            <div className="mt-6 grid w-full gap-2 text-left sm:grid-cols-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.title}
                  type="button"
                  onClick={() => onSuggestion(suggestion.text)}
                  className="rounded border border-line bg-white px-3.5 py-3 text-left transition-colors hover:border-brand-400 hover:bg-brand-50/60"
                >
                  <span className="block text-xs font-extrabold text-brand-800">{suggestion.title}</span>
                  <span className="mt-1 block text-[11px] leading-4 text-muted">{suggestion.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-5">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isLastAssistant={message.id === lastAssistantId}
                onRegenerate={onRegenerate}
                busy={streaming}
              />
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {!stick && messages.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setStick(true);
            endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
          }}
          className="absolute bottom-3 left-1/2 z-10 flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-[11px] font-bold text-brand-800 shadow-md hover:bg-brand-50"
        >
          <ArrowDown size={12} aria-hidden="true" /> Jump to latest
        </button>
      )}

      {streamError && (
        <div role="alert" className="mx-4 mb-2 border-l-2 border-rose-400 bg-rose-50 px-3 py-2 text-xs text-rose-800 sm:mx-6">
          {streamError}
        </div>
      )}
    </div>
  );
};
