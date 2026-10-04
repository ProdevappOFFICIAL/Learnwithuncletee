"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface AshardTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href: string; // Made required for navigation tabs
}

interface SettingsTabsProps {
  items: AshardTabItem[];
  className?: string;
}

export const SettingsTabs = ({ items, className = '' }: SettingsTabsProps) => {
  const pathname = usePathname();

  const renderedItems = useMemo(
    () =>
      items.map((item) => {
        // Checks if current path is exactly the href OR a sub-path of the href
        // This ensures "Overview" stays active if you are at "workspaces/settings"
        const isActive = pathname === item.href

        return (
          <Link key={item.id} href={item.href} className="group">
            <span className={`flex items-center justify-center  gap-2 rounded px-4 py-2   transition-all duration-200 ${isActive
              ? 'bg-zinc-400/20 text-black'
              : ' text-slate-700 hover:bg-slate-50'
              }`}>

              <span>{item.label}</span>
            </span>
          </Link>
        );
      }),
    [pathname, items]
  );

  return (
    <nav className={`grid grid-cols-3 gap-2  rounded p-1 bg-[#f9f9f9] border border-[#ededed] w-fit ${className}`}>

      {renderedItems}
    </nav>
  );
};