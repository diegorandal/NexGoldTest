'use client';

import Link from "next/link";
import { ExternalLink, AppWindow, Gift } from "lucide-react";
import { Card } from "@/components/ui-components";
import { useContractDataAirdrop } from "@/hooks/use-contract-data-airdrop"
import { useState } from "react"
import { useMiniKit } from "@/hooks/use-minikit"
import AIRDROP_ABI from "@/abi/AIRDROP_ABI.json"
import { Loader } from 'lucide-react'

export default function AlliesPage() {

    const { canClaimAirdrop, isLoadingAirdrop, fetchAirdropData } = useContractDataAirdrop();
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
        } catch (error) {
        console.error("Error al enviar recompensa:", error)
        }
    }

    return (
    <div className="animate-fade-in mx-4 mt-4 pb-24">
      <Card className="space-y-4">
        <h2 className="text-xl font-bold text-yellow-400 text-center">Comunidad</h2>

        <div className="space-y-4">

          {/* Tarjeta 1: NexGold - Botones unificados */}
          <div className="bg-white/10 p-4 rounded-lg flex flex-col space-y-2">
            <h3 className="font-bold text-lg text-white">NexGold</h3>
            <p className="text-sm text-gray-400">👑 poder digital con respaldo dorado ⚡️</p>
            <div className="flex flex-row space-y-0 space-x-4 mt-2">
              <Link href={'https://t.me/+_zr0basq5yQ4ZmIx'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-2 text-sm px-4 py-2 border border-yellow-400 text-yellow-400 rounded-lg active:bg-yellow-400 active:text-black transition-colors duration-300">
                <ExternalLink size={16} />
                <span>Telegram</span>
              </Link>
              <Link href={'https://x.com/N3xGold?s=09'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-2 text-sm px-4 py-2 border border-yellow-400 text-yellow-400 rounded-lg active:bg-yellow-400 active:text-black transition-colors duration-300">
                <ExternalLink size={16} />
                <span>X</span>
              </Link>
            </div>
          </div>

          {/* Tarjeta 2: Destinity - Lógica y diseño de cuadrícula actualizados */}
          <div className="bg-white/10 p-4 rounded-lg flex flex-col space-y-2">
            <h3 className="font-bold text-lg text-white">Destinity</h3>
            <p className="text-sm text-gray-400">Ecosistema de NFTs, juegos y finanzas descentralizadas.</p>
            
            {/* Contenedor de botones con diseño de cuadrícula */}
            <div className="grid grid-cols-2 gap-4 mt-2">
                <Link href="https://world.org/mini-app?app_id=app_9364e8ee9845fe89fc2f35bdca45e944" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-2 text-sm px-4 py-2 border border-yellow-400 text-yellow-400 rounded-lg active:bg-yellow-400 active:text-black transition-colors duration-300">
                    <AppWindow size={16} />
                    <span>Abrir App</span>
                </Link>
                <Link href="https://t.me/+QPu0jzt-_PxjMmUx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-2 text-sm px-4 py-2 border border-yellow-400 text-yellow-400 rounded-lg active:bg-yellow-400 active:text-black transition-colors duration-300">
                    <ExternalLink size={16} />
                    <span>Telegram</span>
                </Link>
                {isLoadingAirdrop ? (
                    <div className="col-span-2 text-center text-yellow-400">
                    <Loader className="animate-spin inline-block mr-2" /> Cargando airdrop...
                    </div>
                ) : (
                    canClaimAirdrop && (
                    <button className="col-span-2 w-full inline-flex items-center justify-center space-x-2 text-sm px-4 py-2 border border-green-500 text-green-500 rounded-lg active:bg-yellow-400 active:text-black transition-colors duration-300" onClick={handleClaimAirdrop} disabled={txStatus === "pending"}>
                        <Gift size={16} />
                        <span>Reclamar Airdrop DWD</span>
                    </button>
                    )
                )}
            </div>
          </div>

          {/* Tarjeta 3: ProjectMiniApp */}
          <div className="bg-white/10 p-4 rounded-lg flex flex-col space-y-2">
            <h3 className="font-bold text-lg text-white">ProjectMiniApp</h3>
            <p className="text-sm text-gray-400">Desarrollamos la MiniApp de NexGold. ¿Tiene una idea? Contáctenos.</p>
            <div className="flex flex-row space-y-0 space-x-4 mt-2">
              <Link href="https://projectminiapp.github.io/website/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-2 text-sm px-4 py-2 border border-yellow-400 text-yellow-400 rounded-lg active:bg-yellow-400 active:text-black transition-colors duration-300">
                <AppWindow size={16} />
                <span>Sitio web</span>
              </Link>
              <Link href="https://t.me/+aA5Sy3B8dvZjZDFh" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-2 text-sm px-4 py-2 border border-yellow-400 text-yellow-400 rounded-lg active:bg-yellow-400 active:text-black transition-colors duration-300">
                <ExternalLink size={16} />
                <span>Telegram</span>
              </Link>
            </div>
          </div>

          {/* Otras iniciativas */ }

        </div>
      </Card>
    </div>
  );
}
