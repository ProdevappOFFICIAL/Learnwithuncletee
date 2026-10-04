"use client";

import { useState } from 'react';
import { Briefcase, Home, Settings2, Activity, LayoutDashboard, Settings, BarChart3, Database } from 'lucide-react';
import { AshardTabItem, AshardTabs } from '@/components/ui/AshardTabs';
import { GrUserAdd } from 'react-icons/gr';
import { GiChart, GiTeacher } from 'react-icons/gi';

const WorkspacesLayout = ({ children }: { children: React.ReactNode }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'manage' | 'usage' | 'invitations'>('home');

  const workspaceTabs: AshardTabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      href: '/dashboard/workspaces',
      icon: <LayoutDashboard size={15} />,
    },
    {
      id: 'manage',
      label: 'Manage',
      href: '/dashboard/workspaces/manage',
      icon: <Settings size={15} />,
    },
    {
      id: 'usage',
      label: 'Usage',
      href: '/dashboard/workspaces/usage',
      icon: <GiChart size={15} />,
    },
      {
      id: 'member',
      label: 'Members',
      href: '/dashboard/workspaces/members',
      icon: <GiTeacher size={15} />,
    },
    {
      id: 'invitations',
      label: 'Invitations',
      href: '/dashboard/workspaces/invitations',
      icon: <GrUserAdd size={15} />,
    },
     {
      id: 'database',
      label: 'Database',
      href: '/dashboard/workspaces/database',
      icon: <Database size={15} />,
    },
     {
      id: 'manager',
      label: 'Manager',
      href: '/dashboard/workspaces/manager',
      icon: <Briefcase size={15} />,
    }
  ];

  return (
    <div className="  animate-in fade-in slide-in-from-bottom-2 duration-500 selection:bg-blue-100 h-full  p-2 md:p-4 overflow-hidden">
      <AshardTabs items={workspaceTabs} className="mb-4 " />
      {children}
    </div>
  );
};

export default WorkspacesLayout;