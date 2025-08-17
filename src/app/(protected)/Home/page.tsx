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
import { MiniKit } from "@worldcoin/minikit-js"

const NEX_GOLD_STAKING_ADDRESS = "0xd025b92f1b56ada612bfdb0c6a40dfe27a0b4183"
const NEX_GOLD_REFERRAL_ADDRESS = "0x23f3f8c7f97c681f822c80cad2063411573cf8d3"
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
      if (timeElapsed < 0) { setDisplayReward(0); return; }
      const progressInCycle = (timeElapsed % MINING_INTERVAL_SECONDS) / MINING_INTERVAL_SECONDS;
      const animatedReward = progressInCycle * MINING_REWARD_RATE;
      setDisplayReward(animatedReward);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdateTime, stakedBalance]);

  return <p className="text-xl font-bold text-green-400">+{displayReward.toFixed(4)} NXG</p>;
};

const ReferralSection: FC<{ onBack: () => void }> = ({ onBack }) => {
  const { contractDataRef, fetchContractDataRef } = useContractDataRef()
  const [referral, setReferral] = useState<string | null>(null)
  const [referral_name, setReferralName] = useState<string | null>(null)
  const [rewardAddress, setRewardAddress] = useState('');
  const { data: session } = useSession()
  const { sendTransaction, status, error } = useMiniKit()
  const isProcessing = status === "pending"

  useEffect(() => {
    const storedReferral = localStorage.getItem('referrer');
    if (storedReferral) {
      setReferral(storedReferral);
      const fetchUser = async () => {
        const user = await MiniKit.getUserByAddress(storedReferral);
        setReferralName(user?.username || null);
      };
      fetchUser();
    }
  }, []);
  
  useEffect(() => {
    if (status === "success") { fetchContractDataRef() }
  }, [status, fetchContractDataRef])

  //manejo del boton copiar link de referido
  const handleCopyReferralLink = async () => {
    if (!session?.user?.walletAddress) return
    const ref = session.user.walletAddress
    const enlace = `https://world.org/mini-app?app_id=app_48bf75430fa1e83c8063dc451b9decde&path=/invite?ref=${ref}`
    try {
      await navigator.clipboard.writeText(enlace)
    } catch (error) {
      console.error("Error al copiar el enlace de referido:", error)
    }
  }

// manejo del boton enviar recompensa
  const handleSendReward = async () => {
    const addressToSend = referral || rewardAddress; // <-- Lógica unificada: usa referral si existe, si no usa rewardAddress
    if (!addressToSend) {
      console.error("No hay una dirección para recompensar.");
      return;
    }
    try {
      await sendTransaction({
        transaction: [{
          address: NEX_GOLD_REFERRAL_ADDRESS,
          abi: NEX_GOLD_REFERRAL_ABI as any,
          functionName: "rewardUser",
          args: [addressToSend], // <-- Usa la dirección unificada
        }],
      });
    } catch (error) {
      console.error("Error al enviar recompensa:", error)
    }
  }

return (
    <div className="animate-fade-in">
        <Card className="space-y-4">
            {contractDataRef.isLoading ? (
                <div className="text-center text-yellow-400"><Loader className="animate-spin inline-block" /> Cargando datos...</div>
            ) : (
                <>
                    <div className="text-center mb-4"><p className="text-sm text-gray-300">Mis Referidos</p><p className="text-3xl font-bold text-yellow-400">{contractDataRef.rewardCount}</p></div>
                    <div className="text-center mb-4"><p className="text-sm text-gray-300">Recompensa por referido</p><p className="text-3xl font-bold text-yellow-400">{contractDataRef.rewardAmount} NXG</p></div>
                    <div className="text-center mb-4"><p className="text-sm text-gray-300">Referido por:</p><p className="text-xl font-bold text-white">{referral_name ? referral_name : "Nadie"}</p></div>

                    {/* Lógica para mostrar la caja de entrada si no hay un referido */}
                    {contractDataRef.canReward && !referral && ( // <-- Usa 'referral' para determinar si mostrar el input
                        <div className="flex flex-col space-y-4">
                            <label className="text-gray-300 text-sm">Dirección a recompensar:</label>
                            <input
                                type="text"
                                value={rewardAddress}
                                onChange={(e) => setRewardAddress(e.target.value)} // <-- Actualiza 'rewardAddress'
                                placeholder="0x..."
                                className="p-2 rounded-lg bg-gray-800 text-white border border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                            />
                        </div>
                    )}
                    
                    <div className="flex flex-col space-y-4">
                        {contractDataRef.canReward && (
                            <GoldButton 
                                onClick={handleSendReward} 
                                className="w-full" 
                                disabled={isProcessing || (!referral && !rewardAddress)}
                            >
                                Enviar recompensa
                            </GoldButton>
                        )}
                        <GoldButton onClick={handleCopyReferralLink}>Copiar mi enlace</GoldButton>
                    </div>
                </>
            )}
            <div className="h-10 text-center text-sm flex items-center justify-center">
                {status === "pending" && <p className="text-yellow-400 flex items-center gap-2"><Loader className="animate-spin" />Procesando...</p>}
                {status === "success" && <p className="text-green-400 flex items-center gap-2"><CheckCircle />¡Éxito!</p>}
                {status === "error" && <p className="text-red-400 flex items-center gap-2"><XCircle />Error: {error}</p>}
            </div>
            <BackButton onClick={onBack} />
        </Card>

        {/* Nueva Card para el TOP 3 */}
        <Card className="mt-8 space-y-4 animate-fade-in">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-yellow-400">TOP 3 Referidos</h2>
            </div>
            {contractDataRef.isLoading ? (
                <div className="text-center text-yellow-400"><Loader className="animate-spin inline-block" /> Cargando datos...</div>
            ) : (
                <div className="space-y-2">
                    {contractDataRef.top3Addresses.map((address, index) => (
                        <div
                            key={index}
                            className="flex justify-between items-center text-white p-2 rounded-lg"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                        >
                            <p className="font-bold text-lg">{index + 1}.</p>
                            <p className="flex-1 text-sm md:text-md lg:text-lg ml-4 truncate">{address}</p>
                            <p className="font-bold text-yellow-400">{contractDataRef.top3Counts[index]}</p>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    </div>
);


};

const StakingAndMiningSection: FC<{ onBack: () => void }> = ({ onBack }) => {
  const [amount, setAmount] = useState("")
  const { sendTransaction, status, error } = useMiniKit()
  const { contractData, fetchContractData, isLocked } = useContractData()
  const session = useSession();
  const isProcessing = status === "pending"
  useEffect(() => { if (status === "success") { fetchContractData() } }, [status, fetchContractData])

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
    if (!verificationProof || !verificationProof.merkle_root || !verificationProof.nullifier_hash || !verificationProof.proof) {
      console.error("Datos de verificación incompletos")
      return
    }
    const nonce = Date.now();
    const now = Math.floor(Date.now() / 1000);
    const deadline = now + 180;
    const stakeAmount = (value * 1e18).toString();
    const walletAddress = session?.data?.user?.walletAddress;
    await sendTransaction({
      transaction: [{
        address: NEX_GOLD_STAKING_ADDRESS,
        abi: NEX_GOLD_STAKING_ABI,
        functionName: "stake",
        args: [stakeAmount, [[NEX_GOLD_ADDRESS, stakeAmount], nonce, deadline], [NEX_GOLD_STAKING_ADDRESS, stakeAmount], walletAddress, 'PERMIT2_SIGNATURE_PLACEHOLDER_0'],
      }], 
      permit2: [{
        permitted: { token: NEX_GOLD_ADDRESS, amount: stakeAmount },
        nonce: nonce.toString(),
        deadline: deadline.toString(),
        spender: NEX_GOLD_STAKING_ADDRESS,
      }],
    })
  }
  const handleUnstake = async () => {
    const value = Number.parseFloat(amount);
    if (isNaN(value) || value <= 0) return;
    const unstakeAmountInWei = parseEther(amount);
    await sendTransaction({
      transaction: [{
        address: NEX_GOLD_STAKING_ADDRESS,
        abi: NEX_GOLD_STAKING_ABI as any,
        functionName: "unstake",
        args: [unstakeAmountInWei.toString()],
      }],
    });
  };
  const handleClaim = async () => {
    await sendTransaction({
      transaction: [{
        address: NEX_GOLD_STAKING_ADDRESS,
        abi: NEX_GOLD_STAKING_ABI as any,
        functionName: "claimAllRewards",
        args: [],
      }],
    })
  }

  return (
    <div className="animate-fade-in">
      <Card className="space-y-4">
        {contractData.isLoading ? (
          <div className="text-center text-yellow-400"><Loader className="animate-spin inline-block" /> Cargando datos...</div>
        ) : (
          <>
            <div className="text-center mb-4"><p className="text-sm text-gray-300">Balance Disponible</p><p className="text-xl font-bold text-yellow-400">{Number.parseFloat(contractData.availableBalance).toFixed(4)} NXG</p></div>
            <div className="text-center"><p className="text-lg text-gray-300">Balance en Staking</p><p className="text-3xl font-bold text-white">{Number.parseFloat(contractData.stakedBalance).toFixed(4)} NXG</p></div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div><p className="text-sm text-gray-300">Recompensas Mining</p><AnimatedMiningRewards lastUpdateTime={contractData.lastMiningRewardUpdateTime} stakedBalance={Number.parseFloat(contractData.stakedBalance)} /></div>
              <div><p className="text-sm text-gray-300">Recompensas Staking (APY/{contractData.stakingAPY.toString()}%)</p><p className="text-xl font-bold text-yellow-400">+{Number.parseFloat(contractData.stakingRewards).toFixed(4)} NXG</p></div>
            </div>
            {contractData.lockinEndDate && Number.parseFloat(contractData.stakedBalance) > 0 && <div className={`text-center p-2 rounded-md text-sm ${isLocked ? "bg-red-900/50 text-red-300" : "bg-green-900/50 text-green-300"}`}><Info className="inline-block mr-2 h-4 w-4" />{isLocked ? `Bloqueado hasta: ${contractData.lockinEndDate.toLocaleString()}` : "Fondos desbloqueados."}</div>}
            <InputGold type="number" placeholder="Cantidad de NXG" value={amount} onChange={(e: any) => setAmount(e.target.value)} />
            <div className="grid grid-cols-2 gap-4"><GoldButton onClick={handleStake} disabled={isProcessing}>Stake</GoldButton><GoldButton onClick={handleUnstake} disabled={isProcessing || Number.parseFloat(contractData.availableBalance) <= 0}>Unstake</GoldButton></div>
            <GoldButton onClick={handleClaim} className="w-full" disabled={isProcessing || Number.parseFloat(contractData.stakedBalance) <= 0}>Reclamar Recompensas</GoldButton>
          </>
        )}
        <div className="h-10 text-center text-sm flex items-center justify-center">
          {status === "pending" && <p className="text-yellow-400 flex items-center gap-2"><Loader className="animate-spin" />Procesando...</p>}
          {status === "success" && <p className="text-green-400 flex items-center gap-2"><CheckCircle />¡Éxito!</p>}
          {status === "error" && <p className="text-red-400 flex items-center gap-2"><XCircle />Error: {error}</p>}
        </div>
        <BackButton onClick={onBack} />
      </Card>
    </div>
  )
}

export default function HomePage() {
  const { status } = useSession()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<"dashboard" | "staking" | "referral">("dashboard")

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
        className="min-h-screen flex items-start justify-center p-4 pt-8 font-sans"
        style={{
          backgroundImage: "url('/background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div 
          className="w-full max-w-md mx-auto flex flex-col pb-20"
          style={{minHeight: 'calc(100vh - 4rem)'}} 
        >
          {activeSection === "dashboard" ? (
            <>
              <div className="bg-black/30 backdrop-blur-lg border border-yellow-500/20 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6">
                <div className="mb-6">
                  <UserInfo />
                </div>
                <GoldButton className="w-full" onClick={() => setActiveSection("staking")}>
                  📈 Staking & Mining
                </GoldButton>
              </div>
              <div className="mt-auto pt-4 flex justify-center">
                <button onClick={() => setActiveSection("referral")} className="flex items-center justify-center text-yellow-400 font-medium transition-transform duration-200 hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Referidos
                </button>
              </div>
            </>
          ) : activeSection === "staking" ? (
            <StakingAndMiningSection onBack={goBack} />
          ) : (
            <ReferralSection onBack={goBack} />
          )}
        </div>
      </div>
    )
  }

  return null
}
