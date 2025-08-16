'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { createPublicClient, http, formatEther, getAddress } from 'viem';
import { worldchain } from 'viem/chains';

const NEX_GOLD_TOKEN_ADDRESS = '0xA3502E3348B549ba45Af8726Ee316b490f308dDC';
const ERC20_ABI = [{ "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "type": "function" }] as const;
const WORLDSCAN_API_URL = 'https://www.worldscan.io/api';

const publicClient = createPublicClient({
  chain: worldchain,
  transport: http(),
});

export const useWalletData = () => {
  const { data: session } = useSession();
  const walletAddress = session?.user?.walletAddress as `0x${string}` | undefined;

  const [balance, setBalance] = useState('0.0');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletData = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    setError(null);
    try {
      const balanceResult = await publicClient.readContract({
        address: NEX_GOLD_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [walletAddress],
      });
      setBalance(formatEther(balanceResult));

      const response = await fetch(`${WORLDSCAN_API_URL}?module=account&action=tokentx&contractaddress=${NEX_GOLD_TOKEN_ADDRESS}&address=${walletAddress}&sort=desc`);
      if (!response.ok) throw new Error('La respuesta de la red no fue válida');
      const data = await response.json();

      if (data.status === "1") {
        setTransactions(data.result);
      } else if (data.message === "No transactions found") {
        setTransactions([]);
      } else {
        throw new Error(data.message || 'Error al obtener las transacciones');
      }

    } catch (e: any) {
      console.error("Error fetching wallet data:", e);
      setError(e.message || "No se pudieron cargar los datos.");
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  return { balance, transactions, isLoading, error, fetchWalletData };
};
