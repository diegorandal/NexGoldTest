'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from "next/navigation";

export default function ReferidoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Lee el parámetro 'ref' de la URL
    const ref = searchParams.get('ref');
    if (ref) {
      // Guarda el referente en el almacenamiento local
      localStorage.setItem('referrer', ref);
    }
    
    // Redirige inmediatamente a la página principal
    router.push("/");

  }, [searchParams, router]);

  // Devuelve null para evitar que se renderice cualquier contenido
  return null;
}