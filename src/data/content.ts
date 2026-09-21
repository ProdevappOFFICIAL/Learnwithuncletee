import type { Pillar, Testimonial, ResourceItem } from '@/types';

export const pillars: Pillar[] = [
  {
    id: 'excellence',
    title: 'Excellence',
    text: 'Structured curriculum resources that make complex topics simple for primary & secondary learners.',
    icon: '🏆',
  },
  {
    id: 'integrity',
    title: 'Integrity',
    text: 'Verified, educator-reviewed materials parents and schools can trust every term.',
    icon: '🤝',
  },
  {
    id: 'impact',
    title: 'Impact',
    text: 'Persona-driven workflows that bridge learning gaps and build confident, independent learners.',
    icon: '🚀',
  },
];

export const missionVision = [
  {
    id: 'mission',
    label: 'Our Mission',
    title: 'Simplify learning for every child',
    text: 'We break the curriculum into bite-size lessons, practice sets and toolkits that any student, parent or teacher can use immediately.',
  },
  {
    id: 'vision',
    label: 'Our Vision',
    title: 'Empowered educators, supported parents',
    text: 'A future where no child is left behind because the adults around them have the right resources at the right time.',
  },
];

export const testimonials: Testimonial[] = [
  {
    id: 't1',
    name: 'Adaeze O.',
    role: 'Student',
    quote:
      'The simplified lessons and past questions made JSCE prep so easy. I finally enjoy studying maths!',
    initials: 'AO',
    color: 'bg-amber-400',
  },
  {
    id: 't2',
    name: 'Mrs. Balogun',
    role: 'Parent',
    quote:
      'The home-support toolkit changed everything. I now track my son’s progress weekly without stress.',
    initials: 'MB',
    color: 'bg-emerald-400',
  },
  {
    id: 't3',
    name: 'Mr. Daniel E.',
    role: 'Educator',
    quote:
      'Lesson plans and teaching aids save me hours every week. My classroom engagement has doubled.',
    initials: 'DE',
    color: 'bg-sky-400',
  },
];

export const resourceItems: ResourceItem[] = [
  { id: 'r1', title: 'Primary 4 Maths – Fractions Worksheet Pack', category: 'Worksheets', level: 'Primary', format: 'Worksheet', downloads: '12.4k' },
  { id: 'r2', title: 'JSS3 English – Comprehensive Lecture Notes', category: 'Lecture Notes', level: 'Secondary', format: 'Notes', downloads: '8.1k' },
  { id: 'r3', title: 'WAEC Past Questions – Mathematics (2015-2024)', category: 'Past Papers', level: 'Secondary', format: 'PDF', downloads: '21.7k' },
  { id: 'r4', title: 'Primary 6 Science – Exam Prep Guide', category: 'Exam Prep', level: 'Primary', format: 'PDF', downloads: '6.9k' },
  { id: 'r5', title: 'SS2 Physics – Motion Video Series', category: 'Video Lessons', level: 'Secondary', format: 'Video', downloads: '4.2k' },
  { id: 'r6', title: 'Study Skills – Effective Strategy Guide', category: 'Study Guides', level: 'General', format: 'Notes', downloads: '9.3k' },
];
