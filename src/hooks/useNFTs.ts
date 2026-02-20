import { useState, useEffect } from 'react';
import { useHiero } from './useHiero';

export interface NFT {
  tokenId: string;
  serialNumber: number;
  metadata: string;
}

export interface UseNFTsResult {
  nfts: NFT[];
  loading: boolean;
  error: Error | null;
}

export function useNFTs(accountId: string): UseNFTsResult {
  const { mirrorNodeUrl } = useHiero();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchNFTs() {
      try {
        setLoading(true);
        const response = await fetch(
          `${mirrorNodeUrl}/api/v1/accounts/${accountId}/nfts`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch NFTs: ${response.statusText}`);
        }

        const data = await response.json();

        const formatted: NFT[] = data.nfts.map((nft: any) => ({
          tokenId: nft.token_id,
          serialNumber: nft.serial_number,
          metadata: nft.metadata ? atob(nft.metadata) : '',
        }));

        setNfts(formatted);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    if (accountId) {
      fetchNFTs();
    }
  }, [accountId, mirrorNodeUrl]);

  return { nfts, loading, error };
}