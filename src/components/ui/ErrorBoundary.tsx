import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Home } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  children: ReactNode;
  /** Optional label shown in the dialog title (e.g. "Student Dashboard"). */
  context?: string;
  /** Called after the user resets the boundary (useful for clearing caches). */
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  detailsOpen: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      detailsOpen: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Forward to external loggers (e.g. Sentry) if wired up globally.
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.props.onReset?.();
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      detailsOpen: false,
    });
  };

  private handleGoHome = () => {
    this.handleReset();
    window.location.href = '/';
  };

  private toggleDetails = () => {
    this.setState((s) => ({ detailsOpen: !s.detailsOpen }));
  };

  override render() {
    if (!this.state.hasError) return this.props.children;

    const { error, errorInfo, detailsOpen } = this.state;
    const { context } = this.props;
    const title = context ? `Error in ${context}` : 'Something went wrong';

    return (
      /* Full-screen overlay — matches AccountDialog / NotificationDrawer pattern */
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-900/60"
        role="dialog"
        aria-modal="true"
        aria-labelledby="eb-title"
        aria-describedby="eb-desc"
      >
        {/* Dialog card */}
        <div className="flex w-full max-w-lg flex-col overflow-hidden rounded bg-white shadow-xl">

          {/* Header — brand-900 sidebar treatment from AccountDialog */}
          <div className="flex items-start gap-4 bg-brand-900 px-6 py-5 text-white">
            <span
              className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-300"
              aria-hidden="true"
            >
              <AlertTriangle size={22} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h2
                id="eb-title"
                className="font-display text-lg font-extrabold leading-tight"
              >
                {title}
              </h2>
              <p
                id="eb-desc"
                className="mt-0.5 text-sm text-white/65"
              >
                An unexpected error stopped this page from loading.
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">

            {/* Error message pill */}
            {error?.message && (
              <p className="border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800 font-medium">
                {error.message}
              </p>
            )}

            {/* Collapsible stack-trace — matches the sessions error style */}
            {(error?.stack || errorInfo?.componentStack) && (
              <div className="rounded border border-line">
                <button
                  type="button"
                  onClick={this.toggleDetails}
                  aria-expanded={detailsOpen}
                  className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-ink hover:bg-brand-50"
                >
                  <span>Technical details</span>
                  {detailsOpen
                    ? <ChevronUp size={16} aria-hidden="true" />
                    : <ChevronDown size={16} aria-hidden="true" />
                  }
                </button>

                {detailsOpen && (
                  <div className="border-t border-line bg-brand-50 px-4 py-3">
                    <pre className="scroll-slim max-h-48 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-brand-800">
                      {error?.stack ?? ''}
                      {errorInfo?.componentStack
                        ? `\n\nComponent stack:${errorInfo.componentStack}`
                        : ''}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Hint */}
            <p className="text-sm text-muted leading-relaxed">
              You can try reloading this section or return to the home page. If
              this keeps happening, contact your school administrator.
            </p>
          </div>

          {/* Footer actions — mirrors AccountDialog button row */}
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-6 py-4">
            <button
              type="button"
              onClick={this.handleGoHome}
              className="inline-flex min-h-10 items-center gap-2 rounded border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand-500 hover:text-brand-700"
            >
              <Home size={15} aria-hidden="true" />
              Go to home
            </button>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex min-h-10 items-center gap-2 rounded bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <RefreshCw size={15} aria-hidden="true" />
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }
}
