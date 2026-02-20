import React, { createContext, ReactNode } from 'react';
import type { NetworkType } from '../types';

export interface HieroConfig {
  network: NetworkType;
  mirrorNodeUrl?: string;
}

export interface HieroProviderProps {
  children: ReactNode;
  network: NetworkType;
  mirrorNodeUrl?: string;
}

export interface HieroContextValue {
  network: NetworkType;
  mirrorNodeUrl: string;
}

export const HieroContext = createContext<HieroContextValue | null>(null);

export function HieroProvider({ children, network, mirrorNodeUrl }: HieroProviderProps) {
  const defaultMirrorUrl = `https://${network}.mirrornode.hedera.com`;
  
  const value: HieroContextValue = {
    network,
    mirrorNodeUrl: mirrorNodeUrl || defaultMirrorUrl,
  };

  return (
    <HieroContext.Provider value={value}>
      {children}
    </HieroContext.Provider>
  );
}