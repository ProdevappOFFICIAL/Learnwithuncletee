import type { Persona } from '@/types';
import { ROUTES } from '@/routes/paths';

export const personas: Persona[] = [
  {
    id: 'students',
    title: 'Students',
    tagline: 'Learn smarter, not harder',
    description:
      'Simplified lessons, exam prep tools, practice questions and study strategy guides.',
    path: ROUTES.students,
    icon: '🎒',
    accent: {
      bg: 'bg-amber-400',
      soft: 'bg-amber-50',
      text: 'text-amber-700',
      ring: 'hover:ring-amber-300',
    },
    points: ['Simplified lessons', 'Past questions', 'Study strategies'],
    cta: 'Enter Student Portal',
  },
  {
    id: 'parents',
    title: 'Parents',
    tagline: 'Guide with confidence',
    description:
      'Guided learning frameworks, home-support toolkits and progress-tracking resources.',
    path: ROUTES.parents,
    icon: '🏠',
    accent: {
      bg: 'bg-emerald-400',
      soft: 'bg-emerald-50',
      text: 'text-emerald-700',
      ring: 'hover:ring-emerald-300',
    },
    points: ['Home toolkits', 'Learning frameworks', 'Progress tracking'],
    cta: 'Enter Parent Portal',
  },
  {
    id: 'teachers',
    title: 'Teachers',
    tagline: 'Teach with impact',
    description:
      'Downloadable lesson plans, classroom aids, topic ideas and professional growth.',
    path: ROUTES.teachers,
    icon: '📚',
    accent: {
      bg: 'bg-sky-400',
      soft: 'bg-sky-50',
      text: 'text-sky-700',
      ring: 'hover:ring-sky-300',
    },
    points: ['Lesson plans', 'Teaching aids', 'CPD resources'],
    cta: 'Enter Teacher Portal',
  },
  {
    id: 'resources',
    title: 'Resource Hub',
    tagline: 'Download in seconds',
    description:
      'Central repository for worksheets, lecture notes and past examination papers.',
    path: ROUTES.resources,
    icon: '📦',
    accent: {
      bg: 'bg-violet-400',
      soft: 'bg-violet-50',
      text: 'text-violet-700',
      ring: 'hover:ring-violet-300',
    },
    points: ['Worksheets', 'Lecture notes', 'Past papers'],
    cta: 'Browse Resources',
  },
];
