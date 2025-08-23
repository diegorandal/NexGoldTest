"use client"

import { useState, useEffect, type FC } from "react"
import { useSession } from "next-auth/react"
import { Heart, Loader, DollarSign, Wallet } from 'lucide-react'
import { useRouter } from "next/navigation"
import { UserInfo, LinkButton, GoldButton } from "@/components/ui-components"
import { useMiniKit } from "@/hooks/use-minikit"
import { useContractData } from "@/hooks/use-contract-data"
import { useContractDataAirdrop } from "@/hooks/use-contract-data-airdrop"
import AIRDROP_ABI from "@/abi/AIRDROP_ABI.json"
import { useContractDataRef } from "@/hooks/use-contract-data-ref"
import NEX_GOLD_REFERRAL_ABI from "@/abi/NEX_GOLD_REFERRAL_ABI.json"
import { MiniKit } from "@worldcoin/minikit-js"

const NEX_GOLD_REFERRAL_ADDRESS = "0x23f3f8c7f97c681f822c80cad2063411573cf8d3"
const AIRDROP_ADDRESS = "0x237057b5f3d1d2b3622df39875948e4857e52ac8"

// --- Componente actualizado para mostrar el precio rotativo ---
const TokenPrice: FC<{ balance: string }> = ({ balance }) => {
    const [price, setPrice] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [displayMode, setDisplayMode] = useState<'price' | 'total'>('price');

    useEffect(() => {
        const fetchTokenPrice = async () => {
            const network = "world-chain";
            const poolAddress = "0x7ecbb39f41b1dbfe46db164e6af9c1b601221c7c";
            const apiUrl = `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${poolAddress}`;
            
            try {
                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error('GeckoTerminal API response was not ok');
                
                const data = await response.json();
                const priceUsd = data.data?.attributes?.base_token_price_usd;
                
                setPrice(priceUsd ? parseFloat(priceUsd) : null);
            } catch (error) {
                console.error("Error fetching token price:", error);
                setPrice(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTokenPrice();
    }, []);

    useEffect(() => {
        if (isLoading || price === null) return;

        const intervalId = setInterval(() => {
            setDisplayMode(prevMode => (prevMode === 'price' ? 'total' : 'price'));
        }, 3000); // Cambia cada 3 segundos

        return () => clearInterval(intervalId);
    }, [isLoading, price]);

    if (isLoading) {
        return <div className="text-sm text-gray-400 animate-pulse">Cargando precio...</div>;
    }

    if (price === null) {
        return <div className="text-sm text-red-400">Precio no disponible</div>;
    }

    const userBalance = parseFloat(balance) || 0;
    const totalUsdValue = userBalance * price;

    return (
        <div className="flex items-center justify-center text-sm text-gray-300 bg-white/10 py-1 px-3 rounded-full min-w-[200px] text-center">
            {displayMode === 'price' ? (
                <>
                    <DollarSign size={14} className="mr-2 text-green-400"/>
                    <span>1 NXG = <span className="font-bold ml-1">${price.toFixed(8)} USD</span></span>
                </>
            ) : (
                <>
                    <Wallet size={14} className="mr-2 text-yellow-400"/>
                    <span>Balance: <span className="font-bold ml-1">${totalUsdValue.toFixed(4)} USD</span></span>
                </>
            )}
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
  const { contractDataRef } = useContractDataRef();
  const [referral, setReferral] = useState<string | null>(null)
  const [referral_name, setReferralName] = useState<string | null>(null)

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

  const handleClaimReward = async () => {
    const addressToSend = referral;
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
          {(contractDataRef.canReward && referral_name) && (
              <div className="fixed bottom-1/4 right-4 z-50 animate-pulse cursor-pointer flex flex-col items-center" onClick={handleClaimReward}>
                  <Heart size={64} className="text-yellow-400 fill-current" />
                  <span className="text-yellow-400 text-xs mt-1">
                      Recompensar a 
                  </span>
                  <span className="text-yellow-400 text-xs mt-1">
                      {referral_name}
                  </span>
              </div>
          )}
          <>
            <div className="w-full max-w-md mx-auto">
              <div className="bg-black/30 backdrop-blur-lg border border-yellow-500/20 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6 space-y-4">
                <div className="flex justify-center space-x-4">
                    <a href={'https://t.me/+_zr0basq5yQ4ZmIx'} target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
                        <img width="32" height="32" src="https://img.icons8.com/3d-fluency/94/telegram.png" alt="telegram"/>
                    </a>
                    <a href={'https://x.com/N3xGold?s=09'} target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
                        <img width="32" height="32" src="https://img.icons8.com/3d-fluency/94/x.png" alt="x"/>
                    </a>
                </div>
                <UserInfo />
                <div className="text-center space-y-2 flex flex-col items-center">
                  {contractData.isLoading ? (
                    <div className="text-yellow-400 p-2"><Loader className="animate-spin inline-block mr-2" /> Cargando...</div>
                  ) : (
                    <>
                      <p className="text-xl font-bold text-yellow-400">💳 {Number.parseFloat(contractData.availableBalance).toFixed(4)} NXG</p>
                      <TokenPrice balance={contractData.availableBalance} />
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full max-w-md mx-auto">
              <div className="bg-black/30 backdrop-blur-lg border border-yellow-500/20 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6 space-y-4">
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
