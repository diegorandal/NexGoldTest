'use client';

import { TabItem, Tabs } from '@worldcoin/mini-apps-ui-kit-react';
import { Bank, Home, User } from 'iconoir-react';
import { useState } from 'react';

export const Navigation = () => {
  const [value, setValue] = useState('Home');

  return (
    <div
      style={{
        '--w-color-background-secondary': '#000000',
        '--w-color-text-secondary': '#D4AF37',
        '--w-color-primary': '#FFD700',
      }}
    >
      <Tabs value={value} onValueChange={setValue}>
        <TabItem value="home" icon={<Home />} label="Home" />
        <TabItem value="wallet" icon={<Bank />} label="Wallet" />
        <TabItem value="profile" icon={<User />} label="Profile" />
      </Tabs>
    </div>
  );
};
