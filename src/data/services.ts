import type { ServiceItem } from '@/types';
import { BookOpen, BusFront, Laptop, Landmark, House, Utensils } from 'lucide-react';

// TODO: confirm availability, pricing and details with school management before publishing
export const services: ServiceItem[] = [
  {
    id: 'catering',
    slug: 'catering',
    title: 'Catering Services',
    summary: 'Nutritious, well-balanced meals prepared for students and school events.',
    description:
      'Our catering team provides daily meals for students as well as catering support for school events and functions, with attention to hygiene and balanced nutrition.',
    features: ['Daily student meals', 'Special dietary options', 'Event & function catering'],
    icon: Utensils,
    ctaLabel: 'Request Catering',
  },
  {
    id: 'coaching',
    slug: 'coaching',
    title: 'Coaching Center',
    summary: 'Extra academic support and examination coaching for students at every level.',
    description:
      'The coaching center offers focused academic support outside regular class hours, helping students strengthen weak areas and prepare confidently for examinations.',
    features: ['Subject-focused coaching', 'Examination preparation', 'Small group sessions'],
    icon: BookOpen,
    ctaLabel: 'Enquire About Coaching',
  },
  {
    id: 'accommodation',
    slug: 'accommodation',
    title: 'Accommodation / Boarding',
    summary: 'Safe, supervised boarding facilities with meals, study time and welfare support.',
    description:
      'Our boarding facilities provide a safe home away from home, with supervised accommodation, regular meals, structured study periods and welfare support.',
    features: ['Supervised housing', 'Meals included', 'Structured study periods'],
    icon: House,
    ctaLabel: 'Learn About Boarding',
  },
  {
    id: 'events',
    slug: 'events',
    title: 'Event / Conference Center',
    summary: 'A versatile venue available for school and approved external events.',
    description:
      'Our event and conference facilities can host school functions, workshops and approved community events with modern amenities.',
    features: ['Flexible event spaces', 'Modern amenities', 'Booking enquiries welcome'],
    icon: Landmark,
    ctaLabel: 'Book a Venue Enquiry',
  },
  {
    id: 'ict',
    slug: 'ict',
    title: 'ICT / Digital Skills',
    summary: 'Computer literacy and digital skills training for students of all ages.',
    description:
      'Our ICT program builds digital literacy through hands-on computer training, equipping students with practical skills for the modern world.',
    features: ['Computer literacy training', 'Hands-on digital projects', 'Age-appropriate curriculum'],
    icon: Laptop,
    ctaLabel: 'Explore ICT Programmes',
  },
  {
    id: 'transportation',
    slug: 'transportation',
    title: 'Transportation',
    summary: 'Supervised school transport routes for students within the catchment area.',
    description:
      'We provide safe and supervised transportation options for students, with defined routes and registration handled through the school office.',
    features: ['Supervised school routes', 'Registration through school office', 'Safety-first approach'],
    icon: BusFront,
    ctaLabel: 'Register for Transport',
  },
];
