"use client"

import { useEffect, useState } from "react"
import { AuthButton } from "@/components/AuthButton"
import { Verify } from "@/components/Verify"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function Page() {
  const { status } = useSession()
  const router = useRouter()

  const [step, setStep] = useState<"loading" | "login" | "verify">("loading")

  useEffect(() => {
    if (status === "loading") return

    if (status === "authenticated") {
      setStep("verify")
    } else {
      setStep("login")
    }
  }, [status])

  const handleVerificationSuccess = (verificationProof: any) => {
    sessionStorage.setItem("worldIdProof", JSON.stringify(verificationProof))
    sessionStorage.setItem("isVerified", "true")
    router.push("/Home")
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-black via-yellow-500 to-yellow-700 text-white p-4">
      {step === "loading" && <p>Conectando...</p>}

      {step === "login" && <AuthButton />}

      {step === "verify" && <Verify onSuccess={handleVerificationSuccess} />}

    </main>
  )
}