'use client'

import { useState, useEffect, type FC } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Info, Loader, CheckCircle, XCircle } from 'lucide-react'
import { MiniKit } from '@worldcoin/minikit-js';
import { createPublicClient, http, parseEther, type Address } from "viem"
import { worldchain } from 'viem/chains'
import NEX_GOLD_STAKING_ABI from "@/abi/NEX_GOLD_STAKING_ABI.json"
import PERMIT2_ABI from "@/abi/Permit2.json" 
import { Card, InputGold, GoldButton, BackButton, UserInfo } from "@/components/ui-components"
import { useMiniKit } from "@/hooks/use-minikit"
import { useContractData } from "@/hooks/use-contract-data"

const NEX_GOLD_STAKING_ADDRESS: Address = "0x3c8acbee00a0304842a48293b6c1da63e3c6bc41"
const NEX_GOLD_TOKEN_ADDRESS: Address = "0xA3502E3348B549ba45Af8726Ee316b490f308dDC"
const PERMIT2_ADDRESS: Address = "0x000000000022D473030F116dDEE9F6B43aC78BA3"


const publicClient = createPublicClient({
  chain: worldchain,
  transport: http("https://worldchain-mainnet.g.alchemy.com/public"),
})

const StakingAndMiningSection: FC<{
  onBack: () => void
}> = ({ onBack }) => {
  const [amount, setAmount] = useState("")
  const { userAddress, sendTransaction, status, error } = useMiniKit()
  const { contractData, fetchContractData, isLocked } = useContractData()

  const isProcessing = status === "pending"

  useEffect(() => {
    if (status === "success") {
      fetchContractData()
      setAmount("")
    }
  }, [status, fetchContractData])

  const getPermit2Nonce = async (owner: Address): Promise<number> => {
    try {
      const nonce = await publicClient.readContract({
        address: PERMIT2_ADDRESS,
        abi: PERMIT2_ABI,
        functionName: 'nonce',
        args: [owner, NEX_GOLD_TOKEN_ADDRESS, 0],
      })
      return Number(nonce)
    } catch (e) {
      console.error("Error al obtener el nonce de Permit2:", e)
      return Date.now()
    }
  }

  const handleStake = async () => {
    const value = Number.parseFloat(amount)
    if (isNaN(value) || value <= 0) {
      alert("Por favor, introduce una cantidad válida.")
      return
    }
    if (!userAddress) {
      alert("No se pudo encontrar la dirección del usuario. Por favor, vuelve a conectar tu billetera.")
      return
    }

    const storedProof = sessionStorage.getItem("worldIdProof")
    if (!storedProof || storedProof === "undefined" || storedProof === "null") {
      alert("No se encontraron datos de verificación de World ID. Por favor, verifica tu identidad primero.")
      return
    }
    const verificationProof = JSON.parse(storedProof)
    const worldIdProof = {
      root: verificationProof.merkle_root,
      nullifierHash: verificationProof.nullifier_hash,
      proof: verificationProof.proof,
    }

    const amountWei = parseEther(amount)
    const currentNonce = await getPermit2Nonce(userAddress)

    const permitToSign = {
      permitted: {
        token: NEX_GOLD_TOKEN_ADDRESS,
        amount: amountWei,
      },
      nonce: currentNonce,
      deadline: Math.floor((Date.now() + 30 * 60 * 1000) / 1000),
      spender: NEX_GOLD_STAKING_ADDRESS,
    };

    try {
      await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            to: NEX_GOLD_STAKING_ADDRESS,
            abi: NEX_GOLD_STAKING_ABI as any,
            functionName: 'stake',
            args: [
              amountWei,
              worldIdProof.root,
              worldIdProof.nullifierHash,
              worldIdProof.proof,
              { 
                permitted: permitToSign.permitted,
                nonce: permitToSign.nonce,
                deadline: permitToSign.deadline,
              },
              'PERMIT2_SIGNATURE_PLACEHOLDER_0', 
            ],
          },
        ],
        permit2: [
          permitToSign,
        ],
      });
    } catch (e) {
      console.error("Error durante el proceso de staking con MiniKit:", e)
    }
  }

  const handleUnstake = async () => {
    const value = Number.parseFloat(amount)
    if (isNaN(value) || value <= 0) return
    await sendTransaction({
      transaction: [
        {
          to: NEX_GOLD_STAKING_ADDRESS,
          abi: NEX_GOLD_STAKING_ABI as any,
          functionName: "unstake",
          args: [parseEther(amount)],
        },
      ],
    })
  }

  const handleClaim = async () => {
    await sendTransaction({
      transaction: [
        {
          to: NEX_GOLD_STAKING_ADDRESS,
          abi: NEX_GOLD_STAKING_ABI as any,
          functionName: "claimAllRewards",
          args: [],
        },
      ],
    })
  }

  return (
    <div className="animate-fade-in">
      <Card className="space-y-4">
        {contractData.isLoading ? (
          <div className="text-center text-yellow-400">
            <Loader className="animate-spin inline-block" /> Cargando datos...
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <p className="text-sm text-gray-300">Balance Disponible</p>
              <p className="text-xl font-bold text-yellow-400">
                {Number.parseFloat(contractData.availableBalance).toFixed(4)} NXG
              </p>
            </div>

            <div className="text-center">
              <p className="text-lg text-gray-300">Balance en Staking</p>
              <p className="text-3xl font-bold text-white">
                {Number.parseFloat(contractData.stakedBalance).toFixed(4)} NXG
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-300">Recompensas Staking (APY)</p>
                <p className="text-xl font-bold text-green-400">
                  +{Number.parseFloat(contractData.stakingRewards).toFixed(4)} NXG
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-300">Recompensas Mining (Fijo)</p>
                <p className="text-xl font-bold text-yellow-400">
                  +{Number.parseFloat(contractData.miningRewards).toFixed(4)} NXG
                </p>
              </div>
            </div>

            {contractData.lockinEndDate && Number.parseFloat(contractData.stakedBalance) > 0 && (
              <div
                className={`text-center p-2 rounded-md text-sm ${isLocked ? "bg-red-900/50 text-red-300" : "bg-green-900/50 text-green-300"}`}
              >
                <Info className="inline-block mr-2 h-4 w-4" />
                {isLocked ? `Bloqueado hasta: ${contractData.lockinEndDate.toLocaleString()}` : "Fondos desbloqueados."}
              </div>
            )}

            <InputGold
              type="number"
              placeholder="Cantidad de NXG"
              value={amount}
              onChange={(e: any) => setAmount(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <GoldButton onClick={handleStake} disabled={isProcessing}>
                Stake
              </GoldButton>
              <GoldButton
                onClick={handleUnstake}
                disabled={isProcessing || Number.parseFloat(contractData.availableBalance) <= 0}
              >
                Unstake
              </GoldButton>
            </div>
            <GoldButton
              onClick={handleClaim}
              className="w-full"
              disabled={isProcessing || Number.parseFloat(contractData.stakedBalance) <= 0}
            >
              Reclamar Recompensas
            </GoldButton>
          </>
        )}

        <div className="h-10 text-center text-sm flex items-center justify-center">
          {status === "pending" && (
            <p className="text-yellow-400 flex items-center gap-2">
              <Loader className="animate-spin" />
              Procesando...
            </p>
          )}
          {status === "success" && (
            <p className="text-green-400 flex items-center gap-2">
              <CheckCircle />
              ¡Éxito!
            </p>
          )}
          {status === "error" && (
            <p className="text-red-400 flex items-center gap-2">
              <XCircle />
              Error: {error}
            </p>
          )}
        </div>
      </Card>
      <BackButton onClick={onBack} />
    </div>
  )
}

function MainAppContent() {
  const [activeSection, setActiveSection] = useState<"dashboard" | "staking">("dashboard")

  const renderSection = () => {
    const goBack = () => setActiveSection("dashboard")
    switch (activeSection) {
      case "dashboard":
        return (
          <GoldButton className="w-full" onClick={() => setActiveSection("staking")}>
            📈 Acceder a Staking & Mining
          </GoldButton>
        )
      case "staking":
        return <StakingAndMiningSection onBack={goBack} />
      default:
        return <GoldButton onClick={() => setActiveSection("staking")}>📈 Acceder a Staking & Mining</GoldButton>
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <UserInfo />
      </div>
      <main>{renderSection()}</main>
    </div>
  )
}

export default function HomePage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-yellow-400 bg-gray-900">Cargando...</div>
  }

  if (status === "authenticated") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 font-sans"
        style={{
          backgroundImage: "url('/background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="w-full max-w-md mx-auto bg-black/80 backdrop-blur-lg border border-yellow-500/20 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6">
          <header className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white">
              <span className="text-yellow-400">Nex</span>Gold
            </h1>
            <p className="text-yellow-500 text-lg">NXG Official App</p>
          </header>
          <MainAppContent />
        </div>
      </div>
    )
  }

  return null
}
