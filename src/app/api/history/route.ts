// app/api/history/route.ts

import { NextResponse } from 'next/server';

const WORLDSCAN_API_URL = 'https://www.worldscan.org/api';
const NEX_GOLD_ADDRESS = "0xA3502E3348B549ba45Af8726Ee316b490f308dDC";
const API_KEY = 'ECJ53PB4AE2A7QXR1ZH4VPJH4Z8TG9UX8B';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('address');

  if (!walletAddress) {
    return NextResponse.json({ error: 'La dirección de la billetera es requerida' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${WORLDSCAN_API_URL}?module=account&action=tokentx&contractaddress=${NEX_GOLD_ADDRESS}&address=${walletAddress}&sort=desc&apikey=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error('La respuesta de la red no fue válida.');
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
