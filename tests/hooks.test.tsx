import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { HieroProvider } from '../src/providers/HieroProvider';
import { useHiero } from '../src/hooks/useHiero';

// Wrapper component for hooks that need HieroProvider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <HieroProvider network="testnet">{children}</HieroProvider>
);

describe('useHiero', () => {
  it('returns context when inside provider', () => {
    const { result } = renderHook(() => useHiero(), { wrapper });
    
    expect(result.current.network).toBe('testnet');
    expect(result.current.mirrorNodeUrl).toBe('https://testnet.mirrornode.hedera.com');
  });

  it('throws error when outside provider', () => {
    expect(() => {
      renderHook(() => useHiero());
    }).toThrow('useHiero must be used within a HieroProvider');
  });
});

describe('HieroProvider', () => {
  it('uses custom mirror node URL when provided', () => {
    const customWrapper = ({ children }: { children: React.ReactNode }) => (
      <HieroProvider network="mainnet" mirrorNodeUrl="https://custom.mirror.com">
        {children}
      </HieroProvider>
    );

    const { result } = renderHook(() => useHiero(), { wrapper: customWrapper });
    
    expect(result.current.mirrorNodeUrl).toBe('https://custom.mirror.com');
  });
});