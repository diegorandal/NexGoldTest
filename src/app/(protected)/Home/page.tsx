"use client"

import { useState, useEffect, type FC, useCallback } from "react"
import { parseEther, getAddress, formatEther } from "viem"
import { useSession } from "next-auth/react"
import { Info, Loader, CheckCircle, XCircle, History, DollarSign, Heart } from 'lucide-react' // Ícono añadido
import { useRouter } from "next/navigation"
import { Card, InputGold, GoldButton, BackButton, UserInfo, LinkButton } from "@/components/ui-components"
import { useMiniKit } from "@/hooks/use-minikit"
import { useContractData } from "@/hooks/use-contract-data"
import { useContractDataAirdrop } from "@/hooks/use-contract-data-airdrop"
import AIRDROP_ABI from "@/abi/AIRDROP_ABI.json"
import { getUnoDeeplinkUrl } from '../../lib/linkUNO';
import { useContractDataRef } from "@/hooks/use-contract-data-ref"
import NEX_GOLD_REFERRAL_ABI from "@/abi/NEX_GOLD_REFERRAL_ABI.json"

const NEX_GOLD_REFERRAL_ADDRESS = "0x23f3f8c7f97c681f822c80cad2063411573cf8d3"
const NEX_GOLD_STAKING_ADDRESS = "0xd025b92f1b56ada612bfdb0c6a40dfe27a0b4183"
const NEX_GOLD_ADDRESS = "0xA3502E3348B549ba45Af8726Ee316b490f308dDC"
const AIRDROP_ADDRESS = "0x237057b5f3d1d2b3622df39875948e4857e52ac8"

// --- Componente para mostrar el precio del token ---
const TokenPrice: FC<{ contractAddress: string }> = ({ contractAddress }) => {
    const [price, setPrice] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTokenPrice = async () => {
            // Llamamos a nuestra propia API Route
            const API_URL = `/api/token-price?address=${contractAddress}`;
            
            try {
                const response = await fetch(API_URL);
                if (!response.ok) {
                    throw new Error('Local API response was not ok');
                }
                const data = await response.json();
                const priceInUsd = data[contractAddress.toLowerCase()]?.usd;
                
                if (priceInUsd) {
                    setPrice(priceInUsd);
                } else {
                    setPrice(null);
                }
            } catch (error) {
                console.error("Error fetching token price via local API:", error);
                setPrice(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTokenPrice();
    }, [contractAddress]);

    if (isLoading) {
        return <div className="text-sm text-gray-400 animate-pulse">Cargando precio...</div>;
    }

    if (price === null) {
        return <div className="text-sm text-red-400">Precio no disponible</div>;
    }

    return (
        <div className="flex items-center justify-center text-sm text-gray-300 bg-white/10 py-1 px-3 rounded-full">
            <DollarSign size={14} className="mr-1 text-green-400"/>
            1 NXG = <span className="font-bold ml-1">${price.toFixed(4)} USD</span>
        </div>
    );
};

export default function HomePage() {
  const { status } = useSession()
  const router = useRouter()
  const { contractData } = useContractData()
  const { canClaimAirdrop, isLoadingAirdrop, fetchAirdropData } = useContractDataAirdrop()
  const { sendTransaction, status: txStatus} = useMiniKit()
  const [showAirdropLink, setShowAirdropLink] = useState(false);
  const { contractDataRef, fetchContractDataRef } = useContractDataRef();

  // Función para saber si puede enviar recompensas de referido
  const handleClaimReward = async () => {

    //mostrar modal con explicacion y boton para transaccion

      try {
        /*
        await sendTransaction({
              transaction: [{
                  address: NEX_GOLD_REFERRAL_ADDRESS,
                  abi: NEX_GOLD_REFERRAL_ABI as any,
                  functionName: "claimReward",
                  args: [],
              }],
          });
          fetchContractDataRef(); // Vuelve a cargar los datos para actualizar el estado
        */
      } catch (error) {
          console.error("Error al reclamar recompensa:", error);
      }
  };

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

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-yellow-400 bg-gray-900">Cargando...</div>
  }

  if (status === "authenticated") {
    return (
      <div
        className="min-h-screen flex flex-col justify-between p-4 pb-34 font-sans"
        style={{
          backgroundImage: "url('/background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
          {/* Lógica para mostrar el botón de Reclamar Recompensa de Referidos */}
          {/* Corazón flotante */}
          {!contractDataRef.canReward && (
              <div className="fixed bottom-1/4 right-4 z-50 animate-pulse cursor-pointer" onClick={handleClaimReward}>
                  <Heart size={64} className="text-yellow-400 fill-current" />
              </div>
          )}
          <>
            <div className="w-full max-w-md mx-auto">
              <div className="bg-black/30 backdrop-blur-lg border border-yellow-500/20 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6 space-y-4">
                <UserInfo />
                <div className="text-center space-y-2">
                  {contractData.isLoading ? (
                    <div className="text-yellow-400 p-2"><Loader className="animate-spin inline-block mr-2" /> Cargando...</div>
                  ) : (
                    <>
                      <p className="text-xl font-bold text-yellow-400">💳 {Number.parseFloat(contractData.availableBalance).toFixed(4)} NXG</p>
                      <TokenPrice contractAddress={NEX_GOLD_ADDRESS} />
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full max-w-md mx-auto">
              <div className="bg-black/30 backdrop-blur-lg border border-yellow-500/20 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6 space-y-4">
                <div className="flex justify-center space-x-4 mt-2">
                  <LinkButton href={'https://t.me/+_zr0basq5yQ4ZmIx'}><img width="24" height="24" src="https://img.icons8.com/3d-fluency/94/telegram.png" alt="telegram"/>Telegram</LinkButton>
                  <LinkButton href={'https://x.com/N3xGold?s=09'}><img width="24" height="24" src="https://img.icons8.com/3d-fluency/94/x.png" alt="x"/>X</LinkButton>
                </div>
               
                {/* Lógica para mostrar el botón de Reclamar Airdrop */}
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
