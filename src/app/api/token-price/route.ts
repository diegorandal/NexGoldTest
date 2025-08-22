import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contractAddress = searchParams.get('address');
  const apiKey = '4lsBH5ulPeZNsitMkxyNfF-zB41XkE2c'; // Tu API Key

  if (!contractAddress) {
    return NextResponse.json({ error: 'Contract address is required' }, { status: 400 });
  }

  const API_URL = 'https://api.g.alchemy.com/data/v1/mainnet/get-tokens-by-address';

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-alchemy-token': apiKey
    },
    body: JSON.stringify({
      addresses: [{
        // OJO: Este endpoint espera una dirección de BILLETERA.
        // Al pasarle la dirección del token, es probable que devuelva una lista vacía.
        address: contractAddress,
        networks: ["worldchain-mainnet"],
        withPrices: true
      }]
    })
  };

  try {
    const response = await fetch(API_URL, options);
    const data = await response.json(); // Leemos la respuesta completa

    // Log para ver la respuesta de Alchemy en la consola de Vercel
    console.log("Respuesta completa de Alchemy:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('API error from Alchemy:', data);
      return NextResponse.json({ error: 'Failed to fetch from Alchemy', details: data }, { status: response.status });
    }

    // CORRECCIÓN: Leemos la respuesta con la estructura correcta que me pasaste
    const tokenList = data?.data?.tokens;

    if (!tokenList || tokenList.length === 0) {
      console.log('Alchemy no devolvió tokens para esta dirección.');
      return NextResponse.json({ error: 'Alchemy did not return any tokens for this address' }, { status: 404 });
    }
    
    // Buscamos tu token específico en la lista que devuelve
    const tokenData = tokenList.find(t => t.tokenAddress?.toLowerCase() === contractAddress.toLowerCase());

    if (!tokenData || !tokenData.tokenPrices || !tokenData.tokenPrices.prices || tokenData.tokenPrices.prices.length === 0) {
        console.log('No se encontró información de precio para el token en la respuesta.');
        return NextResponse.json({ error: 'Price info not found in response for the specific token' }, { status: 404 });
    }

    const priceInfo = tokenData.tokenPrices.prices.find(p => p.currency === 'USD');
    const price = priceInfo ? parseFloat(priceInfo.value) : null;
    
    if (price === null) {
      console.log('No se encontró precio en USD.');
      return NextResponse.json({ error: 'USD price not found for this token' }, { status: 404 });
    }

    const formattedResponse = {
      [contractAddress.toLowerCase()]: {
        usd: price
      }
    };

    return NextResponse.json(formattedResponse);
    
  } catch (error) {
    console.error('Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
