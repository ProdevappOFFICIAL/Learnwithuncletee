import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { SiteText, useSiteGlobal, useSitePage } from '@/site/SiteContent';

const fieldClass = 'mt-2 min-h-12 w-full rounded border border-line bg-white px-3 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export const ContactPage = () => {
  const page = useSitePage<any>('contact');
  const site = useSiteGlobal();
  const [searchParams] = useSearchParams();
  const [sent, setSent] = useState(false);
  const initialTopic = searchParams.get('topic') ?? '';

  return (
    <Layout>
      <PageHero
        eyebrow={page.hero?.eyebrow}
        title={page.hero?.title}
        text={page.hero?.text}
        image={page.hero?.image}
        paths={{ eyebrow: 'contact.hero.eyebrow', title: 'contact.hero.title', text: 'contact.hero.text' }}
      />
      <section className="py-16 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
          <aside>
            <SiteText path="contact.intro.eyebrow" value={page.intro?.eyebrow} as="p" className="text-xs font-bold uppercase tracking-widest text-brand-700" />
            <SiteText path="contact.intro.title" value={page.intro?.title} as="h2" className="mt-3 text-3xl font-extrabold" />
            <SiteText path="contact.intro.text" value={page.intro?.text} as="p" className="mt-3 text-sm leading-relaxed text-muted" multiline />
            <div className="mt-7 space-y-5 border-t border-line pt-5 text-sm">
              <div><p className="text-xs font-bold uppercase tracking-wider text-brand-700">Address</p><p className="mt-1 text-muted"><SiteText path="global.address" value={site.address} /></p></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-brand-700">Phone</p><ul className="mt-1 space-y-2">{(site.phoneContacts ?? []).map((contact: any, index: number) => <li key={index}><span className="text-muted"><SiteText path={`global.phoneContacts.${index}.label`} value={contact.label} />: </span><a href={contact.href} className="font-semibold text-brand-700 hover:underline"><SiteText path={`global.phoneContacts.${index}.number`} value={contact.number} /></a></li>)}</ul></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-brand-700">Email</p><p className="mt-1 text-muted"><SiteText path="global.email" value={site.email} /></p></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-brand-700">Opening hours</p><p className="mt-1 text-muted"><SiteText path="global.hours" value={site.hours} /></p></div>
            </div>
            <SiteText path="contact.intro.notice" value={page.intro?.notice} as="p" className="mt-7 text-xs text-muted" multiline />
          </aside>
          <div className="border border-line p-6 sm:p-8">
            <SiteText path="contact.form.title" value={page.form?.title} as="h2" className="text-2xl font-extrabold" />
            <SiteText path="contact.form.text" value={page.form?.text} as="p" className="mt-2 text-sm text-muted" multiline />
            <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); setSent(true); }}>
              <label className="text-sm font-semibold">Full name<input className={fieldClass} name="name" autoComplete="name" required /></label>
              <label className="text-sm font-semibold">Email address<input className={fieldClass} name="email" type="email" autoComplete="email" required /></label>
              <label className="text-sm font-semibold">Phone<input className={fieldClass} name="phone" type="tel" autoComplete="tel" /></label>
              <label className="text-sm font-semibold">Topic
                <select className={fieldClass} name="topic" defaultValue={initialTopic}>
                  <option value="">Select a topic</option>
                  {(page.form?.topics ?? []).map((topic: string, index: number) => (
                    <option key={index} value={String(topic).toLowerCase()}>{topic}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold sm:col-span-2">Message<textarea className={`${fieldClass} min-h-32 py-3`} name="message" required /></label>
              <div className="sm:col-span-2">
                <button type="submit" className="min-h-12 rounded bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700">
                  {page.form?.submitLabel ?? 'Send enquiry'}
                </button>
                {sent && <p role="status" className="mt-3 text-sm font-semibold text-brand-700">{page.form?.sentText}</p>}
                <p className="mt-4 text-xs text-muted">{page.form?.notice}</p>
              </div>
            </form>
          </div>
        </Container>
      </section>
    </Layout>
  );
};
