import React, { useState } from 'react';
import { PoolPayWidget, PoolPayModal } from './PoolPayWidget';

export const HeaderIntegration: React.FC = () => {
  const [isPoolPayOpen, setIsPoolPayOpen] = useState(false);

  return (
    <>
      <PoolPayWidget onOpen={() => setIsPoolPayOpen(true)} />
      <PoolPayModal 
        isOpen={isPoolPayOpen} 
        onClose={() => setIsPoolPayOpen(false)} 
      />
    </>
  );
};