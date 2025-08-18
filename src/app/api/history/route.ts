import { NextResponse } from 'next/server';

const WORLDSCAN_API_URL = 'https://api.etherscan.io/api';
const API_KEY = 'PMPP1WVTI7PMJT49J5UHAQ3RN339G4KRIY';
const CHAIN_ID = '480'; 
const NEX_GOLD_ADDRESS = "0xA3502E3348B549ba45Af8726Ee316b490f308dDC";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('address');

  if (!walletAddress) {
    return NextResponse.json({ error: 'La dirección de la billetera es requerida' }, { status: 400 });
  }

  try {
    const apiUrl = new URL(WORLDSCAN_API_URL);
    apiUrl.searchParams.append('module', 'account');
    apiUrl.searchParams.append('action', 'tokentx');
    apiUrl.searchParams.append('contractaddress', NEX_GOLD_ADDRESS);
    apiUrl.searchParams.append('address', walletAddress);
    apiUrl.searchParams.append('sort', 'desc');
    apiUrl.searchParams.append('chainid', CHAIN_ID);
    apiUrl.searchParams.append('apikey', API_KEY);

    const response = await fetch(apiUrl.toString());

    if (!response.ok) {
      throw new Error('La respuesta de la red no fue válida.');
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
