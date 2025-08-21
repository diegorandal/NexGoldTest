"use client"

import { useEffect, useState } from "react"
import { AuthButton } from "@/components/AuthButton"
import { Verify } from "@/components/Verify"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

// ▼▼▼ INTERRUPTOR DE MANTENIMIENTO ▼▼▼
// Ponelo en `true` para bloquear la verificación, o en `false` para que funcione normal.
let MAINTENANCE_MODE = true;

export default function Page() {
  const { status } = useSession()
  const router = useRouter()
  const [step, setStep] = useState<"loading" | "login" | "verify">("loading")
  const session = useSession();
  const walletAddress = session?.data?.user?.walletAddress;

  useEffect(() => {

    if (walletAddress === '0x10fed80b87407320cfb2affbd68be78868937a6e' || walletAddress === '0x4a789d9757a9c3bbfa7e271cf5039d508cd6f2e3') {
      console.log("Aloha");
      MAINTENANCE_MODE = false; // Desactiva el modo de mantenimiento para esta wallet específica
    }

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
       {step === "login"}
       
       {/* Lógica de Mantenimiento Aplicada Aquí */}
       {step === "verify" && (
          MAINTENANCE_MODE ? (
            <div className="text-center p-4 bg-yellow-900/50 border border-yellow-400 rounded-lg animate-fade-in">
              <h2 className="font-bold text-lg mb-2">Mantenimiento</h2>
              <p className="text-sm">La verificación está temporalmente desactivada. Por favor, vuelve a intentarlo más tarde.</p>
            </div>
          ) : (
            <Verify onSuccess={handleVerificationSuccess} />
          )
       )}
      </>
    </main>
  )
}
