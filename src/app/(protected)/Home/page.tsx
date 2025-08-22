"use client"

import { useState, useEffect, type FC, useCallback } from "react"
import { parseEther, getAddress, formatEther } from "viem"
import { useSession } from "next-auth/react"
import { Info, Loader, CheckCircle, XCircle, History } from 'lucide-react'
import { useRouter } from "next/navigation"
import { Card, InputGold, GoldButton, BackButton, UserInfo, LinkButton } from "@/components/ui-components"
import { useMiniKit } from "@/hooks/use-minikit"
import { useContractData } from "@/hooks/use-contract-data"

import { useContractDataAirdrop } from "@/hooks/use-contract-data-airdrop"

import NEX_GOLD_STAKING_ABI from "@/abi/NEX_GOLD_STAKING_ABI.json"

import AIRDROP_ABI from "@/abi/AIRDROP_ABI.json"
import { getUnoDeeplinkUrl } from '../../lib/linkUNO';

const NEX_GOLD_STAKING_ADDRESS = "0xd025b92f1b56ada612bfdb0c6a40dfe27a0b4183"

const NEX_GOLD_ADDRESS = "0xA3502E3348B549ba45Af8726Ee316b490f308dDC"
const AIRDROP_ADDRESS = "0x237057b5f3d1d2b3622df39875948e4857e52ac8"

interface Transaction {
    hash: string;
    value: string;
    to: string;
    from: string;
    timeStamp: string;
}


const AnimatedMiningRewards: FC<{ lastUpdateTime: number; stakedBalance: number }> = ({ lastUpdateTime, stakedBalance }) => {
  const [displayReward, setDisplayReward] = useState(0);
  useEffect(() => {
    if (!lastUpdateTime || lastUpdateTime === 0 || stakedBalance <= 0) {
      setDisplayReward(0);
      return;
    }
    const MINING_REWARD_RATE = 10;
    const MINING_INTERVAL_SECONDS = 24 * 60 * 60;
    const interval = setInterval(() => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const timeElapsed = nowSeconds - lastUpdateTime;
      if (timeElapsed < 0) { setDisplayReward(0); return; }
      const progressInCycle = (timeElapsed % MINING_INTERVAL_SECONDS) / MINING_INTERVAL_SECONDS;
      const animatedReward = progressInCycle * MINING_REWARD_RATE;
      setDisplayReward(animatedReward);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdateTime, stakedBalance]);
  return <p className="text-xl font-bold text-green-400">+{displayReward.toFixed(4)} NXG</p>;
};



export default function HomePage() {
  const { status } = useSession()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<"dashboard" | "staking" | "referral" | "history">("dashboard")
  const { contractData } = useContractData()
  const { canClaimAirdrop, isLoadingAirdrop, fetchAirdropData } = useContractDataAirdrop()
  const { sendTransaction, status: txStatus} = useMiniKit()
  const [showAirdropLink, setShowAirdropLink] = useState(false);

  const handleClaimAirdrop = async () => {
    try {
      await sendTransaction({
        transaction: [{
          address: AIRDROP_ADDRESS,
          abi: AIRDROP_ABI as any,
          functionName: "claimTokens",
          args: [],
        }],
      })

      fetchAirdropData()
      setShowAirdropLink(true);

    } catch (error) {
      console.error("Error al enviar recompensa:", error)
    }

  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  const goBack = () => setActiveSection("dashboard")

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-yellow-400 bg-gray-900">Cargando...</div>
  }

  if (status === "authenticated") {
    return (
      <div
        className="min-h-screen flex flex-col justify-between p-4 font-sans"
        style={{
          backgroundImage: "url('/background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
          <>
            {/* Card de UserInfo arriba */}
            <div className="w-full max-w-md mx-auto">
              <div className="bg-black/30 backdrop-blur-lg border border-yellow-500/20 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6 space-y-4">
                <UserInfo />
                {/* Nuevo div para el balance */}
                <div className="text-center">
                  {contractData.isLoading ? (
                    <div className="text-yellow-400 p-2"><Loader className="animate-spin inline-block mr-2" /> Cargando...</div>
                  ) : (
                    <>
                      <p className="text-xl font-bold text-yellow-400">💳 {Number.parseFloat(contractData.availableBalance).toFixed(4)} NXG</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Card de botones abajo */}
            <div className="w-full max-w-md mx-auto">
              <div className="bg-black/30 backdrop-blur-lg border border-yellow-500/20 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6 space-y-4">
                {/* Botón para el Airdrop */}
                {isLoadingAirdrop ? (
                  <div className="text-center text-yellow-400">
                    <Loader className="animate-spin inline-block mr-2" /> Cargando airdrop...
                  </div>
                ) : (
                  canClaimAirdrop && (
                    <GoldButton className="w-full" onClick={handleClaimAirdrop} disabled={txStatus === "pending"}>
                      🎁 Reclamar Airdrop DWD
                    </GoldButton>
                  )
                )}
                {/* Renderiza el botón de enlace SOLO si `showAirdropLink` es verdadero */}
                {showAirdropLink && (
                  <LinkButton href="https://world.org/mini-app?app_id=app_9364e8ee9845fe89fc2f35bdca45e944">Abrir Destinity</LinkButton>
                )}
              </div>
            </div>
          </>

      </div>
    );
}

return null

}
