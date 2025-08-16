"use client"

import { useEffect, useState } from "react"
import { AuthButton } from "@/components/AuthButton"
import { Verify } from "@/components/Verify"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"

export default function Page() {
  const { status } = useSession()
  const router = useRouter()
  const [step, setStep] = useState<"loading" | "login" | "verify">("loading")
  const searchParams = useSearchParams();
  
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


    const ref = searchParams.get("ref");
    console.log("ref:", ref)

    router.push("/Home")

  }

  return (
    <main 
      className="flex flex-col items-center justify-end min-h-screen pb-40 text-white p-4"
      style={{
        backgroundImage: "url('/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black/10 z-0"/>

      <>
       {step === "loading" && <p>Conectando...</p>}
       {step === "login" && <AuthButton />}
       {step === "verify" && <Verify onSuccess={handleVerificationSuccess} />}
      </>
    </main>
  )
}
