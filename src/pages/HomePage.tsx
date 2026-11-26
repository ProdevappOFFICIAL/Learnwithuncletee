import { Layout } from '@/components/layout/Layout';
import { Hero } from '@/components/home/Hero';
import {
  FacilitiesSection,
  GalleryPreviewSection,
  NewsSection,
  ProgrammesSection,
  ServicesSection,
  StatsStrip,
  StudentLifeSection,
  TestimonialsSection,
  WelcomeSection,
  WhyChooseUsSection,
} from '@/components/home/HomeSections';

export const HomePage = () => (
  <Layout>
    <Hero />
    <StatsStrip />
    <WelcomeSection />
    <ProgrammesSection />
    <WhyChooseUsSection />
    <ServicesSection />
    <FacilitiesSection />
    <StudentLifeSection />
    <NewsSection />
    <GalleryPreviewSection />
    <TestimonialsSection />
  </Layout>
);
