import { Metadata } from 'next';
import DashContent from '@/components/layout/DashContent';
import AuthGuard from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your central hub for managing workspaces, courses, and exams with ease",
  icons: {
    icon: "/learningdeck-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashContent>{children}</DashContent>
    </AuthGuard>
  );
}