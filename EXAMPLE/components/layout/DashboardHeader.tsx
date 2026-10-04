import React from 'react';

interface DashboardHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export const DashboardHeader = ({ title, description, children }: DashboardHeaderProps) => {
  return (
    <div className="flex  top-0 w-full p-2 md:p-4   items-center justify-between mb-2 animate-in fade-in duration-500">
      <div>
        <h1 className="text-xs sm:text-sm font-medium text-[#0e0f10]  tracking-tight">{title}</h1>
        {description && <p className="text-[#6b6b6b] text-[10px] sm:text-xs mt-1">{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
};
