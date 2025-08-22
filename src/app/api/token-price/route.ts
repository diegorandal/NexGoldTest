import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contractAddress = searchParams.get('address');
  
  // Usamos la API Key que proporcionaste
  const apiKey = '4lsBH5ulPeZNsitMkxyNfF-zB41XkE2c';

  if (!contractAddress) {
    return NextResponse.json({ error: 'Contract address is required' }, { status: 400 });
  }

  const API_URL = `https://opt-mainnet.g.alchemy.com/v2/${apiKey}`;

  // Opciones para la solicitud fetch
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "alchemy_getTokenMetadata",
      params: [contractAddress]
    })
  };

  try {
    const response = await fetch(API_URL, options);

    if (!response.ok) {
      // Si la respuesta no es exitosa, intentamos leer el error
      const errorData = await response.json();
      console.error('API response error from Alchemy:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch from Alchemy', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    const price = data.result.price;

    if (price == null) {
      return NextResponse.json({ error: 'Price not found for this token' }, { status: 404 });
    }

    // Adaptamos la respuesta al formato que espera el frontend
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
