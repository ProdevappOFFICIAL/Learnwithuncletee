import type { Facility } from '@/types';
import { BookOpen, Building2, FlaskConical, House, Laptop, Play, Trophy, Utensils } from 'lucide-react';

export const facilities: Facility[] = [
  { id: 'classrooms', title: 'Classrooms', description: 'Spacious, well-lit classrooms designed for focused learning.', icon: Building2 },
  { id: 'library', title: 'Library', description: 'A quiet space stocked with books and study resources.', icon: BookOpen },
  { id: 'ict-centre', title: 'ICT Centre', description: 'Computer labs equipped for digital literacy training.', icon: Laptop },
  { id: 'sports', title: 'Sports Area', description: 'Fields and courts supporting a wide range of sports.', icon: Trophy },
  { id: 'boarding', title: 'Boarding Facilities', description: 'Safe, supervised accommodation for boarding students.', icon: House },
  { id: 'dining', title: 'Dining / Catering Area', description: 'A clean, welcoming space for daily meals.', icon: Utensils },
  { id: 'laboratory', title: 'Laboratory', description: 'Equipped science labs for practical learning.', icon: FlaskConical },
  { id: 'playground', title: 'Playground', description: 'Safe outdoor play areas for younger learners.', icon: Play },
];
