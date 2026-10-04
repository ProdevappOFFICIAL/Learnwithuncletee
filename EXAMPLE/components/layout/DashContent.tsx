"use client"
import React from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useSidebar } from '@/context/SidebarContext'
const DashContent = ({ children }: { children: React.ReactNode }) => {
  const { isLeftSidebarCollapsed, toggleLeftSidebar } = useSidebar();

  return (
    <div className='flex flex-col w-full h-screen overflow-hidden bg-[#FAFBFF] text-xs relative'>
      <Header />

      <div className='flex h-full w-full relative'>
        {/* Desktop Sidebar */}
        <aside
          className={`hidden md:block h-full transition-all duration-300 ease-in-out border-r border-[#ededed] ${isLeftSidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-64 opacity-100'
            }`}
        >
          <Sidebar />
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
            <Sidebar onClose={toggleLeftSidebar} />
          </nav>
        </div>

        <main className='flex-1 overflow-y-auto bg-[#FAFBFF] w-full'>
          {children}
        </main>
      </div>


    </div>
  )
}

export default DashContent