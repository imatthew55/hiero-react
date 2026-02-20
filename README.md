@'
# hiero-react

React hooks and utilities for easy integration with Hiero/Hedera networks.

[![CI](https://github.com/imatthew55/hiero-bounty/actions/workflows/ci.yml/badge.svg)](https://github.com/imatthew55/hiero-bounty/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Features

- 🪝 **React Hooks** - Simple hooks for accounts, transactions, tokens, and NFTs
- 📦 **TypeScript** - Full type safety and autocompletion
- 🌐 **Mirror Node** - Query data without running a node
- ⚡ **Lightweight** - Minimal dependencies

## Installation
```bash
npm install hiero-react
```

## Quick Start

### 1. Wrap your app with HieroProvider
```tsx
import { HieroProvider } from 'hiero-react';

function App() {
  return (
    <HieroProvider network="testnet">
      <YourApp />
    </HieroProvider>
  );
}
```

### 2. Use hooks in your components
```tsx
import { useAccount, useTransactions, useTokens } from 'hiero-react';

function Wallet({ accountId }: { accountId: string }) {
  const { balance, loading, error } = useAccount(accountId);
  
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  
  return <p>Balance: {balance} HBAR</p>;
}
```

## Available Hooks

### useAccount(accountId)

Fetch account balance and info.
```tsx
const { accountId, balance, loading, error } = useAccount('0.0.1234');
```

### useTransactions(accountId, limit?)

Fetch recent transactions for an account.
```tsx
const { transactions, loading, error, refetch } = useTransactions('0.0.1234', 20);

// Each transaction has:
// - transactionId: string
// - type: string
// - result: string
// - consensusTimestamp: string
// - transfers: Array<{ account: string, amount: number }>
```

### useTokens(accountId)

Fetch fungible tokens owned by an account.
```tsx
const { tokens, loading, error } = useTokens('0.0.1234');

// Each token has:
// - tokenId: string
// - symbol: string
// - balance: number
// - decimals: number
```

### useNFTs(accountId)

Fetch NFTs owned by an account.
```tsx
const { nfts, loading, error } = useNFTs('0.0.1234');

// Each NFT has:
// - tokenId: string
// - serialNumber: number
// - metadata: string
```

### useHiero()

Access the Hiero context directly.
```tsx
const { network, mirrorNodeUrl } = useHiero();
```

## Configuration

### Networks
```tsx
// Testnet (default for development)
<HieroProvider network="testnet">

// Mainnet (production)
<HieroProvider network="mainnet">

// Previewnet (experimental features)
<HieroProvider network="previewnet">
```

### Custom Mirror Node
```tsx
<HieroProvider network="mainnet" mirrorNodeUrl="https://your-mirror-node.com">
```

## Example App
```tsx
import React from 'react';
import { HieroProvider, useAccount, useTransactions } from 'hiero-react';

function WalletDashboard() {
  const accountId = '0.0.1234';
  const { balance, loading: balanceLoading } = useAccount(accountId);
  const { transactions, loading: txLoading } = useTransactions(accountId, 5);

  return (
    <div>
      <h1>My Wallet</h1>
      
      <section>
        <h2>Balance</h2>
        {balanceLoading ? <p>Loading...</p> : <p>{balance} HBAR</p>}
      </section>

      <section>
        <h2>Recent Transactions</h2>
        {txLoading ? (
          <p>Loading...</p>
        ) : (
          <ul>
            {transactions.map((tx) => (
              <li key={tx.transactionId}>
                {tx.type} - {tx.result}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function App() {
  return (
    <HieroProvider network="testnet">
      <WalletDashboard />
    </HieroProvider>
  );
}
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

Apache-2.0 - see [LICENSE](./LICENSE) for details.
'@ | Out-File -FilePath "README.md" -Encoding utf8