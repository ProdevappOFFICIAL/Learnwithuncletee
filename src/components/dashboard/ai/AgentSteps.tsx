import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronRight, LoaderCircle, X } from 'lucide-react';
import type { AiStep } from '@/lib/aiChat';
import { formatDuration, inputSummary, toolIcon, toolLabel } from './toolMeta';

const statusText = (step: AiStep) => {
  if (step.status === 'running') return 'Working';
  if (step.status === 'error') return 'Failed';
  return 'Done';
};

const pretty = (value: unknown) => {
  try {
    const text = JSON.stringify(value, null, 2);
    if (!text) return '';
    return text.length > 6000 ? `${text.slice(0, 6000)}\n…` : text;
  } catch {
    return String(value ?? '');
  }
};

export const AgentSteps = ({ steps, running }: { steps: AiStep[]; running?: boolean }) => {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (running) setOpen(true);
  }, [running]);

  const { toolCount, errorCount, startedAt, endedAt } = useMemo(() => {
    let tools = 0;
    let errors = 0;
    let first: number | undefined;
    let last: number | undefined;
    for (const step of steps) {
      tools += step.toolCalls.length;
      errors += step.toolCalls.filter((call) => call.isError).length;
      first = first === undefined ? step.startedAt : Math.min(first, step.startedAt);
      if (step.endedAt) last = last === undefined ? step.endedAt : Math.max(last, step.endedAt);
    }
    return { toolCount: tools, errorCount: errors, startedAt: first, endedAt: last };
  }, [steps]);

  if (!steps.length) {
    if (!running) return null;
    return (
      <div className="flex items-center gap-2 rounded border border-line bg-cream px-3 py-2 text-xs font-semibold text-muted" aria-live="polite">
        <LoaderCircle size={14} className="animate-spin text-brand-600" aria-hidden="true" />
        Thinking…
      </div>
    );
  }

  const elapsed = startedAt ? (endedAt ?? Date.now()) - startedAt : 0;

  return (
    <div className="overflow-hidden rounded border border-line bg-cream/70" aria-live="polite">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-brand-50/60"
      >
        {running ? (
          <LoaderCircle size={14} className="animate-spin text-brand-600" aria-hidden="true" />
        ) : errorCount ? (
          <X size={14} className="text-rose-600" aria-hidden="true" />
        ) : (
          <Check size={14} className="text-brand-600" aria-hidden="true" />
        )}
        <span className="text-[11px] font-extrabold uppercase tracking-[.14em] text-brand-800">
          {running ? 'Agent run' : 'Agent run complete'}
        </span>
        <span className="text-[11px] text-muted">
          {steps.length} step{steps.length === 1 ? '' : 's'} · {toolCount} tool{toolCount === 1 ? '' : 's'}
          {errorCount ? ` · ${errorCount} failed` : ''}
          {elapsed ? ` · ${formatDuration(elapsed)}` : ''}
        </span>
        <span className="ml-auto text-muted">
          {open ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
        </span>
      </button>

      {open && (
        <ol className="space-y-2 border-t border-line px-3 py-2.5">
          {steps.map((step) => (
            <li key={step.index} className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] font-bold text-muted">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    step.status === 'running'
                      ? 'bg-brand-100 text-brand-700'
                      : step.status === 'error'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {step.status === 'running' ? (
                    <LoaderCircle size={11} className="animate-spin" aria-hidden="true" />
                  ) : step.status === 'error' ? (
                    <X size={11} aria-hidden="true" />
                  ) : (
                    <Check size={11} aria-hidden="true" />
                  )}
                </span>
                Step {step.index + 1}
                <span className="font-semibold text-muted/80">{statusText(step)}</span>
                {step.endedAt && <span className="text-muted/60">{formatDuration(step.endedAt - step.startedAt)}</span>}
              </div>

              <div className="space-y-1 pl-7">
                {step.toolCalls.map((call) => {
                  const Icon = toolIcon(call.toolName);
                  const isOpen = expanded[call.toolCallId] ?? false;
                  return (
                    <div key={call.toolCallId} className="rounded border border-line bg-white">
                      <button
                        type="button"
                        onClick={() => setExpanded((previous) => ({ ...previous, [call.toolCallId]: !isOpen }))}
                        aria-expanded={isOpen}
                        className="flex w-full items-start gap-2 px-2.5 py-2 text-left hover:bg-brand-50/60"
                      >
                        <Icon size={13} className="mt-0.5 shrink-0 text-brand-700" aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-ink">{toolLabel(call.toolName)}</span>
                            {call.isError ? (
                              <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                                Failed
                              </span>
                            ) : call.output !== undefined ? (
                              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                Done
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
                                <LoaderCircle size={9} className="animate-spin" aria-hidden="true" /> Running
                              </span>
                            )}
                            {call.durationMs !== undefined && (
                              <span className="text-[10px] font-semibold text-muted">{formatDuration(call.durationMs)}</span>
                            )}
                          </span>
                          {inputSummary(call.input) && (
                            <span className="mt-0.5 block truncate text-[11px] text-muted">{inputSummary(call.input)}</span>
                          )}
                          {!isOpen && typeof (call.output as any)?.message === 'string' && (
                            <span className="mt-0.5 block truncate text-[11px] text-brand-800">{(call.output as any).message}</span>
                          )}
                        </span>
                        <span className="mt-0.5 text-muted">
                          {isOpen ? <ChevronDown size={12} aria-hidden="true" /> : <ChevronRight size={12} aria-hidden="true" />}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="space-y-2 border-t border-line px-2.5 py-2">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Input</p>
                            <pre className="scroll-db mt-1 max-h-40 overflow-auto rounded bg-cream p-2 text-[10px] leading-4 text-ink">
                              {pretty(call.input) || '—'}
                            </pre>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Result</p>
                            <pre
                              className={`scroll-db mt-1 max-h-56 overflow-auto rounded p-2 text-[10px] leading-4 ${
                                call.isError ? 'bg-rose-50 text-rose-800' : 'bg-cream text-ink'
                              }`}
                            >
                              {call.output === undefined ? 'Running…' : pretty(call.output)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {!step.toolCalls.length && step.status === 'running' && (
                  <p className="text-[11px] text-muted">Composing the next action…</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
