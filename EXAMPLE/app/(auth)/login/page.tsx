import React, { Suspense } from 'react';
import { AuthForm } from '@/features/auth/components/AuthForm';
import { ScaleLoader } from 'react-spinners';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-[#1B2559] font-medium">
        <ScaleLoader barCount={3} color="#a7a7a7ff" height={18} width={4} />
      </div>}>
        <AuthForm type="login" />
      </Suspense>
    </main>
  );
}
