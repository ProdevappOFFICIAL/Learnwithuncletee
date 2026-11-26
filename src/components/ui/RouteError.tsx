import { useState } from 'react';
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { AlertTriangle, ChevronDown, ChevronUp, Home, RefreshCw } from 'lucide-react';

/**
 * Router-level error element (react-router `errorElement`). The data router
 * catches render/loader errors itself and shows its own default screen unless
 * a route provides one — the class `ErrorBoundary` in App.tsx never sees
 * those. This renders the same branded dialog language for route failures:
 * 404s, forbidden gates, and unexpected crashes (e.g. a typo'd variable).
 */
export const RouteError = () => {
  const error = useRouteError() as unknown;
  const [detailsOpen, setDetailsOpen] = useState(false);

  // eslint-disable-next-line no-console
  console.error('[RouteError]', error);

  let title = 'Something went wrong';
  let message = error instanceof Error ? error.message : 'An unexpected error stopped this page from loading.';
  let stack: string | undefined = error instanceof Error ? error.stack : undefined;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = 'Page not found';
      message = 'This page does not exist or was moved. Check the address or return home.';
      stack = undefined;
    } else if (error.status === 403) {
      title = 'Access denied';
      message = 'Your account is not allowed to open this page.';
      stack = undefined;
    } else {
      title = `Something went wrong (${error.status})`;
      message = error.statusText || message;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-4 font-sans">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded bg-white shadow-xl" role="alert">
        <div className="flex items-start gap-4 bg-brand-900 px-6 py-5 text-white">
          <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-300" aria-hidden="true">
            <AlertTriangle size={22} strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-lg font-extrabold leading-tight">{title}</h1>
            <p className="mt-0.5 text-sm text-white/65">The app caught this instead of crashing.</p>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 break-words">
            {message}
          </p>

          {stack && (
            <div className="rounded border border-line">
              <button
                type="button"
                onClick={() => setDetailsOpen((s) => !s)}
                aria-expanded={detailsOpen}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-ink hover:bg-brand-50"
              >
                <span>Technical details</span>
                {detailsOpen ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
              </button>
              {detailsOpen && (
                <div className="border-t border-line bg-brand-50 px-4 py-3">
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-brand-800">
                    {stack}
                  </pre>
                </div>
              )}
            </div>
          )}

          <p className="text-sm leading-relaxed text-muted">
            Try reloading the page, or return home. If this keeps happening,
            contact your school administrator.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-6 py-4">
          <Link
            to="/"
            className="inline-flex min-h-10 items-center gap-2 rounded border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand-500 hover:text-brand-700"
          >
            <Home size={15} aria-hidden="true" />
            Go to home
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-10 items-center gap-2 rounded bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <RefreshCw size={15} aria-hidden="true" />
            Try again
          </button>
        </div>
      </div>
    </div>
  );
};
