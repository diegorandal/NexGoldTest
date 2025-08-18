// En tu carpeta src/hooks, crea un archivo llamado use-contract-data-airdrop.ts
"use client"

import { useState, useEffect, useCallback } from "react"
import { createPublicClient, http } from "viem"
import { worldchain } from "viem/chains"
import { useSession } from "next-auth/react"
import AIRDROP_ABI from "@/abi/AIRDROP_ABI.json"

// La dirección de tu contrato de Airdrop
const AIRDROP_ADDRESS = "0x237057b5f3d1d2b3622df39875948e4857e52ac8"

// ABI mínimo para balanceOf de un token ERC20
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  }
]

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

      // 2. Obtener la cantidad del airdrop y la dirección del token
      const [welcomeAmount, welcomeTokenAddress] = await Promise.all([
        publicClient.readContract({
          address: AIRDROP_ADDRESS,
          abi: AIRDROP_ABI,
          functionName: "welcomeAmount",
        }) as unknown as bigint,
        publicClient.readContract({
          address: AIRDROP_ADDRESS,
          abi: AIRDROP_ABI,
          functionName: "welcomeToken",
        }) as unknown as `0x${string}`
      ]);

      // 3. Verificar si el contrato de airdrop tiene saldo suficiente
      const airdropContractBalance = await publicClient.readContract({
        address: welcomeTokenAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [AIRDROP_ADDRESS],
      }) as bigint

      // El usuario puede reclamar si no ha reclamado Y si el contrato tiene saldo
      setCanClaimAirdrop(airdropContractBalance >= welcomeAmount)
      
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