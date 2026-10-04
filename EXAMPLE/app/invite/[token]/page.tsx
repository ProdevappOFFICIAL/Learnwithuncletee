'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AuthForm } from '@/features/auth/components/AuthForm';
import { inviteApi } from '@/lib/api/invites';
import { ScaleLoader } from 'react-spinners';
import { AlertCircle } from 'lucide-react';

export default function InviteTokenPage() {
  const params = useParams();
  const token = params.token as string;
  const [inviteData, setInviteData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) validateToken();
  }, [token]);

  const validateToken = async () => {
    setIsLoading(true);
    try {
      const response = await inviteApi.validate(token);
      if (response.success) {
        setInviteData(response.data);
      } else {
        setError(response.message || 'Invalid or expired invitation');
      }
    } catch {
      setError('Failed to validate invitation');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9f9]">
        <ScaleLoader barCount={3} color="#a7a7a7" height={20} width={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#f9f9f9]">
        <div className="bg-white border border-gray-100 border-y border-zinc-400/20 rounded p-8 max-w-md w-full text-center">
          <div className="w-10 h-10 bg-gray-50 rounded flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <h2 className="text-gray-900 tracking-tight mb-1">Invitation Error</h2>
          <p className="text-gray-500 mb-6 text-sm">{error}</p>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-8 h-10 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            Go to Login
          </a>
        </div>
      </div >
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#f9f9f9]">
      <AuthForm
        type="invite"
        inviteToken={token}
        role={inviteData?.role}
      />
    </main>
  );
}