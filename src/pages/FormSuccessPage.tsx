import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/ui/Container';
import { PageMetadata } from '@/components/ui/PageMetadata';
import { apiGet } from '@/lib/api';
import { ROUTES } from '@/routes/paths';
import { CheckCircle2, ChevronLeft } from 'lucide-react';

interface Receipt {
  reference: string;
  amountKobo: number;
  email: string | null;
  phone: string | null;
  formId: string | null;
  formTitle: string | null;
  paidAt: string;
}

/**
 * Paystack returns here (?reference=). Verifies server-side, persists the ref
 * for the form page, and shows a receipt. Not indexed.
 */
export const FormSuccessPage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!reference) {
      setError('No payment reference found.');
      setLoading(false);
      return;
    }
    apiGet<Receipt>(`/forms/checkout/verify/${reference}`)
      .then((res) => {
        if (cancelled) return;
        setReceipt(res.data);
        try {
          localStorage.setItem(`frm_paid_${id}`, reference);
        } catch {
          /* ignore */
        }
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.message ?? 'Payment could not be confirmed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, reference]);

  const backToForm = () =>
    navigate(ROUTES.formPublic.replace(':id', id), { state: reference ? { paymentRef: reference } : undefined });

  return (
    <Layout>
      <PageMetadata title="Payment confirmed" description="Your form payment was confirmed." robots="noindex, nofollow" />
      <section className="py-14">
        <Container>
          <div className="mx-auto w-full max-w-xl border border-line bg-white p-6 text-center sm:p-10">
            {loading ? (
              <div className="animate-pulse space-y-4" aria-label="Verifying payment">
                <div className="mx-auto h-14 w-14 rounded-full bg-brand-50" />
                <div className="h-6 rounded bg-brand-50" />
                <div className="h-12 rounded bg-brand-50" />
              </div>
            ) : error || !receipt ? (
              <>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Not confirmed</p>
                <h1 className="mt-3 text-3xl font-extrabold">Payment pending</h1>
                <p className="mt-3 text-sm text-muted">{error ?? 'We could not confirm this payment yet.'}</p>
                <button
                  type="button"
                  onClick={backToForm}
                  className="mt-8 inline-flex min-h-11 items-center rounded border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink hover:border-brand-500 hover:text-brand-700"
                >
                  <ChevronLeft aria-hidden="true" size={16} className="mr-1" /> Back to form
                </button>
              </>
            ) : (
              <>
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <CheckCircle2 size={26} aria-hidden="true" />
                </span>
                <p className="mt-6 text-xs font-bold uppercase tracking-widest text-brand-700">Payment confirmed</p>
                <h1 className="mt-3 text-3xl font-extrabold">₦{(receipt.amountKobo / 100).toLocaleString()}</h1>
                <dl className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm">
                  <div className="flex justify-between gap-4 border-b border-line pb-2">
                    <dt className="text-muted">Form</dt>
                    <dd className="font-bold">{receipt.formTitle ?? 'School form'}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-line pb-2">
                    <dt className="text-muted">Email</dt>
                    <dd className="font-bold">{receipt.email ?? '—'}</dd>
                  </div>
                  {receipt.phone && (
                    <div className="flex justify-between gap-4 border-b border-line pb-2">
                      <dt className="text-muted">Phone</dt>
                      <dd className="font-bold">{receipt.phone}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4 border-b border-line pb-2">
                    <dt className="text-muted">Reference</dt>
                    <dd className="font-mono text-xs font-bold">{receipt.reference}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Paid at</dt>
                    <dd className="font-bold">{new Date(receipt.paidAt).toLocaleString()}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  onClick={backToForm}
                  className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700"
                >
                  Continue to submit
                </button>
              </>
            )}
          </div>
        </Container>
      </section>
    </Layout>
  );
};
