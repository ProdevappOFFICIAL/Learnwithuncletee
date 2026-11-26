import type { LucideIcon } from "lucide-react";

export interface Testimonial {
  id: string;
  name: string;
  role: "Student" | "Parent" | "Educator" | "Alumnus";
  quote: string;
  initials: string;
  color: string;
}

export interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  image: string;
  primaryCta: { label: string; to: string };
  secondaryCta?: { label: string; to: string };
}

export interface StatItem {
  id: string;
  label: string;
  value: string;
}

export interface Programme {
  id: string;
  level: "Early Years" | "Primary" | "Secondary";
  title: string;
  ageRange: string;
  description: string;
  outcomes: string[];
}

export interface ServiceItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  features: string[];
  icon: LucideIcon;
  ctaLabel: string;
}

export interface Facility {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface WhyChooseUsItem {
  id: string;
  title: string;
  text: string;
  icon: LucideIcon;
}

export interface NewsArticle {
  id: string;
  slug: string;
  category:
    | "News"
    | "Events"
    | "Announcements"
    | "Academic"
    | "Sports"
    | "Cultural";
  title: string;
  excerpt: string;
  date: string;
  image: string;
}

export interface GalleryImage {
  id: string;
  category:
    | "Campus"
    | "Academics"
    | "Students"
    | "Sports"
    | "Cultural"
    | "Events"
    | "Staff";
  caption: string;
  color: string;
}

export interface CoreValue {
  id: string;
  title: string;
  icon: LucideIcon | string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  message: string;
  img: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface NavLink {
  to: string;
  label: string;
}
