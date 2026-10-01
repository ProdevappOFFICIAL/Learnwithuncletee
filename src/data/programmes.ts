import type { Programme } from '@/types';

// TODO: confirm exact curriculum, class levels and outcomes with school management
export const programmes: Programme[] = [
  {
    id: 'early-years',
    level: 'Early Years',
    title: 'Early Years / Nursery',
    ageRange: 'Ages 2 – 5',
    description: 'A nurturing foundation that builds curiosity, social skills and early literacy through play-based learning.',
    outcomes: ['Early literacy & numeracy', 'Social & emotional development', 'Motor skills & creativity'],
  },
  {
    id: 'primary',
    level: 'Primary',
    title: 'Primary School',
    ageRange: 'Ages 6 – 11',
    description: 'A structured curriculum covering core subjects, critical thinking and character formation.',
    outcomes: ['Strong literacy & numeracy', 'Critical thinking skills', 'Confidence & discipline'],
  },
  {
    id: 'secondary',
    level: 'Secondary',
    title: 'Secondary School',
    ageRange: 'Ages 12 – 18',
    description: 'A rigorous academic programme preparing students for examinations and future opportunities.',
    outcomes: ['Examination preparation', 'Specialised subject tracks', 'Leadership & independence'],
  },
];
