"use client";

import React, { createContext, useContext, useState } from 'react';

interface SidebarContextType {
    isLeftSidebarCollapsed: boolean;
    toggleLeftSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);

    const toggleLeftSidebar = () => {
        setIsLeftSidebarCollapsed(prev => !prev);
    };

    return (
        <SidebarContext.Provider value={{ isLeftSidebarCollapsed, toggleLeftSidebar }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
};
