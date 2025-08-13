"use client"

import type React from "react"
import { useState } from "react"
import { ShieldCheck } from 'lucide-react'
import { MiniKit, VerificationLevel, type ISuccessResult } from "@worldcoin/minikit-js"
import { useSession } from "next-auth/react"

interface VerifyButtonProps {
  onClick: () => void
  disabled?: boolean
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
  )
}

interface VerifyProps {
  onSuccess: (verificationProof: any) => void
}

export function Verify({ onSuccess }: VerifyProps) {
  const { data: session } = useSession()
  const walletAddress = session?.user?.walletAddress

  const [buttonState, setButtonState] = useState<"pending" | "success" | "failed" | undefined>(undefined)

  const handleVerificationClick = async () => {
    setButtonState("pending")

    try {
      const result = await MiniKit.commandsAsync.verify({
        action: "testing-action",
        verification_level: VerificationLevel.Device,
        signal: walletAddress,
      })

      if (result.finalPayload.status === "error") {
        throw new Error(result.finalPayload.error_code ?? "Verificación cancelada en MiniKit.")
      }

      const verifyResponse = await fetch("/api/verify-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: result.finalPayload as ISuccessResult,
          action: "testing-action",
          signal: walletAddress,
        }),
      })

      const verifyResponseJson = await verifyResponse.json()

      if (verifyResponse.status === 200 && verifyResponseJson.verifyRes?.success) {
        setButtonState("success")
        onSuccess(result.finalPayload)
      } else {
        setButtonState("failed")
        setTimeout(() => setButtonState(undefined), 2000)
      }
    } catch (error: any) {
      console.error("Error durante la verificación:", error)
      setButtonState("failed")
      setTimeout(() => setButtonState(undefined), 2000)
    }
  }

  return (
    <div
      className="w-full max-w-sm flex flex-col items-center text-center mt-4
      bg-gradient-to-br from-black to-yellow-500/80 rounded-lg p-6 shadow-lg"
    >
      <p className="mb-4 text-slate-300">Verifica y comenza a ganar.</p>
      {buttonState !== "success" && (
        <VerifyButton onClick={handleVerificationClick} disabled={buttonState === "pending"} />
      )}
      <div className="h-10 mt-2 text-sm flex flex-col items-center justify-center">
        {buttonState === "pending" && <p>Abriendo World App para verificar...</p>}
        {buttonState === "failed" && <p className="text-red-400">Error al verificar, intenta nuevamente.</p>}
        {buttonState === "success" && <p className="text-green-400">¡Verificación exitosa! Redirigiendo...</p>}
      </div>
    </div>
  )
}