import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/routes/paths';

export const NotFoundPage = () => (
  <Layout hideCta>
    <section className="mx-auto max-w-2xl px-4 py-24 text-center">
      <p className="text-6xl">404</p>
      <h1 className="mt-4 text-4xl font-extrabold">Page not found</h1>
      <p className="mt-2 text-muted">The page you’re looking for doesn’t exist. Let’s get you back to the school website.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Button to={ROUTES.home} variant="primary">Back Home</Button>
        <Button to={ROUTES.contact} variant="outline">Contact Us</Button>
      </div>
    </section>
  </Layout>
);
