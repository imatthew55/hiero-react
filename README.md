# Hiero React Utilities (HRU)

React hooks and utilities for easy integration with Hiero/Hedera networks.

[![CI](https://github.com/imatthew55/hiero-bounty/actions/workflows/ci.yml/badge.svg)](https://github.com/imatthew55/hiero-bounty/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Features

- **React Hooks** - Simple hooks for accounts, transactions, tokens, and NFTs
- **TypeScript** - Full type safety and autocompletion
- **Mirror Node** - Query Hiero data without running a node
- **Lightweight** - Minimal dependencies

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
import { useAccount } from 'hiero-react';

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
```

### useTokens(accountId)

Fetch fungible tokens owned by an account.
```tsx
const { tokens, loading, error } = useTokens('0.0.1234');
```

### useNFTs(accountId)

Fetch NFTs owned by an account.
```tsx
const { nfts, loading, error } = useNFTs('0.0.1234');
```

### useHiero()

Access the Hiero context directly.
```tsx
const { network, mirrorNodeUrl } = useHiero();
```

## Configuration

### Networks
```tsx
<HieroProvider network="testnet">   // Testnet (development)
<HieroProvider network="mainnet">   // Mainnet (production)
<HieroProvider network="previewnet"> // Previewnet (experimental)
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

## Development
```bash
# Install dependencies
npm install

# Run tests
npm test

# Build the library
npm run build

# Lint code
npm run lint
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

All commits must be:
- GPG signed
- Include DCO sign-off (`git commit -s`)

## License

Apache-2.0 - see [LICENSE](./LICENSE) for details.