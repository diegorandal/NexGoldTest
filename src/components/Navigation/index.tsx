'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
// NOTA: He cambiado la librería de íconos a lucide-react, que es muy popular y consistente.
// Si prefieres usar iconoir-react, solo cambia esta línea.
import { Home, Wallet, Gamepad, Trophy, Info } from 'iconoir-react';

const navItems = [
  { href: '/Home', label: 'Home', icon: Home },
  { href: '/Wallet', label: 'Wallet', icon: Wallet },
  { href: '/Game', label: 'Game', icon: Gamepad },
  { href: '/Ranking', label: 'Ranking', icon: Trophy }, // Usé un ícono de trofeo para Ranking
  { href: '/Info', label: 'Info', icon: Info },
];

export default function Navigation() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={clsx(
        'fixed bottom-4 left-4 right-4 z-40 rounded-2xl transition-transform duration-300',
        // 1. Cambiado el fondo a negro sólido
        'bg-black border border-yellow-500/20', 
        visible ? 'translate-y-0' : 'translate-y-24'
      )}
    >
      <nav className="flex items-center justify-around h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex flex-col items-center justify-center text-xs font-medium transition-all duration-200',
                // 2. Cambiados los colores a tonos dorados
                isActive
                  ? 'text-amber-300 scale-110' // Color dorado brillante para el activo
                  : 'text-yellow-600 hover:text-yellow-400' // Dorado oscuro para inactivos
              )}
            >
              <Icon className="w-6 h-6 mb-1" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
