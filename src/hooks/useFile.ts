import { useState, useEffect, useCallback } from 'react';
import { useHiero } from './useHiero';

export interface FileInfo {
  fileId: string;
  size: number;
  expirationTimestamp: string | null;
  deleted: boolean;
  memo: string;
  keys: string[];
}

export interface UseFileResult {
  file: FileInfo | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface FileResponse {
  file_id: string;
  size: number;
  expiry_timestamp?: string;
  deleted: boolean;
  memo?: string;
  keys?: { key: string }[];
}

/**
 * Fetch metadata for a Hedera file by its file ID (e.g. "0.0.12345").
 */
export function useFile(fileId: string): UseFileResult {
  const { mirrorNodeUrl } = useHiero();
  const [file, setFile] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFile = useCallback(async () => {
    if (!fileId) return;
    try {
      setLoading(true);
      const response = await fetch(`${mirrorNodeUrl}/api/v1/files/${fileId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      const data: FileResponse = await response.json();
      setFile({
        fileId: data.file_id,
        size: data.size,
        expirationTimestamp: data.expiry_timestamp ?? null,
        deleted: data.deleted,
        memo: data.memo ?? '',
        keys: data.keys?.map((k) => k.key) ?? [],
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [fileId, mirrorNodeUrl]);

  useEffect(() => {
    fetchFile();
  }, [fetchFile]);

  return { file, loading, error, refetch: fetchFile };
}

export interface FileContents {
  fileId: string;
  content: string;
  encoding: 'base64' | 'utf8';
}

export interface UseFileContentsResult {
  contents: FileContents | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch the raw contents of a Hedera file. The content is returned as a
 * base64 string (the Mirror Node always base64-encodes file contents).
 */
export function useFileContents(fileId: string): UseFileContentsResult {
  const { mirrorNodeUrl } = useHiero();
  const [contents, setContents] = useState<FileContents | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchContents = useCallback(async () => {
    if (!fileId) return;
    try {
      setLoading(true);
      const response = await fetch(`${mirrorNodeUrl}/api/v1/files/${fileId}/data`);
      if (!response.ok) {
        throw new Error(`Failed to fetch file contents: ${response.statusText}`);
      }
      const data = await response.json();
      setContents({
        fileId,
        content: data.content ?? '',
        encoding: 'base64',
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [fileId, mirrorNodeUrl]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  return { contents, loading, error, refetch: fetchContents };
}