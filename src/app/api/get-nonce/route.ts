import { NextResponse } from 'next/server';
import { hashNonce } from '@/auth/wallet/client-helpers';

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
