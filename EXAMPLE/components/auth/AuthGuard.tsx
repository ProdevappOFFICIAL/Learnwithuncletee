"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ScaleLoader } from 'react-spinners';
import { authApi } from '@/lib/api/auth';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [inactiveUser, setInactiveUser] = useState<{ role: string; user_name: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authApi.verifyToken();
        if (response.success && response.data?.user) {
          const user = response.data.user;
          if (!user.active && (user.role === 'STUDENT' || user.role === 'TEACHER')) {
            setInactiveUser({ role: user.role, user_name: user.user_name });
            return;
          }
          if (user.role === 'STUDENT') {
            router.push('/student-portal/dashboard');
          } else if (user.role === 'ADMIN' && !user.hasSubscription) {
            router.push('/setup');
          } else if (user.role === 'TEACHER' && pathname.startsWith('/dashboard')) {
            router.push('/workspace/assignments');
          } else if (user.role === 'TEACHER' && pathname === '/workspace') {
            router.push('/workspace/assignments');
          } else {
            setIsAuthorized(true);
          }
        } else {
          router.push('/login');
        }
      } catch (err) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router, pathname]);

  if (inactiveUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFBFF] px-4">
        <div className="text-center text-sm text-red-600 max-w-sm">
          {inactiveUser.role}, {inactiveUser.user_name} is not active, contact admin.
        </div>
      </div>
    );
  }

  // Prevent flashing of protected content
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFBFF]">

      </div>
    );
  }

  return <>{children}</>;
}
