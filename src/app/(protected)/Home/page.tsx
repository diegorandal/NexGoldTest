"use client"

import { useState, useEffect, type FC } from "react"
import { parseEther } from "viem"
import { useSession } from "next-auth/react"
import { Info, Loader, CheckCircle, XCircle } from 'lucide-react'
import { useRouter } from "next/navigation"
import NEX_GOLD_STAKING_ABI from "@/abi/NEX_GOLD_STAKING_ABI.json"
import NEX_GOLD_REFERRAL_ABI from "@/abi/NEX_GOLD_REFERRAL_ABI.json"
import { Card, InputGold, GoldButton, BackButton, UserInfo } from "@/components/ui-components"
import { useMiniKit } from "@/hooks/use-minikit"
import { useContractData } from "@/hooks/use-contract-data"
import { useContractDataRef } from "@/hooks/use-contract-data-ref"


const NEX_GOLD_STAKING_ADDRESS = "0x13861894fc9fb57a911fff500c6f460e69cb9ef1"
const NEX_GOLD_REFERRAL_ADDRESS = "0xa5957cf7f7eacaa3a695df6ffc8cf5e4989aa879"
const NEX_GOLD_ADDRESS = "0xA3502E3348B549ba45Af8726Ee316b490f308dDC"


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

      if (timeElapsed < 0) {
        setDisplayReward(0);
        return;
      }

      const progressInCycle = (timeElapsed % MINING_INTERVAL_SECONDS) / MINING_INTERVAL_SECONDS;
      const animatedReward = progressInCycle * MINING_REWARD_RATE;

      setDisplayReward(animatedReward);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdateTime, stakedBalance]);

  return (
    <p className="text-xl font-bold text-green-400">
      +{displayReward.toFixed(4)} NXG
    </p>
  );
};


const ReferralSection: FC<{ onBack: () => void }> = ({ onBack }) => {
  
  const { status, error } = useMiniKit()
  const { contractDataRef, fetchContractDataRef } = useContractDataRef()
  const [referral, setReferral] = useState<string | null>(null)
  const isProcessing = status === "pending"

  useEffect(() => {
    setReferral(localStorage.getItem('referrer'))
  }, [])
  
  //  rewardReferrer

  useEffect(() => {
    if (status === "success") {
      fetchContractDataRef()
    }
  }, [status, fetchContractDataRef])

  const handleCopyReferralLink = async () => {
    if (!referral) return

    const enlace = `https://nexgold.com/referral/${referral}` //ejemplo papa

    try {
      await navigator.clipboard.writeText(enlace)
      console.log("Enlace de referido copiado al portapapeles:", enlace)
    } catch (error) {
      console.error("Error al copiar el enlace de referido:", error)
    }
  }
  
  const handleSendReward = async () => {
      if (!referral) return

      console.log("Enviando recompensa a:", referral)
      /*
      try {
        await sendTransaction({
          to: NEX_GOLD_REFERRAL_ADDRESS,
          data: {
            type: "sendReward",
            payload: { referral }
          }
        })
      } catch (error) {
        console.error("Error al enviar recompensa:", error)
      }
    */
  }

  return (
    <div className="animate-fade-in">
      <Card className="space-y-4">
        {contractDataRef.isLoading ? (
          <div className="text-center text-yellow-400">
            <Loader className="animate-spin inline-block" /> Cargando datos...
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <p className="text-sm text-gray-300">Mis Referidos</p>
              <p className="text-3xl font-bold text-yellow-400">
                {contractDataRef.rewardCount}
              </p>
            </div>
            
            <div className="text-center mb-4">
              <p className="text-sm text-gray-300">Referido por:</p>
              <p className="text-xl font-bold text-white">
                {referral ? referral : "Nadie"}
              </p>
            </div>

            <div className="flex flex-col space-y-4">
              <GoldButton onClick={handleCopyReferralLink}>
                Copiar mi enlace
              </GoldButton>
              <GoldButton
                onClick={handleSendReward}
                className="w-full"
                disabled={isProcessing}
              >
                Enviar recompensa
              </GoldButton>
            </div>
          </>
        )}

        {/* Sección de estado de la transacción */}
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

        <BackButton onClick={onBack} />
      </Card>
    </div>
  );
};

const StakingAndMiningSection: FC<{
  onBack: () => void
}> = ({ onBack }) => {
  const [amount, setAmount] = useState("")
  const { sendTransaction, status, error } = useMiniKit()
  const { contractData, fetchContractData, isLocked } = useContractData()

  const session = useSession();

  const isProcessing = status === "pending"

    useEffect(() => {
    if (status === "success") {
      fetchContractData()
    }
  }, [status, fetchContractData])

  useEffect(() => {
    if (status === "success") {
      fetchContractData()
    }
  }, [status, fetchContractData])

  const handleStake = async () => {
    const value = Number.parseFloat(amount)
    if (isNaN(value) || value <= 0) return

    const storedProof = sessionStorage.getItem("worldIdProof")
    if (!storedProof || storedProof === "undefined" || storedProof === "null") {
      console.error("No hay datos de verificación válidos")
      return
    }

    let verificationProof
    try {
      verificationProof = JSON.parse(storedProof)
    } catch (error) {
      console.error("Error al parsear datos de verificación:", error)
      return
    }

    if (
      !verificationProof ||
      !verificationProof.merkle_root ||
      !verificationProof.nullifier_hash ||
      !verificationProof.proof
    ) {
      console.error("Datos de verificación incompletos")
      return
    }
    
    const nonce = Date.now();
    const now = Math.floor(Date.now() / 1000);
    const deadline = now + 180;
    const stakeAmount = (value * 1e18).toString();
    const walletAddress = session?.data?.user?.walletAddress;

    await sendTransaction({
      transaction: [
        {
          address: NEX_GOLD_STAKING_ADDRESS,
          abi: NEX_GOLD_STAKING_ABI,
          functionName: "stake",
          args: [
            stakeAmount,
            [[NEX_GOLD_ADDRESS, stakeAmount], nonce, deadline],
            [NEX_GOLD_STAKING_ADDRESS, stakeAmount],
            walletAddress,
            'PERMIT2_SIGNATURE_PLACEHOLDER_0',
          ],
        },
      ], 
      permit2: [
        {
          permitted: { token: NEX_GOLD_ADDRESS, amount: stakeAmount },
          nonce: nonce.toString(),
          deadline: deadline.toString(),
          spender: NEX_GOLD_STAKING_ADDRESS,
        },
      ],
    })
  }

  const handleUnstake = async () => {
  const value = Number.parseFloat(amount);
  if (isNaN(value) || value <= 0) return;

  const unstakeAmountInWei = parseEther(amount);

  await sendTransaction({
    transaction: [
      {
        address: NEX_GOLD_STAKING_ADDRESS,
        abi: NEX_GOLD_STAKING_ABI as any,
        functionName: "unstake",
        args: [unstakeAmountInWei.toString()],
      },
    ],
  });
};

  const handleClaim = async () => {
    await sendTransaction({
      transaction: [
        {
          address: NEX_GOLD_STAKING_ADDRESS,
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
                <p className="text-sm text-gray-300">Recompensas Mining</p>
                <AnimatedMiningRewards
                  lastUpdateTime={contractData.lastMiningRewardUpdateTime}
                  stakedBalance={Number.parseFloat(contractData.stakedBalance)}
                />
              </div>
              <div>
                <p className="text-sm text-gray-300">Recompensas Staking (APY/12%)</p>
                <p className="text-xl font-bold text-yellow-400">
                  +{Number.parseFloat(contractData.stakingRewards).toFixed(4)} NXG
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
        <BackButton onClick={onBack} />
      </Card>
    </div>
  )
}

function MainAppContent() {
  const [activeSection, setActiveSection] = useState<"dashboard" | "staking" | "referral">("dashboard")

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
      case "referral":
        return <ReferralSection onBack={goBack} />
      default:
        return (
          <>
            <GoldButton onClick={() => setActiveSection("staking")}>📈 Acceder a Staking & Mining</GoldButton>
            <GoldButton onClick={() => setActiveSection("referral")}>👥 Acceder a Referidos</GoldButton>
          </>
        )
    }
  }

  return (
    <div className="w-full">
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
        className="min-h-screen flex items-start justify-center p-4 pt-8 font-sans"
        style={{
          backgroundImage: "url('/background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="w-full max-w-md mx-auto bg-black/30 backdrop-blur-lg border border-yellow-500/20 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6">
          <div className="mb-6">
            <UserInfo />
          </div>
          <MainAppContent />
        </div>
      </div>
    )
  }

  return null
    }
