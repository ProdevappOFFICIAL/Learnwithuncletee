import type { HeroSlide } from '@/types';
import { ROUTES } from '@/routes/paths';

export const heroSlides: HeroSlide[] = [
  {
    id: 'slide-1',
    eyebrow: 'Welcome to Learnwithuncletee',
    title: 'Nurturing Future Leaders',
    text: 'Academic excellence, strong character and a supportive environment for every learner.',
    image: '/school.JPG',
    primaryCta: { label: 'Apply Now', to: ROUTES.admissions },
    secondaryCta: { label: 'Explore Our School', to: ROUTES.about },
  },
  {
    id: 'slide-2',
    eyebrow: 'Beyond the classroom',
    title: 'Learning Beyond the Classroom',
    text: 'Students participating in sports, practical learning, clubs and cultural activities.',
    image: '/students_playing_games.jfif',
    primaryCta: { label: 'Discover Student Life', to: ROUTES.studentLife },
  },
  {
    id: 'slide-3',
    eyebrow: 'A complete experience',
    title: 'A Complete School Experience',
    text: 'Academic programmes, boarding and support services working together for every child.',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=2000&q=85',
    primaryCta: { label: 'Explore Our Services', to: ROUTES.services },
  },
];
