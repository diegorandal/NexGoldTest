import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contractAddress = searchParams.get('address');

  if (!contractAddress) {
    return NextResponse.json({ error: 'Contract address is required' }, { status: 400 });
  }

  const API_URL = `https://api.coingecko.com/api/v3/simple/token_price/optimism-ethereum?contract_addresses=${contractAddress}&vs_currencies=usd`;

  try {
    const response = await fetch(API_URL, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('CoinGecko API error:', errorText);
      return NextResponse.json({ error: 'Failed to fetch from CoinGecko' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
