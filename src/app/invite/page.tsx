'use client'; // <-- Esto es necesario para usar hooks

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ReferidoPage() {
  const [refName, setRefName] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Lee el parámetro 'ref' de la URL
    const ref = searchParams.get('ref');
    if (ref) {
      setRefName(ref);
    }
  }, [searchParams]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>¡Gracias por unirte!</h1>
      {refName && (
        <p>
          Has sido referido por: <strong>{refName}</strong>
        </p>
      )}
      {!refName && (
        <p>
          Si has llegado aquí por un enlace, algo no ha funcionado bien.
        </p>
      )}
    </div>
  );
}