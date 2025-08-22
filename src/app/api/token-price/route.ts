import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contractAddress = searchParams.get('address');
  const apiKey = '4lsBH5ulPeZNsitMkxyNfF-zB41XkE2c';

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
        address: contractAddress,        
        networks: ["worldchain-mainnet"],
        withPrices: true
      }]
    })
  };

  try {
    const response = await fetch(API_URL, options);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API error from Alchemy:', errorData);
      return NextResponse.json({ error: 'Failed to fetch from Alchemy', details: errorData }, { status: response.status });
    }

    const data = await response.json();
    
  
    const tokenData = data.addresses[0]?.tokenPrices?.find(t => t.address.toLowerCase() === contractAddress.toLowerCase());
    
    if (!tokenData || !tokenData.prices || tokenData.prices.length === 0) {
        return NextResponse.json({ error: 'Token or price info not found in response' }, { status: 404 });
    }

    const priceInfo = tokenData.prices.find(p => p.currency === 'USD');
    const price = priceInfo ? parseFloat(priceInfo.value) : null;
    
    if (price === null) {
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
