import type { CoreValue, NavLink, StatItem, Testimonial, WhyChooseUsItem } from '@/types';
import { ROUTES } from '@/routes/paths';

export const siteInfo = {
  name: 'Learnwithuncletee',
  shortName: 'Learnwithuncletee',
  tagline: 'Nurturing future leaders',
  // TODO: replace with school-confirmed contact details
  address: '5 Unity Avenue , Valentino Ondo',
  phoneContacts: [
    { label: 'Central Admin', number: '+2347039334594', href: 'tel:+2347039334594' },
    { label: 'School Secretary', number: '08034422974', href: 'tel:08034422974' },
  ],
  email: 'info@learnwithuncletee.org',
  hours: 'Opening hours to be confirmed',
};

export const primaryNavLinks: NavLink[] = [
  { to: ROUTES.home, label: 'Home' },
  { to: ROUTES.about, label: 'About' },
  { to: ROUTES.academics, label: 'Academics' },
  { to: ROUTES.admissions, label: 'Admissions' },
  { to: ROUTES.studentLife, label: 'Student Life' },
  { to: ROUTES.services, label: 'Services' },
  { to: ROUTES.news, label: 'News & Events' },
  { to: ROUTES.gallery, label: 'Gallery' },
  { to: ROUTES.contact, label: 'Contact' },
];

// TODO: replace with verified figures from school management
export const keyStats: StatItem[] = [
  { id: 'students', label: 'Students', value: '1,200+' },
  { id: 'teachers', label: 'Qualified Teachers', value: '85+' },
  { id: 'years', label: 'Years of Excellence', value: '18' },
  { id: 'programmes', label: 'Academic Programmes', value: '3' },
  { id: 'facilities', label: 'Campus Facilities', value: '12' },
];

export const coreValues: CoreValue[] = [
  { id: 'faith', title: 'Faith', icon: '🙏' },
  { id: 'integrity', title: 'Integrity', icon: '🤝' },
  { id: 'excellence', title: 'Excellence', icon: '🏆' },
  { id: 'respect', title: 'Respect', icon: '💚' },
  { id: 'discipline', title: 'Discipline', icon: '📏' },
  { id: 'responsibility', title: 'Responsibility', icon: '🎯' },
  { id: 'innovation', title: 'Innovation', icon: '💡' },
];

export const whyChooseUs: WhyChooseUsItem[] = [
  { id: 'teachers', title: 'Experienced Teachers', text: 'Qualified, passionate educators dedicated to every learner.', icon: '👩‍🏫' },
  { id: 'holistic', title: 'Holistic Education', text: 'Academics balanced with character, faith and confidence building.', icon: '🌱' },
  { id: 'safe', title: 'Safe Environment', text: 'A secure, supportive and welcoming school community.', icon: '🛡️' },
  { id: 'facilities', title: 'Modern Facilities', text: 'Well-equipped classrooms, labs and recreational spaces.', icon: '🏫' },
  { id: 'character', title: 'Character Development', text: 'Programmes that shape discipline, leadership and integrity.', icon: '🧭' },
  { id: 'support', title: 'Student Support', text: 'Dedicated guidance, mentoring and welfare structures.', icon: '❤️' },
];

export const testimonials: Testimonial[] = [
  {
    id: 't1',
    name: 'Mrs. Adaeze O.',
    role: 'Parent',
    quote: 'Learnwithuncletee has given my daughter a safe, nurturing environment where she thrives academically and personally.',
    initials: 'AO',
    color: 'bg-brand-400',
  },
  {
    id: 't2',
    name: 'Daniel E.',
    role: 'Student',
    quote: 'The teachers care about us beyond the classroom. I love the clubs and the sports programmes here.',
    initials: 'DE',
    color: 'bg-lime-accent',
  },
  {
    id: 't3',
    name: 'Mr. Balogun',
    role: 'Educator',
    quote: 'A school community built on excellence, discipline and genuine care for every child.',
    initials: 'MB',
    color: 'bg-brand-200',
  },
];
