'use client';

import { useState, useEffect, useCallback } from 'react';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple';
const CHAIN_ID = 'world-chain'; 
const NXG_TOKEN_ADDRESS = '0xA3502E3348B549ba45Af8726Ee316b490f308dDC';
const WLD_TOKEN_ID = 'worldcoin';

export const useTokenPairPrice = () => {
  const [price, setPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nxgResponse, wldResponse] = await Promise.all([
        fetch(`${COINGECKO_API_URL}/token_price/${CHAIN_ID}?contract_addresses=${NXG_TOKEN_ADDRESS}&vs_currencies=usd`),
        fetch(`${COINGECKO_API_URL}/price?ids=${WLD_TOKEN_ID}&vs_currencies=usd`)
      ]);

      if (!nxgResponse.ok || !wldResponse.ok) {
        throw new Error('No se pudo obtener el precio de los tokens.');
      }

      const nxgData = await nxgResponse.json();
      const wldData = await wldResponse.json();

      const nxgPriceInUsd = nxgData[NXG_TOKEN_ADDRESS.toLowerCase()]?.usd;
      const wldPriceInUsd = wldData[WLD_TOKEN_ID]?.usd;

      if (nxgPriceInUsd && wldPriceInUsd && wldPriceInUsd > 0) {
        setPrice(nxgPriceInUsd / wldPriceInUsd);
      } else {
        throw new Error('No se encontraron los datos de precio.');
      }
    } catch (e: any) {
      setError(e.message || 'Error al buscar el precio.');
      setPrice(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return { price, isLoading, error };
};
