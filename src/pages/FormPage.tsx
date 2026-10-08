import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/ui/Container';
import { PageMetadata } from '@/components/ui/PageMetadata';
import { PageHero } from '@/components/ui/PageHero';
import { apiGet, apiPost } from '@/lib/api';
import { UploadButton } from '@/lib/uploadthing';
import { ROUTES } from '@/routes/paths';
import type { FormFieldItem } from '@/data/dashboard';
import { CheckCircle2, ChevronLeft } from 'lucide-react';

interface PublicForm {
  id: string;
  title: string;
  description?: string | null;
  amountKobo: number;
  fields: FormFieldItem[];
}

const inputClass = 'mt-2 min-h-12 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export const FormPage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState<PublicForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [values, setValues] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  // Paystack appends ?reference= (and ?trxref=) on return from checkout.
  const [paymentRef, setPaymentRef] = useState<string | null>(() => searchParams.get('reference') || searchParams.get('trxref'));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiGet<PublicForm>(`/forms/public/${id}`)
      .then((res) => {
        if (!cancelled) setForm(res.data);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.message ?? 'Could not load form');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const set = (fieldId: string, v: any) => setValues((prev) => ({ ...prev, [fieldId]: v }));

  const pay = async () => {
    if (!form || !email.trim()) {
      setNotice('Enter your email first — receipts go there.');
      return;
    }
    setPaying(true);
    setNotice(null);
    try {
      const res = await apiPost<{ authorization_url: string; reference: string }>('/billing/form-initialize', {
        email: email.trim(),
        formId: form.id,
        callbackUrl: window.location.origin + '/form/' + form.id,
      });
      window.location.href = res.data.authorization_url;
    } catch (e: any) {
      setNotice(e?.message ?? 'Could not start payment');
      setPaying(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    setNotice(null);
    try {
      await apiPost(`/forms/${form.id}/responses`, {
        email: email.trim(),
        answers: values,
        paymentRef: paymentRef || undefined,
      });
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch (e: any) {
      setNotice(e?.message ?? 'Submit failed');
    } finally {
      setBusy(false);
    }
  };

  const paid = form ? form.amountKobo <= 0 || !!paymentRef : false;

  return (

      <><PageMetadata
      title={form ? form.title : 'Form'}
      description={form?.description ?? 'Fill and submit this school form.'}
      robots="noindex, nofollow" /><PageHero eyebrow="School form" title={form?.title ?? 'Form'} text={form?.description ?? ''} image="/school.JPG" /><section className="py-14">
        <Container>
          <div className="mx-auto w-full max-w-2xl">
            {loading ? (
              <div className="animate-pulse space-y-4" aria-label="Loading">
                <div className="h-12 rounded bg-brand-50" />
                <div className="h-12 rounded bg-brand-50" />
                <div className="h-12 rounded bg-brand-500/40" />
              </div>
            ) : error || !form ? (
              <div className="border border-line bg-white p-8 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Unavailable</p>
                <h2 className="mt-3 text-2xl font-extrabold">This form isn't open</h2>
                <p className="mt-2 text-sm text-muted">{error ?? 'Check the link with the school.'}</p>
                <Link to={ROUTES.home} className="mt-6 inline-flex min-h-11 items-center rounded bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
                  <ChevronLeft aria-hidden="true" size={16} className="mr-1" /> Back home
                </Link>
              </div>
            ) : done ? (
              <div className="border border-line bg-white p-8 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <CheckCircle2 size={26} aria-hidden="true" />
                </span>
                <p className="mt-6 text-xs font-bold uppercase tracking-widest text-brand-700">Response received</p>
                <h2 className="mt-3 text-3xl font-extrabold">Thank you!</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Your response to “{form.title}” was recorded{paymentRef ? ' with payment confirmed' : ''}.
                </p>
                <Link to={ROUTES.home} className="mt-8 inline-flex min-h-11 items-center rounded bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
                  <ChevronLeft aria-hidden="true" size={16} className="mr-1" /> Back home
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5 border border-line bg-white p-6 sm:p-8">
                {form.amountKobo > 0 && (
                  <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">
                    This form costs <b>₦{(form.amountKobo / 100).toLocaleString()}</b>.
                    {paymentRef ? ' Payment detected — you can submit.' : ' Pay first, then submit.'}
                  </p>
                )}
                <label className="block text-sm font-semibold">
                  Email address
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className={inputClass} />
                </label>

                {form.fields.map((f) => (
                  <div key={f.id}>
                    {f.type === 'PAYMENT' ? (
                      <div className="rounded border border-line bg-cream p-4">
                        <p className="text-sm font-bold">Payment — ₦{(form.amountKobo / 100).toLocaleString()}</p>
                        {paymentRef ? (
                          <p className="mt-2 text-sm text-emerald-700">✓ Payment received (ref {paymentRef.slice(0, 18)}…). Submit below.</p>
                        ) : (
                          <button type="button" disabled={paying} onClick={pay} className="mt-3 inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                            {paying ? 'Starting payment…' : 'Pay with Paystack'}
                          </button>
                        )}
                      </div>
                    ) : f.type === 'MULTIPLE_CHOICE' || f.type === 'TRUE_FALSE' ? (
                      <fieldset>
                        <legend className="text-sm font-semibold">
                          {f.label} {f.required && <span className="text-rose-700">*</span>}
                        </legend>
                        <div className="mt-2 space-y-2">
                          {(f.options ?? []).map((opt) => (
                            <label key={opt} className={`flex cursor-pointer items-center gap-3 rounded border px-4 py-3 text-sm ${values[f.id] === opt ? 'border-brand-500 bg-brand-50 font-bold text-brand-800' : 'border-line hover:border-brand-500'}`}>
                              <input
                                type="radio"
                                name={f.id}
                                checked={values[f.id] === opt}
                                onChange={() => set(f.id, opt)}
                                required={f.required && values[f.id] === undefined}
                                className="h-4 w-4 accent-brand-700" />
                              {opt}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ) : f.type === 'FILE' ? (
                      <div>
                        <p className="text-sm font-semibold">
                          {f.label} {f.required && <span className="text-rose-700">*</span>}
                        </p>
                        <div className="mt-2">
                          <UploadButton
                            endpoint="formResponseUploader"
                            formId={form.id}
                            label={(values[f.id]?.length ?? 0) > 0 ? `✓ ${values[f.id].length} file(s) attached` : 'Choose file & upload'}
                            onClientUploadComplete={(res) => set(f.id, [...(values[f.id] ?? []), ...res.map((r) => r.ufsUrl)])}
                            onUploadError={(err) => setNotice(err.message)} />
                        </div>
                      </div>
                    ) : (
                      <label className="block text-sm font-semibold">
                        {f.label} {f.required && <span className="text-rose-700">*</span>}
                        <input
                          value={values[f.id] ?? ''}
                          onChange={(e) => set(f.id, e.target.value)}
                          required={f.required}
                          placeholder={f.type === 'FILL_BLANK' ? 'Fill in the blank…' : 'Your answer…'}
                          className={inputClass} />
                      </label>
                    )}
                  </div>
                ))}

                {notice && (
                  <p role="alert" className="border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">{notice}</p>
                )}
                <button
                  type="submit"
                  disabled={busy || !paid}
                  title={!paid ? 'Complete payment first' : undefined}
                  className="min-h-12 w-full rounded bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {busy ? 'Submitting…' : form.amountKobo > 0 && !paymentRef ? 'Pay first to submit' : 'Submit response'}
                </button>
              </form>
            )}
          </div>
        </Container>
      </section></>
  
  );
};
