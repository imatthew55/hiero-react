# # Hiero React Utilities (HRU)

React hooks for reading data from the Hiero / Hedera network via the [Mirror Node REST API](https://docs.hedera.com/hedera/sdks-and-apis/rest-api).

[![CI](https://github.com/imatthew55/hiero-react/actions/workflows/ci.yml/badge.svg)](https://github.com/imatthew55/hiero-react/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![npm](https://img.shields.io/npm/v/hiero-react)](https://www.npmjs.com/package/hiero-react)

## Features

- **React hooks** — accounts, transactions, tokens, NFTs, files, smart contracts, and HCS topics
- **TypeScript** — full type safety and autocompletion on every hook
- **Mirror Node** — read Hiero data without running a node or holding a private key
- **Lightweight** — zero production dependencies

---

## How it works

Hedera runs a public read API called the **Mirror Node**. It indexes everything on the network — every transaction, token transfer, and HCS message — and exposes it over REST.

This library wraps those endpoints in React hooks so you can display blockchain data without writing any fetch logic yourself. It is **read-only**: you can display balances, transactions, and token data, but cannot send transactions or sign anything.

```
Your component
  └── calls useAccount('0.0.1234')
        └── reads mirror URL from HieroProvider
              └── GET https://testnet.mirrornode.hedera.com/api/v1/accounts/0.0.1234
                    └── returns { balance, loading, error }
```

---

## Installation

```bash
npm install hiero-react
```

React 18 or higher is required as a peer dependency.

---

## Quick start

### 1. Wrap your app with HieroProvider

```tsx
import { HieroProvider } from 'hiero-react';

export default function App() {
  return (
    <HieroProvider network="testnet">
      <YourApp />
    </HieroProvider>
  );
}
```

### 2. Use a hook in your component

```tsx
import { useAccount } from 'hiero-react';

function Wallet({ accountId }: { accountId: string }) {
  const { balance, loading, error } = useAccount(accountId);

  if (loading) return <p>Loading...</p>;
  if (error)   return <p>Error: {error.message}</p>;

  return <p>Balance: {balance} HBAR</p>;
}
```

---

## Configuration

### Networks

```tsx
<HieroProvider network="testnet">     // Testnet  (development)
<HieroProvider network="mainnet">     // Mainnet  (production)
<HieroProvider network="previewnet">  // Previewnet (experimental)
```

### Custom Mirror Node URL

```tsx
<HieroProvider network="mainnet" mirrorNodeUrl="https://your-mirror-node.com">
```

---

## Available hooks

### `useHiero()`

Access the current network configuration. Must be inside `HieroProvider`.

```tsx
const { network, mirrorNodeUrl } = useHiero();
```

---

### `useAccount(accountId)`

Fetch the HBAR balance for an account.

```tsx
const { accountId, balance, loading, error } = useAccount('0.0.1234');
```

---

### `useTransactions(accountId, limit?)`

Fetch recent transactions for an account.

```tsx
const { transactions, loading, error, refetch } = useTransactions('0.0.1234', 20);
```

Each `Transaction` has: `transactionId`, `type`, `result`, `consensusTimestamp`, `transfers[]`.

---

### `useTokens(accountId)`

Fetch fungible tokens held by an account.

```tsx
const { tokens, loading, error } = useTokens('0.0.1234');
// tokens: Array<{ tokenId, symbol, balance, decimals }>
```

---

### `useNFTs(accountId)`

Fetch NFTs held by an account. Metadata is automatically decoded from base64.

```tsx
const { nfts, loading, error } = useNFTs('0.0.1234');
// nfts: Array<{ tokenId, serialNumber, metadata }>
```

---

### `useFile(fileId)` and `useFileContents(fileId)`

Fetch metadata and raw contents of a file stored on the Hedera file service.

```tsx
const { file, loading, error, refetch } = useFile('0.0.101');
// file: { fileId, size, expirationTimestamp, deleted, memo, keys[] }

const { contents, loading, error } = useFileContents('0.0.101');
// contents: { fileId, content (base64), encoding }
```

---

### `useContract(contractId)`, `useContractCalls(contractId)`, `useContractLogs(contractId)`

Fetch metadata, historical call results, and emitted event logs for a smart contract.

```tsx
const { contract, loading, error } = useContract('0.0.2001');
// contract: { contractId, evmAddress, fileId, memo, adminKey, deleted, bytecodeHash, ... }

const { calls, loading, error } = useContractCalls('0.0.2001');
// calls: Array<{ result, gasUsed, errorMessage }>

const { logs, loading, error } = useContractLogs('0.0.2001');
// logs: Array<{ address, blockHash, blockNumber, data, topics[], transactionHash }>
```

---

### `useTopic(topicId)` and `useTopicMessages(topicId, options?)`

Fetch metadata and messages for a Hedera Consensus Service (HCS) topic. Messages are automatically decoded from base64.

```tsx
const { topic, loading, error } = useTopic('0.0.2');
// topic: { topicId, memo, runningHash, sequenceNumber, adminKey, submitKey, deleted, ... }

const { messages, loading, error } = useTopicMessages('0.0.2', {
  limit: 25,
  sequenceNumberGte: 100,
  sequenceNumberLte: 200,
});
// messages: Array<{ consensusTimestamp, message, sequenceNumber, runningHash, topicId }>
```

---

## Full example

This example demonstrates all available hooks against real testnet data. Topic `0.0.2` and file `0.0.101` are Hedera system resources that always exist on testnet — no setup required.

```tsx
import {
  HieroProvider,
  useAccount,
  useTopic,
  useTopicMessages,
  useFile,
  useFileContents,
  useContract,
  useContractLogs,
} from 'hiero-react';

function HookTests() {
  const { balance, loading: accountLoading } = useAccount('0.0.8241384');
  const { topic } = useTopic('0.0.2');
  const { messages } = useTopicMessages('0.0.2', { limit: 3 });
  const { file } = useFile('0.0.101');
  const { contents } = useFileContents('0.0.101');
  const { contract } = useContract('0.0.8071440');
  const { logs } = useContractLogs('0.0.8071440');

  return (
    <div style={{ padding: 32, fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: 24 }}>

      <section>
        <h2>useAccount</h2>
        {accountLoading ? <p>Loading...</p> : <p>Balance: {balance} HBAR</p>}
      </section>

      <section>
        <h2>useTopic (0.0.2)</h2>
        {topic ? (
          <p>Sequence number: {topic.sequenceNumber} | Memo: {topic.memo}</p>
        ) : <p>Loading...</p>}
      </section>

      <section>
        <h2>useTopicMessages (0.0.2)</h2>
        {messages.length === 0 ? <p>Loading...</p> : messages.map(m => (
          <div key={m.sequenceNumber}>
            #{m.sequenceNumber} — {m.consensusTimestamp}
          </div>
        ))}
      </section>

      <section>
        <h2>useFile (0.0.101)</h2>
        {file ? (
          <p>Size: {file.size} bytes | Deleted: {String(file.deleted)}</p>
        ) : <p>Loading...</p>}
      </section>

      <section>
        <h2>useFileContents (0.0.101)</h2>
        {contents ? (
          <p>Content length: {contents.content.length} chars (base64)</p>
        ) : <p>Loading...</p>}
      </section>

      <section>
        <h2>useContract</h2>
        {contract ? (
          <p>EVM address: {contract.evmAddress} | Deleted: {String(contract.deleted)}</p>
        ) : <p>Loading...</p>}
      </section>

      <section>
        <h2>useContractLogs</h2>
        {logs.length === 0 ? <p>No logs</p> : logs.map((log, i) => (
          <div key={i}>
            Block {log.blockNumber} — {log.address}
          </div>
        ))}
      </section>

    </div>
  );
}

export default function App() {
  return (
    <HieroProvider network="testnet">
      <HookTests />
    </HieroProvider>
  );
}
```

---

## Development

```bash
npm install          # install dependencies
npm run build        # compile TypeScript → dist/
npm test             # run test suite
npm run lint         # check code style
npm run typecheck    # check types without building
npm run dev          # build and watch for changes
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

All commits must be:
- GPG signed (`git config commit.gpgsign true`)
- Include a DCO sign-off (`git commit -s`)

---

## License

Apache-2.0 — see [LICENSE](./LICENSE) for details.
