import { useState, useEffect } from 'react';
import { useHiero } from './useHiero';

export interface Token {
  tokenId: string;
  symbol: string;
  balance: number;
  decimals: number;
}

interface TokenResponse {
  token_id: string;
  symbol?: string;
  balance: number;
  decimals?: number;
}

export interface UseTokensResult {
  tokens: Token[];
  loading: boolean;
  error: Error | null;
}

export function useTokens(accountId: string): UseTokensResult {
  const { mirrorNodeUrl } = useHiero();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTokens() {
      try {
        setLoading(true);
        const response = await fetch(
          `${mirrorNodeUrl}/api/v1/accounts/${accountId}/tokens`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch tokens: ${response.statusText}`);
        }

        const data = await response.json();

        const formatted: Token[] = data.tokens.map((t: TokenResponse) => ({
          tokenId: t.token_id,
          symbol: t.symbol || 'Unknown',
          balance: t.balance,
          decimals: t.decimals || 0,
        }));

        setTokens(formatted);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    if (accountId) {
      fetchTokens();
    }
  }, [accountId, mirrorNodeUrl]);

  return { tokens, loading, error };
}