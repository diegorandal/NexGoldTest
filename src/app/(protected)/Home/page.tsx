"use client"

import { useState, useEffect, useCallback, type FC } from "react"
import { parseEther, getAddress, formatEther } from "viem"
import { useSession } from "next-auth/react"
import { Info, Loader, CheckCircle, XCircle, ArrowDownLeft, ArrowUpRight, RefreshCw, Layers, X, History } from 'lucide-react'
import { useRouter } from "next/navigation"
import { createPublicClient, http } from 'viem'
import { worldchain } from 'viem/chains'
import NEX_GOLD_STAKING_ABI from "@/abi/NEX_GOLD_STAKING_ABI.json"
import NEX_GOLD_REFERRAL_ABI from "@/abi/NEX_GOLD_REFERRAL_ABI.json"
import { Card, InputGold, GoldButton, BackButton, UserInfo } from "@/components/ui-components"
import { useMiniKit } from "@/hooks/use-minikit"
import { useContractData } from "@/hooks/use-contract-data"
import { useContractDataRef } from "@/hooks/use-contract-data-ref"
import { MiniKit } from "@worldcoin/minikit-js"

const NEX_GOLD_STAKING_ADDRESS = "0x13861894fc9fb57a911fff500c6f460e69cb9ef1"
const NEX_GOLD_REFERRAL_ADDRESS = "0xa5957cf7f7eacaa3a695df6ffc8cf5e4989aa879"
const NEX_GOLD_ADDRESS = "0xA3502E3348B549ba45Af8726Ee316b490f308dDC"
const WORLDSCAN_API_URL = 'https://www.worldscan.io/api';
const ERC20_ABI = [{ "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "type": "function" }] as const;

const publicClient = createPublicClient({
  chain: worldchain,
  transport: http(),
});

const useWalletData = () => {
  const { data: session } = useSession();
  const walletAddress = session?.user?.walletAddress as `0x${string}` | undefined;
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletData = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${WORLDSCAN_API_URL}?module=account&action=tokentx&contractaddress=${NEX_GOLD_ADDRESS}&address=${walletAddress}&sort=desc`);
      if (!response.ok) throw new Error('La respuesta de la red no fue válida');
      const data = await response.json();
      if (data.status === "1") setTransactions(data.result);
      else if (data.message === "No transactions found") setTransactions([]);
      else throw new Error(data.message || 'Error al obtener las transacciones');
    } catch (e: any) {
      setError(e.message || "No se pudieron cargar los datos.");
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  return { transactions, isLoading, error, fetchWalletData };
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

const ReferralSection: FC<{ onBack: () => void }> = ({ onBack }) => {
  const { contractDataRef, fetchContractDataRef } = useContractDataRef();
  const [referral, setReferral] = useState<string | null>(null);
  const [referral_name, setReferralName] = useState<string | null>(null);
  const { data: session } = useSession();
  const { sendTransaction, status, error } = useMiniKit();
  const isProcessing = status === "pending";

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
  }, [status, fetchContractDataRef]);

  const handleCopyReferralLink = async () => {
    if (!session?.user?.walletAddress) return;
    const ref = session.user.walletAddress;
    const enlace = `https://world.org/mini-app?app_id=app_48bf75430fa1e83c8063dc451b9decde&path=/invite?ref=${ref}`;
    try {
      await navigator.clipboard.writeText(enlace);
    } catch (error) {
      console.error("Error al copiar el enlace de referido:", error);
    }
  };

  const handleSendReward = async () => {
    if (!referral) return;
    if (!referral_name) { console.error("Usuario no encontrado"); return; }
    try {
      await sendTransaction({
        transaction: [{
          address: NEX_GOLD_REFERRAL_ADDRESS,
          abi: NEX_GOLD_REFERRAL_ABI as any,
          functionName: "rewardUser",
          args: [referral],
        }],
      });
    } catch (error) {
      console.error("Error al enviar recompensa:", error);
    }
  };

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
            <div className="flex flex-col space-y-4"><GoldButton onClick={handleCopyReferralLink}>Copiar mi enlace</GoldButton><GoldButton onClick={handleSendReward} className="w-full" disabled={isProcessing}>Enviar recompensa</GoldButton></div>
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
  );
};

const StakingAndMiningSection: FC<{ onBack: () => void }> = ({ onBack }) => {
  const [amount, setAmount] = useState("");
  const { sendTransaction, status, error } = useMiniKit();
  const { contractData, fetchContractData, isLocked } = useContractData();
  const session = useSession();
  const isProcessing = status === "pending";
  useEffect(() => { if (status === "success") { fetchContractData() } }, [status, fetchContractData]);

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
    });
  };
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
    });
  };

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
              <div><p className="text-sm text-gray-300">Recompensas Staking (APY/12%)</p><p className="text-xl font-bold text-yellow-400">+{Number.parseFloat(contractData.stakingRewards).toFixed(4)} NXG</p></div>
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
  );
};

const HistoryModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  transactions: any[];
  isLoading: boolean;
  error: string | null;
  walletAddress: `0x${string}` | undefined;
  onRefresh: () => void;
}> = ({ isOpen, onClose, transactions, isLoading, error, walletAddress, onRefresh }) => {
  if (!isOpen) return null;

  const TransactionIcon: FC<{ type: 'in' | 'out' }> = ({ type }) => {
    const isIncoming = type === 'in';
    const Icon = isIncoming ? ArrowDownLeft : ArrowUpRight;
    return (
      <div className={`p-2 rounded-full ${isIncoming ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
        <Icon className={isIncoming ? 'text-green-400' : 'text-red-400'} size={20} />
      </div>
    );
  };

  const TransactionItem: FC<{ tx: any }> = ({ tx }) => {
    if (!walletAddress) return null;
    const isIncoming = getAddress(tx.to) === getAddress(walletAddress);
    const amount = parseFloat(formatEther(BigInt(tx.value))).toFixed(4);
    const date = new Date(parseInt(tx.timeStamp) * 1000).toLocaleDateString();
    let type = isIncoming ? 'Recibido' : 'Enviado';
    if (getAddress(tx.from) === NEX_GOLD_STAKING_ADDRESS) {
        type = isIncoming ? 'Recompensa / Unstake' : 'Stake';
    }
    return (
      <div className="flex items-center justify-between py-4 px-2 hover:bg-yellow-500/5 rounded-lg transition-colors">
        <div className="flex items-center gap-4"><TransactionIcon type={isIncoming ? 'in' | 'out'} />
          <div><p className="font-semibold text-white">{type}</p><p className="text-xs text-gray-400">{date}</p></div>
        </div>
        <p className={`font-bold ${isIncoming ? 'text-green-400' : 'text-white'}`}>{isIncoming ? '+' : '-'} {amount} NXG</p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-gray-900/80 border-2 border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Historial de Transacciones</h2>
          <button onClick={onRefresh} disabled={isLoading} className="text-gray-400 hover:text-white transition disabled:opacity-50"><RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="text-center py-8"><Layers className="animate-spin text-yellow-400 inline-block" /><p className="mt-2 text-gray-300">Cargando...</p></div>
          ) : error ? (
            <p className="text-center text-red-400 py-8">{error}</p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No se encontraron transacciones.</p>
          ) : (
            <div className="divide-y divide-yellow-500/10">{transactions.map(tx => <TransactionItem key={tx.hash} tx={tx} />)}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<"dashboard" | "staking" | "referral">("dashboard");
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const { transactions, isLoading: isHistoryLoading, error: historyError, fetchWalletData } = useWalletData();
  const walletAddress = session?.user?.walletAddress as `0x${string}` | undefined;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const goBack = () => setActiveSection("dashboard");

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-yellow-400 bg-gray-900">Cargando...</div>;
  }

  if (status === "authenticated") {
    return (
      <>
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
                <div className="bg-black/30 backdrop-blur-lg border border-yellow-500/20 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6 space-y-4">
                  <div className="mb-2">
                    <UserInfo />
                  </div>
                  <GoldButton className="w-full" onClick={() => setActiveSection("staking")}>
                    📈 Staking & Mining
                  </GoldButton>
                  <GoldButton className="w-full" onClick={() => setIsHistoryModalOpen(true)}>
                    <History className="inline-block mr-2" size={20}/>
                    Ver Historial
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

        <HistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          transactions={transactions}
          isLoading={isHistoryLoading}
          error={historyError}
          walletAddress={walletAddress}
          onRefresh={fetchWalletData}
        />
      </>
    );
  }

  return null;
          }
