"use client";

import React, { useEffect } from 'react'
import Header from "@/components/layout/Header"
import WorkspaceSideBar from "@/components/layout/WorkspaceSideBar"
import { useSidebar } from "@/context/SidebarContext"
import { useRouter } from 'next/navigation';

const WorkspaceContent = ({ children }: { children: React.ReactNode }) => {
    const { isLeftSidebarCollapsed, toggleLeftSidebar } = useSidebar();

    return (
        <div className='flex flex-col w-full h-screen bg-[#FAFBFF] text-xs relative overflow-hidden'>
            <Header />

            <div className='flex h-full w-full relative'>
                {/* Desktop Sidebar: Uses width for transition to push content */}
                <aside
                    className={`hidden md:block h-full transition-all duration-300 ease-in-out border-r border-gray-100 ${isLeftSidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-64 opacity-100'
                        }`}
                >
                    <WorkspaceSideBar />
                </aside>

                {/* Mobile Drawer Sidebar */}
                <div
                    className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${isLeftSidebarCollapsed ? 'invisible opacity-0' : 'visible opacity-100'
                        }`}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={toggleLeftSidebar}
                    />
                    {/* Drawer Content */}
                    <nav className={`absolute inset-y-0 left-0 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${isLeftSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
                        }`}>
                        <WorkspaceSideBar onClose={toggleLeftSidebar} />
                    </nav>
                </div>

                <main className='flex-1 overflow-y-auto bg-[#FAFBFF] w-full'>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default WorkspaceContent;