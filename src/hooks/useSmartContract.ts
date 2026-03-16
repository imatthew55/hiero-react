import { useState, useEffect, useCallback } from 'react';
import { useHiero } from './useHiero';

export interface ContractInfo {
  contractId: string;
  evmAddress: string;
  fileId: string | null;
  memo: string;
  adminKey: string | null;
  autoRenewPeriod: number;
  expirationTimestamp: string | null;
  deleted: boolean;
  bytecodeHash: string | null;
}

export interface UseContractResult {
  contract: ContractInfo | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface ContractResponse {
  contract_id: string;
  evm_address: string;
  file_id?: string;
  memo?: string;
  admin_key?: { key: string };
  auto_renew_period?: number;
  expiration_timestamp?: string;
  deleted: boolean;
  bytecode_hash?: string;
}

/**
 * Fetch metadata for a deployed smart contract by its contract ID (e.g. "0.0.12345")
 * or EVM address.
 */
export function useContract(contractId: string): UseContractResult {
  const { mirrorNodeUrl } = useHiero();
  const [contract, setContract] = useState<ContractInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchContract = useCallback(async () => {
    if (!contractId) return;
    try {
      setLoading(true);
      const response = await fetch(`${mirrorNodeUrl}/api/v1/contracts/${contractId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch contract: ${response.statusText}`);
      }
      const data: ContractResponse = await response.json();
      setContract({
        contractId: data.contract_id,
        evmAddress: data.evm_address,
        fileId: data.file_id ?? null,
        memo: data.memo ?? '',
        adminKey: data.admin_key?.key ?? null,
        autoRenewPeriod: data.auto_renew_period ?? 0,
        expirationTimestamp: data.expiration_timestamp ?? null,
        deleted: data.deleted,
        bytecodeHash: data.bytecode_hash ?? null,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [contractId, mirrorNodeUrl]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  return { contract, loading, error, refetch: fetchContract };
}

export interface ContractCallResult {
  result: string;
  gasUsed: number;
  errorMessage: string | null;
}

export interface UseContractCallsResult {
  calls: ContractCallResult[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface ContractResultResponse {
  call_result: string;
  gas_used: number;
  error_message?: string;
}

/**
 * Fetch historical call results for a contract, useful for reading return values
 * from past contract executions without needing a signer.
 */
export function useContractCalls(contractId: string, limit: number = 10): UseContractCallsResult {
  const { mirrorNodeUrl } = useHiero();
  const [calls, setCalls] = useState<ContractCallResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCalls = useCallback(async () => {
    if (!contractId) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${mirrorNodeUrl}/api/v1/contracts/${contractId}/results?limit=${limit}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch contract results: ${response.statusText}`);
      }
      const data = await response.json();
      const formatted: ContractCallResult[] = (
        data.results ?? []
      ).map((r: ContractResultResponse) => ({
        result: r.call_result,
        gasUsed: r.gas_used,
        errorMessage: r.error_message ?? null,
      }));
      setCalls(formatted);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [contractId, limit, mirrorNodeUrl]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  return { calls, loading, error, refetch: fetchCalls };
}

export interface ContractLog {
  address: string;
  blockHash: string;
  blockNumber: number;
  data: string;
  topics: string[];
  transactionHash: string;
}

export interface UseContractLogsResult {
  logs: ContractLog[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface ContractLogResponse {
  address: string;
  block_hash: string;
  block_number: number;
  data: string;
  topics: string[];
  transaction_hash: string;
}

/**
 * Fetch emitted event logs for a smart contract.
 */
export function useContractLogs(contractId: string, limit: number = 25): UseContractLogsResult {
  const { mirrorNodeUrl } = useHiero();
  const [logs, setLogs] = useState<ContractLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!contractId) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${mirrorNodeUrl}/api/v1/contracts/${contractId}/results/logs?limit=${limit}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch contract logs: ${response.statusText}`);
      }
      const data = await response.json();
      const formatted: ContractLog[] = (data.logs ?? []).map((l: ContractLogResponse) => ({
        address: l.address,
        blockHash: l.block_hash,
        blockNumber: l.block_number,
        data: l.data,
        topics: l.topics,
        transactionHash: l.transaction_hash,
      }));
      setLogs(formatted);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [contractId, limit, mirrorNodeUrl]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, error, refetch: fetchLogs };
}