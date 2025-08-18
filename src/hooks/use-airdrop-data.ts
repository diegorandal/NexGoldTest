'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { createPublicClient, http, formatEther } from 'viem';
import { worldchain } from 'viem/chains';
import NEX_GOLD_DROP_ABI from '@/abi/NexGoldDropABI.json';

const NEX_GOLD_DROP_ADDRESS = '0x237057b5f3d1d2b3622df39875948e4857e52ac8';

const publicClient = createPublicClient({
  chain: worldchain,
  transport: http(),
});

export const useAirdropData = () => {
  const { data: session } = useSession();
  const walletAddress = session?.user?.walletAddress as `0x${string}` | undefined;

  const [canClaim, setCanClaim] = useState(false);
  const [claimAmount, setClaimAmount] = useState('0');
  const [isLoading, setIsLoading] = useState(true);

  const checkClaimStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const [amount, hasAlreadyClaimed] = await publicClient.multicall({
        contracts: [
          {
            address: NEX_GOLD_DROP_ADDRESS,
            abi: NEX_GOLD_DROP_ABI,
            functionName: 'welcomeAmount',
          },
          {
            address: NEX_GOLD_DROP_ADDRESS,
            abi: NEX_GOLD_DROP_ABI,
            functionName: 'hasClaimed',
            args: [walletAddress || '0x0'],
          },
        ],
      });

      if (amount.status === 'success') {
        setClaimAmount(formatEther(amount.result as bigint));
      }
      if (hasAlreadyClaimed.status === 'success' && walletAddress) {
        setCanClaim(!hasAlreadyClaimed.result);
      } else {
        setCanClaim(false);
      }
    } catch (e) {
      console.error("Error al verificar el estado del airdrop:", e);
      setCanClaim(false);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    checkClaimStatus();
  }, [checkClaimStatus]);

  return { canClaim, claimAmount, isLoading, refetch: checkClaimStatus };
};
