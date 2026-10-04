'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthForm } from '@/features/auth/components/AuthForm';
import { ScaleLoader } from 'react-spinners';

function InviteStudentContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 text-red-500 p-6 rounded-xl border border-red-100 max-w-md text-center">
          <h2 className="text-lg font-bold mb-2">Invalid Invite</h2>
          <p className="text-sm">This invitation link is missing a required security token. Please contact your administrator for a valid link.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50/50">
      <AuthForm
        type="invite"
        inviteToken={token}
        role="STUDENT"
      />
    </main>
  );
}

export default function InviteStudentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#1B2559] font-medium">
      <ScaleLoader barCount={3} color="#a7a7a7ff" height={18} width={4} />
    </div>}>
      <InviteStudentContent />
    </Suspense>
  );
}
