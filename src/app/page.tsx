'use client';

import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useRouter } from 'next/navigation';
import { AuthButton } from '@/components/AuthButton';
import { Verify } from '@/components/Verify';

const neonTextStyle = {
  textShadow: `
    0 0 5px rgba(0, 191, 255, 0.7),
    0 0 10px rgba(0, 191, 255, 0.7),
    0 0 20px rgba(0, 191, 255, 0.5),
    0 0 40px rgba(0, 191, 255, 0.3)
  `,
};

export default function CustomLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [uiState, setUiState] = useState<'loading' | 'verifying' | 'manual_login'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      setUiState('verifying');
      return;
    }

    if (status === 'unauthenticated' && uiState === 'loading') {
      const autoSignIn = async () => {
        try {
          const nonceRes = await fetch('/api/get-nonce');
          if (!nonceRes.ok) throw new Error("Error del servidor al obtener nonce.");
          const { nonce, signedNonce } = await nonceRes.json();

          const result = await MiniKit.commandsAsync.solvePoW_and_proveOwnership(nonce);
          if (!result.finalPayload) throw new Error("La prueba de propiedad falló.");

          const signInResponse = await signIn('credentials', {
            finalPayloadJson: JSON.stringify(result.finalPayload),
            nonce,
            signedNonce,
            redirect: false,
          });

          if (signInResponse?.error) {
            throw new Error(signInResponse.error);
          }

        } catch (error: any) {
          console.error("Fallo el auto-login:", error);
          setErrorMessage("No se pudo conectar automáticamente. Por favor, conéctate manualmente.");
          setUiState('manual_login');
        }
      };
      autoSignIn();
    }
  }, [status, uiState]);

  const handleConnectSuccess = () => {
    window.location.reload();
  };

  const handleVerificationSuccess = () => {
    router.push('/Home');
  };

  const renderContent = () => {
    switch (uiState) {
      case 'loading':
        return <p className="text-gray-300">Conectando de forma segura...</p>;

      case 'verifying':
        return <Verify onSuccess={handleVerificationSuccess} />;

      case 'manual_login':
        return (
          <>
            {errorMessage && <p className="text-red-400 text-sm mb-4">{errorMessage}</p>}
            <p className="text-gray-300">
              Bienvenidos.
            </p>
            <AuthButton
              onConnectSuccess={handleConnectSuccess}
              className="bg-black rounded-lg p-4 border border-transparent hover:border-cyan-400 transition-all duration-300 group"
            >
              <span 
                className="text-xl font-bold text-white transition-all duration-300 group-hover:text-cyan-300"
                style={neonTextStyle}
              >
                Conectar Wallet
              </span>
            </AuthButton>
          </>
        );
    }
  };

  return (
    <main className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-blue-900 text-white min-h-screen">
        <div className="w-full max-w-sm p-8 bg-black/20 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl">
          <div className="flex flex-col items-center gap-6">
            {renderContent()}
        </div>
      </div>
    </main>
  );
}
