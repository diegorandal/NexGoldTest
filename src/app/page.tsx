"use client"

import { useEffect, useState } from "react"
import { AuthButton } from "@/components/AuthButton"
import { Verify } from "@/components/Verify"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { NextResponse } from 'next/server';

export default function Page() {
  const { status } = useSession()
  const router = useRouter()
  const [step, setStep] = useState<"loading" | "login" | "verify">("loading")

  // On app initialization
  useEffect(() => {
  }, [])

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

    try {

      //analisis de la path
      const url = async function GET(request: Request) {
        const url = new URL(request.url);
        const refCode = url.pathname.split('/').at(-2);
        console.log("path completa:", url)
        console.log("path spliteada:", refCode)
      }

      if(!url) {
        console.error("No se pudo obtener la URL")
      }

    } catch (error) {
      console.error("Error handling referral code:", error)
    }


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
