"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BiBookOpen, BiSolidShapes, BiUser } from 'react-icons/bi';
import { GiTeacher } from 'react-icons/gi';
import { MdReport, MdQuiz, MdLogout, MdArrowBack, MdOutlineAssignment } from 'react-icons/md';
import { SiGoogleclassroom } from 'react-icons/si';
import { authApi } from '@/lib/api/auth';
import { workspaceApi } from '@/lib/api/workspaces';
import { Workspace } from '@/types';
import { useUser } from '@/hooks/useUser';

export const navItems = [
    { label: 'Classes', href: '/workspace', icon: BiBookOpen },
    { label: 'Teachers', href: '/workspace/teachers', icon: GiTeacher },
    { label: 'Students', href: '/workspace/students', icon: BiUser },
    { label: 'Combinations', href: '/workspace/combinations', icon: BiSolidShapes },
    { label: 'Results', href: '/workspace/results', icon: MdReport },
];

export const TeacherNavItems = [
    { label: 'Assignments', href: '/workspace/assignments', icon: MdOutlineAssignment },
  //  { label: 'Results', href: '/workspace/results', icon: MdReport },
];

const WorkspaceSideBar = ({ onClose }: { onClose?: () => void }) => {
    const pathname = usePathname();
    const navigate = useRouter();

    const [user, setUser] = useState<any>(null);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    // This state prevents the "flash" of incorrect nav items
    const [isHydrated, setIsHydrated] = useState(false);
    const { data: profile } = useUser();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUser = window.localStorage.getItem('user');
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (error) {
                    console.error('Header: Failed to parse stored user', error);
                }
            }
            setIsHydrated(true);
        }
    }, []);

    // Prefer the authoritative profile from the API over stale/missing localStorage data
    useEffect(() => {
        if (profile) setUser(profile);
    }, [profile]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await workspaceApi.list();
                if (res.data) setWorkspaces(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);
    const handleLogout = async () => {


        if (typeof window !== 'undefined') {
            window.localStorage.removeItem('token');
            window.localStorage.removeItem('user');
        }

        try {
            if (typeof window !== 'undefined' && (window as any).api?.clearAuthToken) {
                await (window as any).api.clearAuthToken();
            }
        } catch (error) {
            console.warn('Header: clearAuthToken failed', error);
        }

        try {
            await authApi.logout();
        } catch (error) {
            console.warn('Header: authApi.logout failed', error);
        }

        navigate.push('/login');
    };

    const getLinkStyles = (isActive: boolean) =>
        `block px-3 py-1 rounded-sm text-xs ${isActive
            ? 'bg-zinc-300/20 text-[#0e0f10]'
            : 'hover:bg-accent-light'
        }`;

    // Choose the list based on role
    const currentNavItems = user?.role === "TEACHER" ? TeacherNavItems : navItems;
    const isTeacher = user?.role === "TEACHER";

    // Don't render the nav items until we know the user role
    if (!isHydrated) {
        return <aside className="w-64 h-full bg-white border-r border-zinc-400/20" />;
    }

    return (
        <aside className="w-full h-full text-sm bg-white border-r border-zinc-400/20 flex flex-col px-4 py-2 text-[#6b6b6b] z-100">
            <nav className="flex flex-col flex-1">
                {currentNavItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href === '/workspace' && pathname.startsWith('/workspace/classes')) ||
                        (item.href !== '/workspace' && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={getLinkStyles(isActive)}
                            onClick={onClose}
                        >
                            <Icon className="inline-block mr-2" />
                            {item.label}
                        </Link>
                    );
                })}

                <div className="mt-auto sticky pt-6 border-t border-zinc-400/20">
                    {!isTeacher && <button
                        onClick={() => navigate.push('/dashboard')}
                        className="w-full flex items-center gap-3 px-3 py-1 text-xs text-[#6b6b6b] hover:text-red-500 hover:bg-red-50 transition-all rounded-sm group mb-2"
                    >
                        <MdArrowBack className="group-hover:text-red-500" />
                        <span className="font-medium">Back Home</span>
                    </button>}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-1 text-xs text-[#6b6b6b] hover:text-red-500 hover:bg-red-50 transition-all rounded-sm group"
                    >
                        <MdLogout className="group-hover:text-red-500" />
                        <span className="font-medium">Log Out</span>
                    </button>
                </div>
            </nav>
        </aside>
    );
};

export default WorkspaceSideBar;