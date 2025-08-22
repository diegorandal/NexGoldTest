'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useMiniKit } from "@/hooks/use-minikit";
import { useContractData } from "@/hooks/use-contract-data"; 
import { parseEther } from "viem"; 
import { Info, Loader, CheckCircle, XCircle } from 'lucide-react'
import { Card, InputGold, GoldButton, LinkButton } from "@/components/ui-components"
import NEX_GOLD_STAKING_ABI from "@/abi/NEX_GOLD_STAKING_ABI.json"
import { getUnoDeeplinkUrl } from '../../lib/linkUNO';

const NEX_GOLD_STAKING_ADDRESS = "0xd025b92f1b56ada612bfdb0c6a40dfe27a0b4183"
const NEX_GOLD_ADDRESS = "0xA3502E3348B549ba45Af8726Ee316b490f308dDC"

export default function StakePage() {
  const [amount, setAmount] = useState("");
  const { sendTransaction, status, error } = useMiniKit();
  const session = useSession();
  const isProcessing = status === "pending";
  const { contractData, fetchContractData, isLocked } = useContractData();

  const params = {
    fromToken: 'WLD',
    toToken: '0xA3502E3348B549ba45Af8726Ee316b490f308dDC',
    amount: '0',
  };

  const deeplink = getUnoDeeplinkUrl(params);

  useEffect(() => {
    if (status === "success") {
      fetchContractData();
    }
  }, [status, fetchContractData]);

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
    const stakeAmount = parseEther(amount).toString();
    const walletAddress = session?.data?.user?.walletAddress;
    await sendTransaction({
      transaction: [{
        address: NEX_GOLD_STAKING_ADDRESS,
        abi: NEX_GOLD_STAKING_ABI as any,
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
            <div className="text-center mb-4">
              <p className="text-sm text-gray-300">Balance Disponible</p>
              <div className="flex justify-center items-center">
                <p className="text-xl font-bold text-yellow-400 mr-2">
                  {Number.parseFloat(contractData.availableBalance).toFixed(4)} NXG
                </p>
                <LinkButton href={deeplink}>🛒 UNO</LinkButton>
              </div>
            </div>
            <div className="text-center"><p className="text-lg text-gray-300">Balance en Staking</p><p className="text-3xl font-bold text-white">{Number.parseFloat(contractData.stakedBalance).toFixed(4)} NXG </p></div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div><p className="text-sm text-gray-300">Recompensas Mining</p></div>
              <div><p className="text-sm text-gray-300">Recompensas Staking (APY/{contractData.stakingAPY / 100}%)</p><p className="text-xl font-bold text-yellow-400">+{Number.parseFloat(contractData.stakingRewards).toFixed(4)} NXG</p></div>
            </div>
            {contractData.lockinEndDate && Number.parseFloat(contractData.stakedBalance) > 0 && <div className={`text-center p-2 rounded-md text-sm ${isLocked ? "bg-red-900/50 text-red-300" : "bg-green-900/50 text-green-300"}`}><Info className="inline-block mr-2 h-4 w-4" />{isLocked ? `Bloqueado hasta: ${contractData.lockinEndDate.toLocaleString()}` : "Fondos desbloqueados."}</div>}
            <InputGold type="number" placeholder="Cantidad de NXG" value={amount} onChange={(e: any) => setAmount(e.target.value)} />
            <div className="grid grid-cols-2 gap-4"><GoldButton onClick={handleStake} disabled={isProcessing}>Stake</GoldButton><GoldButton onClick={handleUnstake} disabled={isProcessing || Number.parseFloat(contractData.availableBalance) <= 0}>Unstake</GoldButton></div>
            <GoldButton onClick={handleClaim} className="w-full" disabled={isProcessing || Number.parseFloat(contractData.stakedBalance) <= 0}>Reclamar Recompensas</GoldButton>
            <p className="text-center text-xs text-gray-400 pt-2">🚨 Si retiras tus fondos en staking antes de tiempo solo recibes el 50%, el resto es destinado a la quema (🔥) automática, manteniendo una economía estable. 🚨 unete a</p>
          </>
        )}
        <div className="h-10 text-center text-sm flex items-center justify-center">
          {status === "pending" && <p className="text-yellow-400 flex items-center gap-2"><Loader className="animate-spin" />Procesando...</p>}
          {status === "success" && <p className="text-green-400 flex items-center gap-2"><CheckCircle />¡Éxito!</p>}
          {status === "error" && <p className="text-red-400 flex items-center gap-2"><XCircle />Error: {error}</p>}
        </div>
      </Card>
    </div>
  );
}