import { NextResponse } from 'next/server';
import { hashNonce } from '@/auth/wallet/client-helpers'; // Asegurate que la ruta a tu helper sea correcta

// Esta función se ejecutará cuando tu app llame a /api/auth/nonce
export async function GET() {
  try {
 
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

 
    const signedNonce = hashNonce({ nonce });

    return NextResponse.json({ nonce, signedNonce });
    
  } catch (error) {
    console.error('Error al generar el nonce:', error);
    return NextResponse.json({ error: 'No se pudo generar el nonce.' }, { status: 500 });
  }
}
