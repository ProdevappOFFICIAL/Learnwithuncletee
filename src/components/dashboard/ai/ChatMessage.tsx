import { useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Check, Copy, ExternalLink, RefreshCw, Sparkles } from 'lucide-react';
import type { AiChatMessage } from '@/lib/aiChat';
import { AgentSteps } from './AgentSteps';
import { artifactHref, artifactsFromSteps } from './toolMeta';

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 leading-6 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 ml-5 list-disc space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 ml-5 list-decimal space-y-1">{children}</ol>,
  li: ({ children }) => <li className="leading-6">{children}</li>,
  h1: ({ children }) => <h1 className="mb-2 mt-3 font-display text-lg font-extrabold">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-3 font-display text-base font-extrabold">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1.5 mt-3 text-sm font-extrabold">{children}</h3>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-brand-700 underline underline-offset-2">
      {children}
    </a>
  ),
  code: ({ className, children }) => {
    const block = Boolean(className);
    return block ? (
      <code className="font-mono text-[12px]">{children}</code>
    ) : (
      <code className="rounded bg-brand-50 px-1 py-0.5 font-mono text-[12px] text-brand-900">{children}</code>
    );
  },
  pre: ({ children }) => (
    <pre className="scroll-db my-2 overflow-auto rounded bg-brand-900 p-3 text-[12px] leading-5 text-white/90">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-lime-accent bg-brand-50 px-3 py-2 text-sm text-brand-800">{children}</blockquote>
  ),
  table: ({ children }) => (
    <div className="scroll-db my-2 overflow-x-auto">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-line bg-brand-50 px-2 py-1 text-left font-bold">{children}</th>,
  td: ({ children }) => <td className="border border-line px-2 py-1">{children}</td>,
  hr: () => <hr className="my-3 border-line" />,
};

const timeOf = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const tokenSummary = (usage: unknown) => {
  if (!usage || typeof usage !== 'object') return '';
  const record = usage as Record<string, number | undefined>;
  const total = record.totalTokens ?? record.total;
  if (!total) return '';
  return `${total.toLocaleString()} tokens`;
};

export const ChatMessage = ({
  message,
  isLastAssistant,
  onRegenerate,
  busy,
}: {
  message: AiChatMessage;
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
  busy?: boolean;
}) => {
  const [copied, setCopied] = useState(false);
  const steps = message.parts?.steps ?? [];
  const artifacts = artifactsFromSteps(steps);
  const streaming = message.status === 'streaming';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  if (message.role === 'user') {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="max-w-[88%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-brand-900 px-4 py-3 text-sm leading-6 text-white shadow-sm">
          {message.content}
        </div>
        <span className="pr-1 text-[10px] font-semibold text-muted">{timeOf(message.createdAt)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-900 text-lime-accent">
        <Sparkles size={15} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-[.12em] text-brand-800">Uncle Tee AI</span>
          <span className="text-[10px] font-semibold text-muted">{timeOf(message.createdAt)}</span>
          {streaming && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" /> live
            </span>
          )}
          {message.status === 'aborted' && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
              stopped
            </span>
          )}
        </div>

        {steps.length > 0 && <AgentSteps steps={steps} running={streaming} />}

        {message.parts?.reasoning && (
          <details className="rounded border border-line bg-cream/60 px-3 py-2">
            <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-wide text-muted">Reasoning</summary>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-muted">{message.parts.reasoning}</p>
          </details>
        )}

        {message.content ? (
          streaming ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-ink">{message.content}</p>
          ) : (
            <div className="text-sm leading-6 text-ink">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={markdownComponents}>
                {message.content}
              </ReactMarkdown>
            </div>
          )
        ) : streaming && !steps.length ? (
          <div className="flex items-center gap-1.5 py-1" aria-label="Assistant is typing">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400" />
          </div>
        ) : null}

        {message.error && message.status === 'error' && (
          <p role="alert" className="border-l-2 border-rose-400 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {message.error}
          </p>
        )}

        {artifacts.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {artifacts.map((artifact) => {
              const href = artifactHref(artifact);
              return href ? (
                <Link
                  key={`${artifact.type}:${artifact.id}`}
                  to={href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[11px] font-bold text-brand-800 hover:border-brand-400 hover:bg-brand-50"
                >
                  {artifact.label}
                  <ExternalLink size={11} aria-hidden="true" />
                </Link>
              ) : (
                <span key={`${artifact.type}:${artifact.id}`} className="rounded-full border border-line bg-white px-3 py-1.5 text-[11px] font-bold text-muted">
                  {artifact.label}
                </span>
              );
            })}
          </div>
        )}

        {!streaming && (message.content || steps.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] font-semibold text-muted">
            {message.model && <span>{message.model.split('/').slice(-1)[0]}</span>}
            {tokenSummary(message.usage) && <span>· {tokenSummary(message.usage)}</span>}
            {message.content && (
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1 rounded px-1.5 py-1 hover:bg-brand-50 hover:text-brand-800"
                aria-label="Copy answer"
              >
                {copied ? <Check size={11} aria-hidden="true" /> : <Copy size={11} aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
            {isLastAssistant && onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded px-1.5 py-1 hover:bg-brand-50 hover:text-brand-800 disabled:opacity-50"
              >
                <RefreshCw size={11} aria-hidden="true" /> Regenerate
              </button>
            )}
            {steps.some((step) => step.toolCalls.length > 0) && (
              <span className="text-muted/70">
                · {steps.reduce((sum, step) => sum + step.toolCalls.length, 0)} action(s)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
