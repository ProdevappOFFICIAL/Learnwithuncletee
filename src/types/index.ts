export interface Persona {
  id: string;
  title: string;
  tagline: string;
  description: string;
  path: string;
  icon: string;
  accent: {
    bg: string;
    soft: string;
    text: string;
    ring: string;
  };
  points: string[];
  cta: string;
}

export interface Pillar {
  id: string;
  title: string;
  text: string;
  icon: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: 'Student' | 'Parent' | 'Educator';
  quote: string;
  initials: string;
  color: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  category: string;
  level: 'Primary' | 'Secondary' | 'General';
  format: 'PDF' | 'Video' | 'Worksheet' | 'Notes';
  downloads: string;
}
