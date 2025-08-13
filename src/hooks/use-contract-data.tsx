"use client"

import { useState, useEffect, useCallback } from "react"
import { createPublicClient, http, formatEther } from "viem"
import { worldchain } from "viem/chains"
import { useSession } from "next-auth/react"
import NEX_GOLD_STAKING_ABI from "@/abi/NEX_GOLD_STAKING_ABI.json"

const NEX_GOLD_STAKING_ADDRESS = "0x3c8acbee00a0304842a48293b6c1da63e3c6bc41"

const publicClient = createPublicClient({
  chain: worldchain,
  transport: http("https://worldchain-mainnet.g.alchemy.com/public"),
})

export const useContractData = () => {
  const { data: session } = useSession()
  const [contractData, setContractData] = useState({
    stakedBalance: "0.0",
    stakingRewards: "0.0",
    miningRewards: "0.0",
    availableBalance: "0.0",
    lockinEndDate: null as Date | null,
    isLoading: true,
  })

  const fetchContractData = useCallback(async () => {
    if (!session?.user?.walletAddress) return

    setContractData((prev) => ({ ...prev, isLoading: true }))
    try {

        const contractAddress = "0xA3502E3348B549ba45Af8726Ee316b490f308dDC" as `0x${string}`;
        const walletAddress = session.user.walletAddress as `0x${string}`;

        const [staker, stakingRewards, miningRewards, availableBalance] = await Promise.all([
        publicClient.readContract({
          address: NEX_GOLD_STAKING_ADDRESS,
          abi: NEX_GOLD_STAKING_ABI,
          functionName: "stakers",
          args: [session.user.walletAddress],
        }) as unknown as [bigint, bigint, bigint, bigint],
        publicClient.readContract({
          address: NEX_GOLD_STAKING_ADDRESS,
          abi: NEX_GOLD_STAKING_ABI,
          functionName: "calculateStakingRewards",
          args: [session.user.walletAddress],
        }) as unknown as bigint,
        publicClient.readContract({
          address: NEX_GOLD_STAKING_ADDRESS,
          abi: NEX_GOLD_STAKING_ABI,
          functionName: "calculateMiningRewards",
          args: [session.user.walletAddress],
        }) as unknown as bigint,
        publicClient.readContract({
          address: contractAddress,
          abi: [
            {
              inputs: [{ internalType: "address", name: "account", type: "address" }],
              name: "balanceOf",
              outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
              stateMutability: "view",
              type: "function",
            },
          ],
          functionName: "balanceOf",
          args: [walletAddress],
        }) as unknown as bigint,
      ])

      setContractData({
        stakedBalance: formatEther(staker[0]),
        lockinEndDate: staker[1] > 0 ? new Date(Number(staker[1]) * 1000) : null,
        stakingRewards: formatEther(stakingRewards),
        miningRewards: formatEther(miningRewards),
        availableBalance: formatEther(availableBalance),
        isLoading: false,
      })
    } catch (e) {
      console.error("Error fetching contract data:", e)
      setContractData((prev) => ({ ...prev, isLoading: false }))
    }
  }, [session?.user?.walletAddress])

  useEffect(() => {
    fetchContractData()
  }, [fetchContractData])

  const isLocked = contractData.lockinEndDate && contractData.lockinEndDate > new Date()

  return { contractData, fetchContractData, isLocked }
}