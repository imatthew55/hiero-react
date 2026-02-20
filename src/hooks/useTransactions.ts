import { useState, useEffect } from 'react';
import { useHiero } from './useHiero';

export interface Transaction {
  transactionId: string;
  type: string;
  result: string;
  consensusTimestamp: string;
  transfers: Array<{
    account: string;
    amount: number;
  }>;
}

interface TransactionResponse {
  transaction_id: string;
  name: string;
  result: string;
  consensus_timestamp: string;
  transfers?: Array<{
    account: string;
    amount: number;
  }>;
}

interface TransferResponse {
  account: string;
  amount: number;
}

export interface UseTransactionsResult {
  transactions: Transaction[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useTransactions(accountId: string, limit: number = 10): UseTransactionsResult {
  const { mirrorNodeUrl } = useHiero();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${mirrorNodeUrl}/api/v1/transactions?account.id=${accountId}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }

      const data = await response.json();
      
      const formatted: Transaction[] = data.transactions.map((tx: TransactionResponse) => ({
        transactionId: tx.transaction_id,
        type: tx.name,
        result: tx.result,
        consensusTimestamp: tx.consensus_timestamp,
        transfers: tx.transfers?.map((t: TransferResponse) => ({
          account: t.account,
          amount: t.amount / 100_000_000,
        })) || [],
      }));

      setTransactions(formatted);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchTransactions();
    }
  }, [accountId, limit, mirrorNodeUrl]);

  return { transactions, loading, error, refetch: fetchTransactions };
}