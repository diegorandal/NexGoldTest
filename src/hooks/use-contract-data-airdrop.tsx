"use client"

import { useState, useEffect, useCallback } from "react"
import { createPublicClient, http } from "viem"
import { worldchain } from "viem/chains"
import { useSession } from "next-auth/react"
import AIRDROP_ABI from "@/abi/AIRDROP_ABI.json"

// La dirección de tu contrato de Airdrop
const AIRDROP_ADDRESS = "0x237057b5f3d1d2b3622df39875948e4857e52ac8"

// Crea un cliente público para leer datos de la cadena de bloques
const publicClient = createPublicClient({
  chain: worldchain,
  transport: http("https://worldchain-mainnet.g.alchemy.com/public"),
})

export const useContractDataAirdrop = () => {
  const { data: session } = useSession()
  const [canClaimAirdrop, setCanClaimAirdrop] = useState(false)
  const [isLoadingAirdrop, setIsLoadingAirdrop] = useState(true)

  const fetchAirdropData = useCallback(async () => {
    if (!session?.user?.walletAddress) {
      setIsLoadingAirdrop(false)
      setCanClaimAirdrop(false)
      return
    }

    setIsLoadingAirdrop(true)
    try {
      const walletAddress = session.user.walletAddress as `0x${string}`

      // 1. Verificar si el usuario ya ha reclamado
      const hasClaimed = await publicClient.readContract({
        address: AIRDROP_ADDRESS,
        abi: AIRDROP_ABI,
        functionName: "hasClaimed",
        args: [walletAddress],
      }) as boolean

      if (hasClaimed) {
        setCanClaimAirdrop(false)
        setIsLoadingAirdrop(false)
        return
      }

      setCanClaimAirdrop(hasClaimed)
      
    } catch (e) {
      console.error("Error al obtener datos del airdrop:", e)
      setCanClaimAirdrop(false)
    } finally {
      setIsLoadingAirdrop(false)
    }
  }, [session?.user?.walletAddress])

  useEffect(() => {
    fetchAirdropData()
  }, [fetchAirdropData])

  return { canClaimAirdrop, isLoadingAirdrop, fetchAirdropData }
}