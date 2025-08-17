"use client"

import { useState, useEffect, useCallback } from "react"
import { createPublicClient, http, formatEther } from "viem"
import { worldchain } from "viem/chains"
import { useSession } from "next-auth/react"
import { MiniKit } from "@worldcoin/minikit-js"
import NEX_GOLD_REFERRAL_ABI from "@/abi/NEX_GOLD_REFERRAL_ABI.json"

const NEX_GOLD_REFERRAL_ADDRESS = "0x23f3f8c7f97c681f822c80cad2063411573cf8d3"

const publicClient = createPublicClient({
  chain: worldchain,
  transport: http("https://worldchain-mainnet.g.alchemy.com/public"),
})

export const useContractDataRef = () => {
  const { data: session } = useSession()
  const [contractDataRef, setContractDataRef] = useState({
    canReward: false,
    rewardAmount: "0",
    rewardCount: "0",
    top3Addresses: [] as string[],
    top3Counts: [] as string[],
    isLoading: true,
  })

  const fetchContractDataRef = useCallback(async () => {
    if (!session?.user?.walletAddress) return

    setContractDataRef((prev) => ({ ...prev, isLoading: true }))
    try {
        const walletAddress = session.user.walletAddress;

        const [canReward, amount, count, top3] = await Promise.all([
        publicClient.readContract({
          address: NEX_GOLD_REFERRAL_ADDRESS,
          abi: NEX_GOLD_REFERRAL_ABI,
          functionName: "canReward",
          args: [walletAddress],
        }) as unknown as boolean,
        publicClient.readContract({
          address: NEX_GOLD_REFERRAL_ADDRESS,
          abi: NEX_GOLD_REFERRAL_ABI,
          functionName: "rewardAmount",
          args: [],
        }) as unknown as bigint,
        publicClient.readContract({
          address: NEX_GOLD_REFERRAL_ADDRESS,
          abi: NEX_GOLD_REFERRAL_ABI,
          functionName: "rewardCount",
          args: [walletAddress],
        }) as unknown as bigint,
        publicClient.readContract({
            address: NEX_GOLD_REFERRAL_ADDRESS,
            abi: NEX_GOLD_REFERRAL_ABI,
            functionName: "getTop3",
        }) as unknown as [string[], bigint[]],
      ])


      // obtener los nombres de usuario
      const top3Addresses = top3[0];
      const top3Usernames = await Promise.all(
        top3Addresses.map(async (address) => {
          const user = await MiniKit.getUserByAddress(address);
            return user?.username ?? address; 
        })
      );

      setContractDataRef({
        canReward: canReward,
        rewardAmount: formatEther(amount).toString(),
        rewardCount: count.toString(),
        top3Addresses: top3Usernames, 
        top3Counts: top3[1].map(count => count.toString()),
        isLoading: false,
      })

    } catch (e) {
      console.error("Error fetching contract data:", e)
      setContractDataRef((prev) => ({ ...prev, isLoading: false }))
    }
  }, [session?.user?.walletAddress])

  useEffect(() => {
    fetchContractDataRef()
  }, [fetchContractDataRef])

  return { contractDataRef, fetchContractDataRef }
}
