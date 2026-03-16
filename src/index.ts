// Provider
export { HieroProvider, HieroContext } from './providers/HieroProvider';
export type { HieroProviderProps, HieroConfig, HieroContextValue } from './providers/HieroProvider';

// Hooks — context
export { useHiero } from './hooks/useHiero';

// Hooks — accounts
export { useAccount } from './hooks/useAccount';

// Hooks — transactions
export { useTransactions } from './hooks/useTransactions';
export type { Transaction, UseTransactionsResult } from './hooks/useTransactions';

// Hooks — tokens
export { useTokens } from './hooks/useTokens';
export type { Token, UseTokensResult } from './hooks/useTokens';

// Hooks — NFTs
export { useNFTs } from './hooks/useNFTs';
export type { NFT, UseNFTsResult } from './hooks/useNFTs';

// Hooks — file service
export { useFile, useFileContents } from './hooks/useFile';
export type {
  FileInfo,
  UseFileResult,
  FileContents,
  UseFileContentsResult,
} from './hooks/useFile';

// Hooks — smart contracts
export { useContract, useContractCalls, useContractLogs } from './hooks/useSmartContract';
export type {
  ContractInfo,
  UseContractResult,
  ContractCallResult,
  UseContractCallsResult,
  ContractLog,
  UseContractLogsResult,
} from './hooks/useSmartContract';

// Hooks — HCS topics
export { useTopic, useTopicMessages } from './hooks/useTopics';
export type {
  TopicInfo,
  UseTopicResult,
  TopicMessage,
  UseTopicMessagesResult,
} from './hooks/useTopics';

// Shared types
export * from './types';
