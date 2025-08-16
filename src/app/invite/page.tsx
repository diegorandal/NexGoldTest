'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from "next/navigation"

export default function ReferidoPage() {
  const [refName, setRefName] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter()

  useEffect(() => {
    // Lee el parámetro 'ref' de la URL
    const ref = searchParams.get('ref');
    if (ref) {
      setRefName(ref);
      localStorage.setItem('referrer', ref);
      console.log('Referrer:', ref);
    }

    router.push("/");

  }, [searchParams]);

  return (
    <div>
      {refName && <p>Has sido referido por: {refName}</p>}
      {!refName && <p>No se ha encontrado información del referente.</p>}
    </div>
  );
}