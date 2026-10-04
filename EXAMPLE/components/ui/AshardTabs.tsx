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

interface AshardTabsProps {
  items: AshardTabItem[];
  className?: string;
}

export const AshardTabs = ({ items, className = '' }: AshardTabsProps) => {
  const pathname = usePathname();

  const renderedItems = useMemo(
    () =>
      items.map((item) => {
        // Checks if current path matches the link href
        const isActive = pathname === item.href;

        return (
          <Link 
            key={item.id} 
            href={item.href} 
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2  scale-100 hover:scale-105 transition-all duration-700 ${
              isActive
                ? "border-[#0e0f10] text-[#0e0f10]"
                : "border-transparent text-[#6b6b6b] hover:text-[#0e0f10]"
            }`}
          >
            {item.icon && <span className="flex items-center justify-center ">{item.icon}</span>}
            <span>{item.label}</span>
          </Link>
        );
      }),
    [pathname, items]
  );

  return (
    <nav className={`flex items-center gap-2 w-full ${className}`}>
      {renderedItems}
    </nav>
  );
};