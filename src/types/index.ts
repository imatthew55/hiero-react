export type NetworkType = 'mainnet' | 'testnet' | 'previewnet';

export interface AccountInfo {
  accountId: string;
  balance: number;
  loading: boolean;
  error: Error | null;
}