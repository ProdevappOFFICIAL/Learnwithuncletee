import { Metadata } from 'next';
import WorkspaceContent from '@/components/layout/WorkspaceContent';
import AuthGuard from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: "Workspace",
  description: "Manage your courses and collaborative tools",
};


export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <WorkspaceContent>{children}</WorkspaceContent>
    </AuthGuard>
  );
}