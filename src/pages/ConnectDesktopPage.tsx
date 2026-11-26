import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/ui/Container';
import { PageMetadata } from '@/components/ui/PageMetadata';
import { useAuth } from '@/context/AuthContext';
import { apiGet } from '@/lib/api';
import { ROUTES } from '@/routes/paths';
import { Check, Copy, MonitorSmartphone, RefreshCw } from 'lucide-react';

/**
 * Connects the desktop app to the current web session. Issues a single-use,
 * 2-minute exchange code; the "Open desktop app" button fires a
 * learnwithuncletee:// deep link carrying ONLY the code (never tokens).
 * The desktop app exchanges it via POST /auth/exchange and signs in.
 */
export const ConnectDesktopPage = () => {
  const { user } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await apiGet<{ code: string }>('/auth/desktop-code');
      setCode(res.data.code);
    } catch (e: any) {
      setError(e?.message ?? 'Could not generate a code');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void generate();
  }, [generate]);

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard unavailable — code is selectable below */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const deepLink = code ? `learnwithuncletee://auth?code=${encodeURIComponent(code)}` : '#';

  return (
    <Layout>
      <PageMetadata title="Connect desktop app" description="Link the LearnWithUncleTee desktop app to your account with a one-time code." robots="noindex, nofollow" />
      <section className="py-14 sm:py-18">
        <Container>
          <div className="mx-auto max-w-xl border border-line bg-white p-6 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-700">Desktop app</p>
            <h1 className="mt-3 flex items-center gap-3 text-3xl font-extrabold">
              <MonitorSmartphone aria-hidden="true" size={30} className="text-brand-700" />
              Connect desktop app
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Signed in as <b className="text-ink">{user?.user_email}</b>. Generate a one-time code,
              then open it in the desktop app — it signs in as you. Codes expire after first use
              or 2 minutes and never contain your password or session tokens.
            </p>

            {error && (
              <p role="alert" className="mt-5 border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {error}{' '}
                <button type="button" onClick={generate} className="font-bold underline">Try again</button>
              </p>
            )}

            <div className="mt-6 rounded border border-dashed border-line bg-cream p-6 text-center">
              {loading ? (
                <p className="font-mono text-sm text-muted">Generating code…</p>
              ) : code ? (
                <>
                  <p className="font-mono truncate text-3xl font-extrabold tracking-[.2em] text-brand-900" aria-label={`Connection code ${code}`}>
                    {code}
                  </p>
                  <p className="mt-2 text-xs text-muted">Single use · expires in 2 minutes</p>
                </>
              ) : (
                <p className="text-sm text-muted">No code yet.</p>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {code && (
                <a
                  href={deepLink}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700"
                >
                  <MonitorSmartphone aria-hidden="true" size={16} className="mr-2" /> Open desktop app
                </a>
              )}
              <button
                type="button"
                onClick={copy}
                disabled={!code}
                className="inline-flex min-h-11 items-center rounded border border-line bg-white px-5 py-3 text-sm font-bold text-ink hover:border-brand-500 hover:text-brand-700 disabled:opacity-50"
              >
                {copied ? <Check aria-hidden="true" size={16} className="mr-2" /> : <Copy aria-hidden="true" size={16} className="mr-2" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={generate}
                disabled={loading}
                className="inline-flex min-h-11 items-center rounded border border-line bg-white px-5 py-3 text-sm font-bold text-ink hover:border-brand-500 hover:text-brand-700 disabled:opacity-50"
              >
                <RefreshCw aria-hidden="true" size={16} className="mr-2" /> New code
              </button>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-muted">
              Clicking “Open desktop app” asks your system for permission first — only approve it
              if you just installed the LearnWithUncleTee desktop app. Back to{' '}
              <Link to={ROUTES.home} className="font-bold text-brand-700 hover:underline">home</Link>.
            </p>
          </div>
        </Container>
      </section>
    </Layout>
  );
};
