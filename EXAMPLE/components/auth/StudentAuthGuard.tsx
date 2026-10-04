"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';

export default function StudentAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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
            setIsAuthorized(true);
          } else {
            // Logged in as admin/teacher. Redirect to standard workspace or dashboard.
            router.push(user.role === 'TEACHER' ? '/workspace' : '/dashboard');
          }
        } else {
          router.push('/student-portal');
        }
      } catch (err) {
        router.push('/student-portal');
      }
    };

    checkAuth();
  }, [router]);

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
