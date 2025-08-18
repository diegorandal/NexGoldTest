"use client"

import { useState, useEffect, type FC, useCallback } from "react"
import { parseEther, getAddress, formatEther } from "viem"
import { useSession } from "next-auth/react"
import { Info, Loader, CheckCircle, XCircle, History, Gift } from 'lucide-react'
import { useRouter } from "next/navigation"
import { createPublicClient, http } from 'viem'
import { worldchain } from 'viem/chains'
import NEX_GOLD_STAKING_ABI from "@/abi/NEX_GOLD_STAKING_ABI.json"
import NEX_GOLD_REFERRAL_ABI from "@/abi/NEX_GOLD_REFERRAL_ABI.json"
import NEX_GOLD_DROP_ABI from "@/abi/NexGoldDropABI.json"
import { Card, InputGold, GoldButton, BackButton, UserInfo } from "@/components/ui-components"
import { useMiniKit } from "@/hooks/use-minikit"
import { useContractData } from "@/hooks/use-contract-data"
import { useContractDataRef } from "@/hooks/use-contract-data-ref"
import { useTokenPairPrice } from "@/hooks/use-token-pair-price"
import { MiniKit } from "@worldcoin/minikit-js"

const NEX_GOLD_STAKING_ADDRESS = "0xd025b92f1b56ada612bfdb0c6a40dfe27a0b4183"
const NEX_GOLD_REFERRAL_ADDRESS = "0x23f3f8c7f97c681f822c80cad2063411573cf8d3"
const NEX_GOLD_DROP_ADDRESS = "0x237057b5f3d1d2b3622df39875948e4857e52ac8"
const NEX_GOLD_ADDRESS = "0xA3502E3348B549ba45Af8726Ee316b490f308dDC"

const publicClient = createPublicClient({
  chain: worldchain,
  transport: http(),
});

interface Transaction {
    hash: string;
    value: string;
    to: string;
    from: string;
    timeStamp: string;
}

const useWalletData = () => {
    const { data: session } = useSession();
    const walletAddress = session?.user?.walletAddress as `0x${string}` | undefined;
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWalletData = useCallback(async () => {
        if (!walletAddress) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/history?address=${walletAddress}`);
            
            if (!response.ok) {
                throw new Error('La respuesta de la red no fue válida.');
            }
            const data = await response.json();
            if (data.status === '1') {
                setTransactions(data.result);
            } else if (data.message === 'No transactions found') {
                setTransactions([]);
            } else {
                throw new Error(data.message || 'Error al obtener las transacciones');
            }
        } catch (e: any) {
            setError(e.message || 'No se pudieron cargar los datos.');
        } finally {
            setIsLoading(false);
        }
    }, [walletAddress]);

    useEffect(() => {
        fetchWalletData();
    }, [fetchWalletData]);

    return { transactions, isLoading, error, fetchWalletData };
};

const useAirdropData = () => {
  const { data: session } = useSession();
  const walletAddress = session?.user?.walletAddress as `0x${string}` | undefined;

  const [canClaim, setCanClaim] = useState(false);
  const [claimAmount, setClaimAmount] = useState('0');
  const [isLoading, setIsLoading] = useState(true);

  const checkClaimStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const [amount, hasAlreadyClaimed] = await publicClient.multicall({
        contracts: [
          {
            address: NEX_GOLD_DROP_ADDRESS,
            abi: NEX_GOLD_DROP_ABI,
            functionName: 'welcomeAmount',
          },
          {
            address: NEX_GOLD_DROP_ADDRESS,
            abi: NEX_GOLD_DROP_ABI,
            functionName: 'hasClaimed',
            args: [walletAddress || '0x0'],
          },
        ],
      });

      if (amount.status === 'success') {
        setClaimAmount(formatEther(amount.result as bigint));
      }
      if (hasAlreadyClaimed.status === 'success' && walletAddress) {
        setCanClaim(!hasAlreadyClaimed.result);
      } else {
        setCanClaim(false);
      }
    } catch (e) {
      console.error("Error al verificar el estado del airdrop:", e);
      setCanClaim(false);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    checkClaimStatus();
  }, [checkClaimStatus]);

  return { canClaim, claimAmount, isLoading, refetch: checkClaimStatus };
};

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

const HistorySection: FC<{ onBack: () => void }> = ({ onBack }) => {
  const { transactions, isLoading, error } = useWalletData();
  const { data: session } = useSession();
  const walletAddress = session?.user?.walletAddress as `0x${string}` | undefined;

  const TransactionItem: FC<{ tx: Transaction }> = ({ tx }) => {
    if (!walletAddress) return null;
    const isIncoming = getAddress(tx.to) === getAddress(walletAddress);
    const amount = parseFloat(formatEther(BigInt(tx.value))).toFixed(4);
    const date = new Date(parseInt(tx.timeStamp) * 1000).toLocaleString();
    let type = isIncoming ? 'Recibido' : 'Enviado';
    if (getAddress(tx.from) === NEX_GOLD_STAKING_ADDRESS) {
        type = isIncoming ? 'Recompensa / Unstake' : 'Stake';
    }
    return (
      <div className="bg-black/20 backdrop-blur-sm p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex-1">
            <p className={`font-bold break-all ${isIncoming ? 'text-green-400' : 'text-red-400'}`}>{isIncoming ? '+' : '-'} {amount} NXG</p>
            <p className="text-sm text-gray-400 break-all">{isIncoming ? `De: ${tx.from.slice(0,6)}...${tx.from.slice(-4)}` : `A: ${tx.to.slice(0,6)}...${tx.to.slice(-4)}`}</p>
        </div>
        <div className="mt-2 md:mt-0 md:ml-4 text-right">
            <p className="text-xs text-gray-500">{date}</p>
            <a href={`https://worldscan.org/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="text-yellow-400 text-sm hover:underline">
                Ver Transacción
            </a>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
        <Card className="space-y-4">
            <h2 className="text-xl font-bold text-yellow-400 text-center">Historial de Transacciones</h2>
            {isLoading ? (
                <div className="text-center text-yellow-400 p-4"><Loader className="animate-spin inline-block mr-2" /> Cargando...</div>
            ) : error ? (
                <div className="text-center text-red-400 p-4"><XCircle className="inline-block mr-2" /> {error}</div>
            ) : transactions.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">{transactions.map((tx) => (<TransactionItem key={tx.hash} tx={tx} />))}</div>
            ) : (
                <div className="text-center text-gray-400 p-4"><p>No se encontraron transacciones.</p></div>
            )}
            <BackButton onClick={onBack} />
        </Card>
    </div>
  );
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

  const handleSendReward = async () => {
    const addressToSend = referral || rewardAddress;
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
          args: [addressToSend],
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
                    {contractDataRef.canReward && !referral && (
                        <div className="flex flex-col space-y-4">
                            <label className="text-gray-300 text-sm">Dirección a recompensar:</label>
                            <input type="text" value={rewardAddress} onChange={(e) => setRewardAddress(e.target.value)} placeholder="0x..." className="p-2 rounded-lg bg-gray-800 text-white border border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-500" />
                        </div>
                    )}
                    <div className="flex flex-col space-y-4">
                        {contractDataRef.canReward && (<GoldButton onClick={handleSendReward} className="w-full" disabled={isProcessing || (!referral && !rewardAddress)}>Enviar recompensa</GoldButton>)}
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
        <Card className="mt-8 space-y-4 animate-fade-in">
            <div className="text-center"><h2 className="text-2xl font-bold text-yellow-400">TOP 3 Referidos</h2></div>
            {contractDataRef.isLoading ? (
                <div className="text-center text-yellow-400"><Loader className="animate-spin inline-block" /> Cargando datos...</div>
            ) : (
                <div className="space-y-2">
                    {contractDataRef.top3Addresses.map((address: string, index: number) => (
                        <div key={index} className="flex justify-between items-center text-white p-2 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
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
    const value = Number.parseFloat(amount);
    if (isNaN(value) || value <= 0) return;
    const storedProof = sessionStorage.getItem("worldIdProof");
    if (!storedProof || storedProof === "undefined" || storedProof === "null") {
      console.error("No hay datos de verificación válidos");
      return;
    }
    let verificationProof;
    try {
      verificationProof = JSON.parse(storedProof);
    } catch (error) {
      console.error("Error al parsear datos de verificación:", error);
      return;
    }
    if (!verificationProof || !verificationProof.merkle_root || !verificationProof.nullifier_hash || !verificationProof.proof) {
      console.error("Datos de verificación incompletos");
      return;
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
              <div><p className="text-sm text-gray-300">Recompensas Staking (APY/{contractData.stakingAPY / 100}%)</p><p className="text-xl font-bold text-yellow-400">+{Number.parseFloat(contractData.stakingRewards).toFixed(4)} NXG</p></div>
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
  const [activeSection, setActiveSection] = useState<"dashboard" | "staking" | "referral" | "history">("dashboard")
  const { price, isLoading: isPriceLoading } = useTokenPairPrice();
  const { canClaim, claimAmount, isLoading: isAirdropLoading, refetch: refetchAirdropStatus } = useAirdropData();
  const { sendTransaction, status: txStatus } = useMiniKit();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])
  
  useEffect(() => {
    if (txStatus === 'success') {
        refetchAirdropStatus();
    }
  }, [txStatus, refetchAirdropStatus]);

  const goBack = () => setActiveSection("dashboard")
  
  const handleClaimAirdrop = async () => {
    await sendTransaction({
      transaction: [{
        address: NEX_GOLD_DROP_ADDRESS,
        abi: NEX_GOLD_DROP_ABI,
        functionName: 'claimTokens',
        args: [],
      }],
    });
  };

  const formatPrice = (value: number | null) => {
    if (value === null) return 'N/A';
    return `${value.toFixed(6)} WLD`;
  };

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
        {activeSection === "dashboard" ? (
          <>
            <div className="w-full max-w-md mx-auto">
              <div className="bg-black/30 backdrop-blur-lg border border-yellow-500/20 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6">
                <div className="flex justify-between items-center">
                  <UserInfo />
                  <div className="text-right">
                    <p className="text-sm text-gray-300">NXG/WLD</p>
                    {isPriceLoading ? <Loader className="animate-spin text-yellow-400 h-5 w-5 ml-auto" /> : <p className="font-bold text-yellow-400 text-lg">{formatPrice(price)}</p>}
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full max-w-md mx-auto">
              <div className="bg-black/30 backdrop-blur-lg border border-yellow-500/20 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6 space-y-4">
                <GoldButton className="w-full" onClick={() => setActiveSection("staking")}>
                  📈 Staking & Mining
                </GoldButton>
                <GoldButton className="w-full" onClick={() => setActiveSection("history")}>
                  <History className="inline-block mr-2" size={20} />
                  Historial
                </GoldButton>
                <GoldButton className="w-full" onClick={() => setActiveSection("referral")}>
                  👥 Referidos
                </GoldButton>
                <GoldButton 
                  onClick={handleClaimAirdrop}
                  disabled={!canClaim || isAirdropLoading || txStatus === 'pending'}
                >
                  {isAirdropLoading ? (
                    <Loader className="animate-spin inline-block mr-2" size={20} />
                  ) : (
                    <Gift className="inline-block mr-2" size={20} />
                  )}
                  {canClaim ? `Reclamar ${claimAmount} DWD (Airdrop)` : 'Airdrop ya reclamado'}
                </Go-ldButton>
              </div>
            </div>
          </>
        ) : activeSection === "staking" ? (
          <StakingAndMiningSection onBack={goBack} />
        ) : activeSection === "history" ? (
          <HistorySection onBack={goBack} />
        ) : (
          <ReferralSection onBack={goBack} />
        )}
      </div>
    );
  }

  return null
}
