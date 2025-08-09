'use client';

import { useEffect, useState } from 'react';
import { AuthButton } from '@/components/AuthButton';
import { Verify } from '@/components/Verify';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const { status } = useSession();
  const router = useRouter();

  const [step, setStep] = useState<'loading' | 'login' | 'verify'>('loading');

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'authenticated') {
      setStep('verify');
    } else {
      setStep('login');
    }
  }, [status]);

  const handleVerificationSuccess = () => {
    router.push('/Home');
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white p-4">
      {step === 'loading' && <p>Conectando...</p>}

      {step === 'login' && <AuthButton />}

      {step === 'verify' && <Verify onSuccess={handleVerificationSuccess} />}
    </main>
  );
}