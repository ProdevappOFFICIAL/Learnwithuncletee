"use client";

import React from 'react';
import { HelpCircle, Users as UsersIcon, BarChart3 } from 'lucide-react';
import { AshardTabItem, AshardTabs } from '@/components/ui/AshardTabs';

const DatabaseLayout = ({ children }: { children: React.ReactNode }) => {
  const bankTabs: AshardTabItem[] = [
    {
      id: 'questions',
      label: 'Question Bank',
      href: '/dashboard/workspaces/database/questions',
      icon: <HelpCircle size={14} />,
    },
    {
      id: 'students',
      label: 'Student Bank',
      href: '/dashboard/workspaces/database/students',
      icon: <UsersIcon size={14} />,
    },
    {
      id: 'results',
      label: 'Result Bank',
      href: '/dashboard/workspaces/database/results',
      icon: <BarChart3 size={14} />,
    },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <AshardTabs items={bankTabs} className="mb-4 border-b border-[#ededed]" />
      {children}
    </div>
  );
};

export default DatabaseLayout;
