'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { MiniKit, VerificationLevel, ISuccessResult } from "@worldcoin/minikit-js";
import { useSession } from 'next-auth/react';

interface VerifyButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const VerifyButton: React.FC<VerifyButtonProps> = ({ onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-base font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="relative flex items-center px-6 py-3 transition-all ease-in duration-150 bg-gray-900 rounded-md group-hover:bg-opacity-0">
        <ShieldCheck className="w-5 h-5 me-2 text-white" aria-hidden="true" />
        <span className="text-white">Verify</span>
      </span>
    </button>
  );
};

interface VerifyProps {
  onSuccess: () => void;
}

export function Verify({ onSuccess }: VerifyProps) {
  const { data: session } = useSession();
  const walletAddress = session?.user?.walletAddress;

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const handleVerificationClick = async () => {
    setIsVerifying(true);
    setVerificationError(null);

    if (!MiniKit.isInstalled()) {
      setVerificationError('World App no está instalado.');
      setIsVerifying(false);
      return;
    }

    try {
      const { finalPayload } = await MiniKit.commandsAsync.verify({
        action: 'testing-action',
        signal: walletAddress,
        verification_level: VerificationLevel,
      });

      if (finalPayload.status === 'error') {
        throw new Error(finalPayload.error_code ?? 'Verificación cancelada en MiniKit.');
      }

      const verifyResponse = await fetch('/api/verify-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: finalPayload as ISuccessResult,
          action: 'testing-action',
          signal: walletAddress,
        }),
      });

      const verifyResponseJson = await verifyResponse.json();

      if (verifyResponse.status === 200 && verifyResponseJson.success) {
        onSuccess();
      } else {
        throw new Error(verifyResponseJson.verifyRes?.detail || 'La verificación de la prueba falló.');
      }
    } catch (err: any) {
      console.error("Error durante la verificación:", err);
      setVerificationError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full max-w-sm flex flex-col items-center text-center mt-4">
      <p className="mb-4 text-slate-300">Verifica y comenza a ganar.</p>
      <VerifyButton onClick={handleVerificationClick} disabled={isVerifying} />
      <div className="h-10 mt-2 text-sm flex flex-col items-center justify-center">
        {isVerifying && <p>Abriendo World App para verificar...</p>}
        {verificationError && <p className="text-red-400">{verificationError}</p>}
      </div>
    </div>
  );
}
