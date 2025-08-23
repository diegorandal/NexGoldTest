'use client';

import Link from "next/link";
import { ExternalLink, AppWindow, Gift } from "lucide-react";
import { Card } from "@/components/ui-components";
import { useContractDataAirdrop } from "@/hooks/use-contract-data-airdrop"
import { useState } from "react"
import { LinkButton, GoldButton } from "@/components/ui-components"
import { useMiniKit } from "@/hooks/use-minikit"
import AIRDROP_ABI from "@/abi/AIRDROP_ABI.json"
import { Loader } from 'lucide-react'

export default function AlliesPage() {

    const { canClaimAirdrop, isLoadingAirdrop, fetchAirdropData } = useContractDataAirdrop();
    const [showAirdropLink, setShowAirdropLink] = useState(false);
    const { sendTransaction, status: txStatus} = useMiniKit()
    const AIRDROP_ADDRESS = "0x237057b5f3d1d2b3622df39875948e4857e52ac8"

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

    return (
    <div className="animate-fade-in mx-4 mt-4 pb-24">
      <Card className="space-y-4">
        <h2 className="text-xl font-bold text-yellow-400 text-center">Comunidad</h2>

        <div className="space-y-4">

          {/* Tarjeta 1: NexGold */}
          <div className="bg-white/10 p-4 rounded-lg flex flex-col space-y-2">
            <h3 className="font-bold text-lg text-white">NexGold</h3>
            <p className="text-sm text-gray-400">👑 poder digital con respaldo dorado ⚡️</p>
            <div className="flex flex-row space-x-2 md:space-x-4 mt-2">
                <a href={'https://t.me/+_zr0basq5yQ4ZmIx'} target="_blank" rel="noopener noreferrer" className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg bg-gray-700/50 transition-transform hover:scale-105">
                    <img width="32" height="32" src="https://img.icons8.com/3d-fluency/94/telegram.png" alt="telegram"/>
                    <span className="text-sm mt-1 text-gray-300">Telegram</span>
                </a>
                <a href={'https://x.com/N3xGold?s=09'} target="_blank" rel="noopener noreferrer" className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg bg-gray-700/50 transition-transform hover:scale-105">
                    <img width="32" height="32" src="https://img.icons8.com/3d-fluency/94/x.png" alt="x"/>
                    <span className="text-sm mt-1 text-gray-300">X</span>
                </a>
            </div>
          </div>

          {/* Tarjeta 2: DWD */}
          <div className="bg-white/10 p-4 rounded-lg flex flex-col space-y-2">
            <h3 className="font-bold text-lg text-white">Destinity</h3>
            <p className="text-sm text-gray-400">Ecosistema de NFTs, juegos y finanzas descentralizadas.</p>
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 mt-2">
                <LinkButton href="https://world.org/mini-app?app_id=app_9364e8ee9845fe89fc2f35bdca45e944">Abrir Destinity</LinkButton>

                <Link href="https://worldguilds.xyz" passHref>
                    <a target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-2 text-sm px-4 py-2 border border-gray-400 text-gray-400 rounded-lg hover:bg-gray-400 hover:text-black transition-colors duration-300">
                        <ExternalLink size={16} />
                        <span>Página Web</span>
                    </a>
                </Link>
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
                        

            </div>
          </div>

          {/* Tarjeta 3: CryptoPaws */}
          <div className="bg-white/10 p-4 rounded-lg flex flex-col space-y-2">
            <h3 className="font-bold text-lg text-white">CryptoPaws</h3>
            <p className="text-sm text-gray-400">Plataforma NFT donde puedes adoptar mascotas virtuales y ganar tokens pasivamente.</p>
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 mt-2">
              <Link href="https://cryptopaws.io/dapp" passHref>
                <a target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-2 text-sm px-4 py-2 border border-yellow-400 text-yellow-400 rounded-lg hover:bg-yellow-400 hover:text-black transition-colors duration-300">
                  <AppWindow size={16} />
                  <span>Abrir App</span>
                </a>
              </Link>
              <Link href="https://cryptopaws.io" passHref>
                <a target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-2 text-sm px-4 py-2 border border-gray-400 text-gray-400 rounded-lg hover:bg-gray-400 hover:text-black transition-colors duration-300">
                  <ExternalLink size={16} />
                  <span>Página Web</span>
                </a>
              </Link>
            </div>
          </div>

          {/* Ejemplo de Airdrop (hardcodeado) */}
          <div className="bg-white/10 p-4 rounded-lg flex flex-col space-y-2">
            <h3 className="font-bold text-lg text-white">EcoSwap</h3>
            <p className="text-sm text-gray-400">Un airdrop para usuarios de EcoSwap, se ha reservado un 2% de los tokens.</p>
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 mt-2">
              <Link href="https://ecoswap.org/app" passHref legacyBehavior>
                <a target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-2 text-sm px-4 py-2 border border-yellow-400 text-yellow-400 rounded-lg hover:bg-yellow-400 hover:text-black transition-colors duration-300">
                  <AppWindow size={16} />
                  <span>Abrir App</span>
                </a>
              </Link>
              <Link href="https://ecoswap.org/airdrop" passHref legacyBehavior>
                <a target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-2 text-sm px-4 py-2 border border-green-500 text-green-500 rounded-lg hover:bg-green-500 hover:text-black transition-colors duration-300">
                  <Gift size={16} />
                  <span>Reclamar Airdrop</span>
                </a>
              </Link>
            </div>
          </div>

        </div>
      </Card>
    </div>
  );
}
