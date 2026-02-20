import { useState, useEffect } from 'react';
import { useHiero } from './useHiero';
import type { AccountInfo } from '../types';

export function useAccount(accountId: string): AccountInfo {
  const { mirrorNodeUrl } = useHiero();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAccount() {
      try {
        setLoading(true);
        const response = await fetch(`${mirrorNodeUrl}/api/v1/accounts/${accountId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch account: ${response.statusText}`);
        }
        
        const data = await response.json();
        // Balance is in tinybars, convert to HBAR
        setBalance(data.balance.balance / 100_000_000);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    if (accountId) {
      fetchAccount();
    }
  }, [accountId, mirrorNodeUrl]);

  return { accountId, balance, loading, error };
}