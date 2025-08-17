'use client';

import { TabItem, Tabs } from '@worldcoin/mini-apps-ui-kit-react';
import { Home, User, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const Navigation = () => {
  const [value, setValue] = useState('Home');
  const router = useRouter();

  const handleNavigationChange = (newValue: string) => {
    setValue(newValue);
    
    // Corregido: Se quitó .toLowerCase() para que coincida con tus carpetas "Home" y "Wallet"
    router.push(`/${newValue}`); 
  };

  return (
    <div
      style={{
        '--w-color-background-secondary': '#000000',
        '--w-color-text-secondary': '#D4AF37',
        '--w-color-primary': '#FFD700',
      }}
    >
      <Tabs value={value} onValueChange={handleNavigationChange}>
        <TabItem value="Home" icon={<Home />} label="Home" />
        <TabItem value="Wallet" icon={<Wallet />} label="Wallet" />
        <TabItem value="Profile" icon={<User />} label="Profile" />
      </Tabs>
    </div>
  );
};
