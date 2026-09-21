import { Layout } from '@/components/layout/Layout';
import { Hero } from '@/components/home/Hero';
import { PersonaGrid } from '@/components/home/PersonaGrid';
import { PillarGrid } from '@/components/home/PillarGrid';
import { Testimonials } from '@/components/home/Testimonials';

export const HomePage = () => (
  <Layout>
    <Hero />
    <PersonaGrid />
    <PillarGrid />
    <Testimonials />
  </Layout>
);
