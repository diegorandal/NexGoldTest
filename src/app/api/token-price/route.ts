import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contractAddress = searchParams.get('address');

  if (!contractAddress) {
    return NextResponse.json({ error: 'Contract address is required' }, { status: 400 });
  }

  // Usamos la API de DEX Screener, que es la fuente correcta para esto.
  const API_URL = `https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`;

  try {
    const response = await fetch(API_URL, {
      next: { revalidate: 60 }, // Cache de 1 minuto para no sobrecargar la API
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('DEX Screener API error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch from DEX Screener' }, { status: response.status });
    }

    const data = await response.json();
    
    // Buscamos el primer par de trading que tenga un precio en USD
    const pairWithPrice = data.pairs?.find(p => p.priceUsd);

    if (!pairWithPrice) {
      return NextResponse.json({ error: 'Price not found for this token' }, { status: 404 });
    }
    
    const price = parseFloat(pairWithPrice.priceUsd);

    // Adaptamos la respuesta al formato que tu frontend ya espera
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
