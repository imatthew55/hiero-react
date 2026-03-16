import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';

// ─── adjust these imports to match your project's actual paths ───────────────
import { HieroProvider } from '../src/providers/HieroProvider';
import { useHiero } from '../src/hooks/useHiero';
import { useAccount } from '../src/hooks/useAccount';
import { useTransactions } from '../src/hooks/useTransactions';
import { useTokens } from '../src/hooks/useTokens';
import { useNFTs } from '../src/hooks/useNFTs';
import { useFile, useFileContents } from '../src/hooks/useFile';
import { useContract, useContractCalls, useContractLogs } from '../src/hooks/useSmartContract';
import { useTopic, useTopicMessages } from '../src/hooks/useTopics';

// ─── shared wrappers ─────────────────────────────────────────────────────────

const testnetWrapper = ({ children }: { children: React.ReactNode }) => (
  <HieroProvider network="testnet">{children}</HieroProvider>
);

const mainnetWrapper = ({ children }: { children: React.ReactNode }) => (
  <HieroProvider network="mainnet">{children}</HieroProvider>
);

const customMirrorWrapper = ({ children }: { children: React.ReactNode }) => (
  <HieroProvider network="mainnet" mirrorNodeUrl="https://custom.mirror.example.com">
    {children}
  </HieroProvider>
);

// ─── helpers ─────────────────────────────────────────────────────────────────

function mockFetch(body: unknown, ok = true, statusText = 'OK') {
  return vi.fn().mockResolvedValue({
    ok,
    statusText,
    json: async () => body,
  });
}

function mockFetchNetworkError(message = 'Network failure') {
  return vi.fn().mockRejectedValue(new Error(message));
}

// ─── useHiero ────────────────────────────────────────────────────────────────

describe('useHiero', () => {
  it('provides correct mirror URL for testnet', () => {
    const { result } = renderHook(() => useHiero(), { wrapper: testnetWrapper });
    expect(result.current.network).toBe('testnet');
    expect(result.current.mirrorNodeUrl).toBe('https://testnet.mirrornode.hedera.com');
  });

  it('provides correct mirror URL for mainnet', () => {
    const { result } = renderHook(() => useHiero(), { wrapper: mainnetWrapper });
    expect(result.current.network).toBe('mainnet');
    expect(result.current.mirrorNodeUrl).toBe('https://mainnet.mirrornode.hedera.com');
  });

  it('overrides mirror URL when mirrorNodeUrl prop is provided', () => {
    const { result } = renderHook(() => useHiero(), { wrapper: customMirrorWrapper });
    expect(result.current.mirrorNodeUrl).toBe('https://custom.mirror.example.com');
  });

  it('throws a descriptive error when used outside HieroProvider', () => {
    expect(() => renderHook(() => useHiero())).toThrow(/HieroProvider|must be used within/);
  });
});

// ─── useAccount ──────────────────────────────────────────────────────────────

describe('useAccount', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('starts in loading state', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    const { result } = renderHook(() => useAccount('0.0.1234'), { wrapper: testnetWrapper });
    expect(result.current.loading).toBe(true);
    expect(result.current.balance).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('converts tinybars to HBAR correctly', async () => {
    vi.stubGlobal('fetch', mockFetch({ balance: { balance: 100_000_000 } }));
    const { result } = renderHook(() => useAccount('0.0.1234'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.balance).toBe(1);
  });

  it('handles fractional HBAR amounts', async () => {
    vi.stubGlobal('fetch', mockFetch({ balance: { balance: 150_000_000 } }));
    const { result } = renderHook(() => useAccount('0.0.1234'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.balance).toBe(1.5);
  });

  it('handles zero balance', async () => {
    vi.stubGlobal('fetch', mockFetch({ balance: { balance: 0 } }));
    const { result } = renderHook(() => useAccount('0.0.1234'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.balance).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('sets error on HTTP error response', async () => {
    vi.stubGlobal('fetch', mockFetch({}, false, 'Not Found'));
    const { result } = renderHook(() => useAccount('0.0.9999'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toMatch(/Not Found/);
  });

  it('sets error on network failure', async () => {
    vi.stubGlobal('fetch', mockFetchNetworkError('Network failure'));
    const { result } = renderHook(() => useAccount('0.0.1234'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe('Network failure');
  });

  it('calls the correct Mirror Node endpoint', async () => {
    const fetchMock = mockFetch({ balance: { balance: 0 } });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useAccount('0.0.5678'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://testnet.mirrornode.hedera.com/api/v1/accounts/0.0.5678'
    );
  });

  it('re-fetches when accountId changes', async () => {
    const fetchMock = mockFetch({ balance: { balance: 100_000_000 } });
    vi.stubGlobal('fetch', fetchMock);
    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useAccount(id),
      { wrapper: testnetWrapper, initialProps: { id: '0.0.1111' } }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    rerender({ id: '0.0.2222' });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain('0.0.2222');
  });

  it('returns the accountId passed in', async () => {
    vi.stubGlobal('fetch', mockFetch({ balance: { balance: 0 } }));
    const { result } = renderHook(() => useAccount('0.0.42'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.accountId).toBe('0.0.42');
  });
});

// ─── useTransactions ─────────────────────────────────────────────────────────

describe('useTransactions', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('returns formatted transactions with camelCase fields', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        transactions: [
          {
            transaction_id: '0.0.1234@1700000000.000000000',
            name: 'CRYPTOTRANSFER',
            result: 'SUCCESS',
            consensus_timestamp: '1700000000.000000000',
            transfers: [
              { account: '0.0.1234', amount: -100_000_000 },
              { account: '0.0.5678', amount: 100_000_000 },
            ],
          },
        ],
      })
    );

    const { result } = renderHook(() => useTransactions('0.0.1234'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const tx = result.current.transactions[0];
    expect(tx.transactionId).toBe('0.0.1234@1700000000.000000000');
    expect(tx.type).toBe('CRYPTOTRANSFER');
    expect(tx.result).toBe('SUCCESS');
    expect(tx.consensusTimestamp).toBe('1700000000.000000000');
    expect(tx.transfers).toHaveLength(2);
    expect(tx.transfers[0].amount).toBe(-1);
    expect(tx.transfers[1].amount).toBe(1);
  });

  it('defaults limit to 10', async () => {
    const fetchMock = mockFetch({ transactions: [] });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useTransactions('0.0.1234'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock.mock.calls[0][0]).toContain('limit=10');
  });

  it('passes custom limit to URL', async () => {
    const fetchMock = mockFetch({ transactions: [] });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(
      () => useTransactions('0.0.1234', 50),
      { wrapper: testnetWrapper }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock.mock.calls[0][0]).toContain('limit=50');
  });

  it('handles transactions with no transfers', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        transactions: [
          {
            transaction_id: '0.0.1@1',
            name: 'CONSENSUSSUBMITMESSAGE',
            result: 'SUCCESS',
            consensus_timestamp: '1700000001.000000000',
          },
        ],
      })
    );
    const { result } = renderHook(() => useTransactions('0.0.1'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.transactions[0].transfers).toEqual([]);
  });

  it('exposes refetch function that re-requests data', async () => {
    const fetchMock = mockFetch({ transactions: [] });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useTransactions('0.0.1234'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => { result.current.refetch(); });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('sets error on HTTP failure', async () => {
    vi.stubGlobal('fetch', mockFetch({}, false, 'Internal Server Error'));
    const { result } = renderHook(() => useTransactions('0.0.1234'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.transactions).toEqual([]);
  });
});

// ─── useTokens ───────────────────────────────────────────────────────────────

describe('useTokens', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('returns formatted token list', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        tokens: [
          { token_id: '0.0.555', symbol: 'FOO', balance: 1000, decimals: 6 },
          { token_id: '0.0.556', symbol: 'BAR', balance: 500, decimals: 2 },
        ],
      })
    );
    const { result } = renderHook(() => useTokens('0.0.1234'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tokens).toHaveLength(2);
    expect(result.current.tokens[0]).toEqual({
      tokenId: '0.0.555',
      symbol: 'FOO',
      balance: 1000,
      decimals: 6,
    });
  });

  it('defaults symbol to "Unknown" when missing from response', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({ tokens: [{ token_id: '0.0.999', balance: 10 }] })
    );
    const { result } = renderHook(() => useTokens('0.0.1234'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tokens[0].symbol).toBe('Unknown');
  });

  it('defaults decimals to 0 when missing from response', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({ tokens: [{ token_id: '0.0.999', balance: 10 }] })
    );
    const { result } = renderHook(() => useTokens('0.0.1234'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tokens[0].decimals).toBe(0);
  });

  it('returns empty array when account holds no tokens', async () => {
    vi.stubGlobal('fetch', mockFetch({ tokens: [] }));
    const { result } = renderHook(() => useTokens('0.0.1234'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tokens).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('calls the correct endpoint', async () => {
    const fetchMock = mockFetch({ tokens: [] });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useTokens('0.0.9876'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://testnet.mirrornode.hedera.com/api/v1/accounts/0.0.9876/tokens'
    );
  });

  it('sets error on HTTP failure', async () => {
    vi.stubGlobal('fetch', mockFetch({}, false, 'Forbidden'));
    const { result } = renderHook(() => useTokens('0.0.1234'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toMatch(/Forbidden/);
  });
});

// ─── useNFTs ─────────────────────────────────────────────────────────────────

describe('useNFTs', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('decodes base64 metadata to a plain string', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        nfts: [{ token_id: '0.0.777', serial_number: 1, metadata: btoa('ipfs://QmTest') }],
      })
    );
    const { result } = renderHook(() => useNFTs('0.0.1234'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.nfts[0].metadata).toBe('ipfs://QmTest');
  });

  it('returns empty string when metadata is absent', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({ nfts: [{ token_id: '0.0.777', serial_number: 2 }] })
    );
    const { result } = renderHook(() => useNFTs('0.0.1234'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.nfts[0].metadata).toBe('');
  });

  it('maps serial_number to serialNumber', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({ nfts: [{ token_id: '0.0.888', serial_number: 42 }] })
    );
    const { result } = renderHook(() => useNFTs('0.0.1234'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.nfts[0].serialNumber).toBe(42);
  });

  it('returns multiple NFTs', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        nfts: [
          { token_id: '0.0.100', serial_number: 1, metadata: btoa('a') },
          { token_id: '0.0.100', serial_number: 2, metadata: btoa('b') },
          { token_id: '0.0.101', serial_number: 1, metadata: btoa('c') },
        ],
      })
    );
    const { result } = renderHook(() => useNFTs('0.0.1234'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.nfts).toHaveLength(3);
  });

  it('sets error on network failure', async () => {
    vi.stubGlobal('fetch', mockFetchNetworkError('timeout'));
    const { result } = renderHook(() => useNFTs('0.0.1234'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe('timeout');
  });
});

// ─── useFile ─────────────────────────────────────────────────────────────────

describe('useFile', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('returns all mapped file fields', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        file_id: '0.0.1001',
        size: 1024,
        expiry_timestamp: '1800000000.000000000',
        deleted: false,
        memo: 'contract bytecode',
        keys: [{ key: 'deadbeef01' }, { key: 'deadbeef02' }],
      })
    );
    const { result } = renderHook(() => useFile('0.0.1001'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.file).toEqual({
      fileId: '0.0.1001',
      size: 1024,
      expirationTimestamp: '1800000000.000000000',
      deleted: false,
      memo: 'contract bytecode',
      keys: ['deadbeef01', 'deadbeef02'],
    });
  });

  it('returns null expirationTimestamp when absent', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({ file_id: '0.0.1002', size: 0, deleted: false })
    );
    const { result } = renderHook(() => useFile('0.0.1002'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.file?.expirationTimestamp).toBeNull();
  });

  it('returns empty keys array when absent', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({ file_id: '0.0.1003', size: 0, deleted: false })
    );
    const { result } = renderHook(() => useFile('0.0.1003'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.file?.keys).toEqual([]);
  });

  it('calls the correct endpoint', async () => {
    const fetchMock = mockFetch({ file_id: '0.0.1001', size: 0, deleted: false });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useFile('0.0.1001'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://testnet.mirrornode.hedera.com/api/v1/files/0.0.1001'
    );
  });

  it('exposes working refetch', async () => {
    const fetchMock = mockFetch({ file_id: '0.0.1001', size: 0, deleted: false });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useFile('0.0.1001'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => { result.current.refetch(); });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('sets error on 404', async () => {
    vi.stubGlobal('fetch', mockFetch({}, false, 'Not Found'));
    const { result } = renderHook(() => useFile('0.0.9999'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toMatch(/Not Found/);
    expect(result.current.file).toBeNull();
  });
});

describe('useFileContents', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('returns content and encoding', async () => {
    vi.stubGlobal('fetch', mockFetch({ content: 'aGVsbG8=' }));
    const { result } = renderHook(() => useFileContents('0.0.1001'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.contents?.content).toBe('aGVsbG8=');
    expect(result.current.contents?.encoding).toBe('base64');
    expect(result.current.contents?.fileId).toBe('0.0.1001');
  });

  it('returns empty content string when absent', async () => {
    vi.stubGlobal('fetch', mockFetch({}));
    const { result } = renderHook(() => useFileContents('0.0.1001'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.contents?.content).toBe('');
  });

  it('calls the /data sub-endpoint', async () => {
    const fetchMock = mockFetch({ content: '' });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useFileContents('0.0.1001'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock.mock.calls[0][0]).toContain('/files/0.0.1001/data');
  });

  it('sets error on HTTP failure', async () => {
    vi.stubGlobal('fetch', mockFetch({}, false, 'Gone'));
    const { result } = renderHook(() => useFileContents('0.0.1001'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toMatch(/Gone/);
  });
});

// ─── useContract ─────────────────────────────────────────────────────────────

describe('useContract', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('returns all mapped contract fields', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        contract_id: '0.0.2001',
        evm_address: '0x000000000000000000000000000000000000007d',
        file_id: '0.0.1500',
        memo: 'My DeFi contract',
        admin_key: { key: 'abcdef' },
        auto_renew_period: 7776000,
        expiration_timestamp: '1900000000.000000000',
        deleted: false,
        bytecode_hash: '0xhashvalue',
      })
    );
    const { result } = renderHook(() => useContract('0.0.2001'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.contract).toEqual({
      contractId: '0.0.2001',
      evmAddress: '0x000000000000000000000000000000000000007d',
      fileId: '0.0.1500',
      memo: 'My DeFi contract',
      adminKey: 'abcdef',
      autoRenewPeriod: 7776000,
      expirationTimestamp: '1900000000.000000000',
      deleted: false,
      bytecodeHash: '0xhashvalue',
    });
  });

  it('returns null for optional fields when absent', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({ contract_id: '0.0.2002', evm_address: '0xabc', deleted: false })
    );
    const { result } = renderHook(() => useContract('0.0.2002'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.contract?.fileId).toBeNull();
    expect(result.current.contract?.adminKey).toBeNull();
    expect(result.current.contract?.bytecodeHash).toBeNull();
    expect(result.current.contract?.expirationTimestamp).toBeNull();
  });

  it('calls the correct endpoint', async () => {
    const fetchMock = mockFetch({ contract_id: '0.0.2001', evm_address: '0x', deleted: false });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useContract('0.0.2001'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://testnet.mirrornode.hedera.com/api/v1/contracts/0.0.2001'
    );
  });

  it('sets error and returns null contract on failure', async () => {
    vi.stubGlobal('fetch', mockFetch({}, false, 'Not Found'));
    const { result } = renderHook(() => useContract('0.0.9999'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.contract).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useContractCalls', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('returns mapped call results', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        results: [
          { call_result: '0x0000001', gas_used: 21000 },
          { call_result: '0x0000002', gas_used: 45000, error_message: 'revert' },
        ],
      })
    );
    const { result } = renderHook(
      () => useContractCalls('0.0.2001'),
      { wrapper: testnetWrapper }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.calls).toHaveLength(2);
    expect(result.current.calls[0]).toEqual({
      result: '0x0000001',
      gasUsed: 21000,
      errorMessage: null,
    });
    expect(result.current.calls[1].errorMessage).toBe('revert');
  });

  it('defaults limit to 10', async () => {
    const fetchMock = mockFetch({ results: [] });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(
      () => useContractCalls('0.0.2001'),
      { wrapper: testnetWrapper }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock.mock.calls[0][0]).toContain('limit=10');
  });

  it('passes custom limit to URL', async () => {
    const fetchMock = mockFetch({ results: [] });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(
      () => useContractCalls('0.0.2001', 99),
      { wrapper: testnetWrapper }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock.mock.calls[0][0]).toContain('limit=99');
  });

  it('handles empty results gracefully', async () => {
    vi.stubGlobal('fetch', mockFetch({ results: [] }));
    const { result } = renderHook(
      () => useContractCalls('0.0.2001'),
      { wrapper: testnetWrapper }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.calls).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});

describe('useContractLogs', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('returns mapped log fields', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        logs: [
          {
            address: '0xcontract',
            block_hash: '0xblockhash',
            block_number: 1234567,
            data: '0xdata',
            topics: ['0xtopic1', '0xtopic2'],
            transaction_hash: '0xtxhash',
          },
        ],
      })
    );
    const { result } = renderHook(
      () => useContractLogs('0.0.2001'),
      { wrapper: testnetWrapper }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.logs[0]).toEqual({
      address: '0xcontract',
      blockHash: '0xblockhash',
      blockNumber: 1234567,
      data: '0xdata',
      topics: ['0xtopic1', '0xtopic2'],
      transactionHash: '0xtxhash',
    });
  });

  it('defaults limit to 25', async () => {
    const fetchMock = mockFetch({ logs: [] });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(
      () => useContractLogs('0.0.2001'),
      { wrapper: testnetWrapper }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock.mock.calls[0][0]).toContain('limit=25');
  });

  it('handles empty topics array', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        logs: [{
          address: '0x1',
          block_hash: '0x2',
          block_number: 1,
          data: '0x',
          topics: [],
          transaction_hash: '0x3',
        }],
      })
    );
    const { result } = renderHook(
      () => useContractLogs('0.0.2001'),
      { wrapper: testnetWrapper }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.logs[0].topics).toEqual([]);
  });

  it('exposes working refetch', async () => {
    const fetchMock = mockFetch({ logs: [] });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(
      () => useContractLogs('0.0.2001'),
      { wrapper: testnetWrapper }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { result.current.refetch(); });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

// ─── useTopic ────────────────────────────────────────────────────────────────

describe('useTopic', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('returns all mapped topic fields', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        topic_id: '0.0.3001',
        memo: 'audit log',
        running_hash: 'abc123',
        sequence_number: 99,
        admin_key: { key: 'adminkey' },
        submit_key: { key: 'submitkey' },
        auto_renew_period: 7776000,
        expiration_timestamp: '1900000000.000000000',
        deleted: false,
      })
    );
    const { result } = renderHook(() => useTopic('0.0.3001'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.topic).toEqual({
      topicId: '0.0.3001',
      memo: 'audit log',
      runningHash: 'abc123',
      sequenceNumber: 99,
      adminKey: 'adminkey',
      submitKey: 'submitkey',
      autoRenewPeriod: 7776000,
      expirationTimestamp: '1900000000.000000000',
      deleted: false,
    });
  });

  it('returns null for optional key fields when absent', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({ topic_id: '0.0.3002', running_hash: 'xyz', sequence_number: 0 })
    );
    const { result } = renderHook(() => useTopic('0.0.3002'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.topic?.adminKey).toBeNull();
    expect(result.current.topic?.submitKey).toBeNull();
    expect(result.current.topic?.expirationTimestamp).toBeNull();
  });

  it('defaults deleted to false when absent', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({ topic_id: '0.0.3003', running_hash: 'xyz', sequence_number: 0 })
    );
    const { result } = renderHook(() => useTopic('0.0.3003'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.topic?.deleted).toBe(false);
  });

  it('calls the correct endpoint', async () => {
    const fetchMock = mockFetch({ topic_id: '0.0.3001', running_hash: '', sequence_number: 0 });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useTopic('0.0.3001'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.3001'
    );
  });

  it('sets error and returns null topic on failure', async () => {
    vi.stubGlobal('fetch', mockFetch({}, false, 'Not Found'));
    const { result } = renderHook(() => useTopic('0.0.9999'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.topic).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useTopicMessages', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('decodes base64 message content', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        messages: [{
          consensus_timestamp: '1700000001.000000000',
          message: btoa('Hello HCS world'),
          sequence_number: 1,
          running_hash: 'xyz',
          topic_id: '0.0.3001',
        }],
      })
    );
    const { result } = renderHook(() => useTopicMessages('0.0.3001'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messages[0].message).toBe('Hello HCS world');
  });

  it('returns empty string for message when absent', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        messages: [{
          consensus_timestamp: '1700000001.000000000',
          message: '',
          sequence_number: 1,
          running_hash: 'xyz',
          topic_id: '0.0.3001',
        }],
      })
    );
    const { result } = renderHook(() => useTopicMessages('0.0.3001'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messages[0].message).toBe('');
  });

  it('maps all message fields to camelCase', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        messages: [{
          consensus_timestamp: '1700000002.000000000',
          message: btoa('data'),
          sequence_number: 7,
          running_hash: 'hash7',
          topic_id: '0.0.3001',
        }],
      })
    );
    const { result } = renderHook(() => useTopicMessages('0.0.3001'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const msg = result.current.messages[0];
    expect(msg.consensusTimestamp).toBe('1700000002.000000000');
    expect(msg.sequenceNumber).toBe(7);
    expect(msg.runningHash).toBe('hash7');
    expect(msg.topicId).toBe('0.0.3001');
  });

  it('defaults limit to 25', async () => {
    const fetchMock = mockFetch({ messages: [] });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useTopicMessages('0.0.3001'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock.mock.calls[0][0]).toContain('limit=25');
  });

  it('passes custom limit to URL', async () => {
    const fetchMock = mockFetch({ messages: [] });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(
      () => useTopicMessages('0.0.3001', { limit: 100 }),
      { wrapper: testnetWrapper }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock.mock.calls[0][0]).toContain('limit=100');
  });

  it('appends sequencenumber gte filter', async () => {
    const fetchMock = mockFetch({ messages: [] });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(
      () => useTopicMessages('0.0.3001', { sequenceNumberGte: 10 }),
      { wrapper: testnetWrapper }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    const url: string = fetchMock.mock.calls[0][0];
    expect(url).toContain('gte%3A10');
  });

  it('appends sequencenumber lte filter', async () => {
    const fetchMock = mockFetch({ messages: [] });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(
      () => useTopicMessages('0.0.3001', { sequenceNumberLte: 50 }),
      { wrapper: testnetWrapper }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    const url: string = fetchMock.mock.calls[0][0];
    expect(url).toContain('lte%3A50');
  });

  it('appends both gte and lte when provided together', async () => {
    const fetchMock = mockFetch({ messages: [] });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(
      () => useTopicMessages('0.0.3001', { sequenceNumberGte: 5, sequenceNumberLte: 20 }),
      { wrapper: testnetWrapper }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    const url: string = fetchMock.mock.calls[0][0];
    expect(url).toContain('gte%3A5');
    expect(url).toContain('lte%3A20');
  });

  it('exposes working refetch', async () => {
    const fetchMock = mockFetch({ messages: [] });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useTopicMessages('0.0.3001'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { result.current.refetch(); });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('sets error on HTTP failure', async () => {
    vi.stubGlobal('fetch', mockFetch({}, false, 'Service Unavailable'));
    const { result } = renderHook(() => useTopicMessages('0.0.3001'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toMatch(/Service Unavailable/);
    expect(result.current.messages).toEqual([]);
  });

  it('handles messages array being absent in response', async () => {
    vi.stubGlobal('fetch', mockFetch({}));
    const { result } = renderHook(() => useTopicMessages('0.0.3001'), { wrapper: testnetWrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});