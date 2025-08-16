"use client"

import { useState, useEffect, useCallback } from "react"
import { createPublicClient, http, formatEther } from "viem"
import { worldchain } from "viem/chains"
import { useSession } from "next-auth/react"
import NEX_GOLD_REFERRAL_ABI from "@/abi/NEX_GOLD_REFERRAL_ABI.json"

const NEX_GOLD_REFERRAL_ADDRESS = "0xa5957cf7f7eacaa3a695df6ffc8cf5e4989aa879"

const publicClient = createPublicClient({
  chain: worldchain,
  transport: http("https://worldchain-mainnet.g.alchemy.com/public"),
})

export const useContractDataRef = () => {
  const { data: session } = useSession()
  const [contractDataRef, setContractDataRef] = useState({
    rewardAmount: "0",
    rewardCount: "0",
    isLoading: true,
  })

  const fetchContractDataRef = useCallback(async () => {
    if (!session?.user?.walletAddress) return

    setContractDataRef((prev) => ({ ...prev, isLoading: true }))
    try {
        const walletAddress = session.user.walletAddress;

        const [amount, count] = await Promise.all([
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
      ])

      setContractDataRef({
        rewardAmount: amount.toString(),
        rewardCount: count.toString(),
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
