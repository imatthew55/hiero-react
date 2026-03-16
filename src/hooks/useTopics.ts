import { useState, useEffect, useCallback } from 'react';
import { useHiero } from './useHiero';

export interface TopicInfo {
  topicId: string;
  memo: string;
  runningHash: string;
  sequenceNumber: number;
  adminKey: string | null;
  submitKey: string | null;
  autoRenewPeriod: number;
  expirationTimestamp: string | null;
  deleted: boolean;
}

export interface UseTopicResult {
  topic: TopicInfo | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface TopicResponse {
  topic_id: string;
  memo?: string;
  running_hash: string;
  sequence_number: number;
  admin_key?: { key: string };
  submit_key?: { key: string };
  auto_renew_period?: number;
  expiration_timestamp?: string;
  deleted?: boolean;
}

/**
 * Fetch metadata for a Hedera Consensus Service (HCS) topic by its topic ID
 * (e.g. "0.0.12345").
 */
export function useTopic(topicId: string): UseTopicResult {
  const { mirrorNodeUrl } = useHiero();
  const [topic, setTopic] = useState<TopicInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTopic = useCallback(async () => {
    if (!topicId) return;
    try {
      setLoading(true);
      const response = await fetch(`${mirrorNodeUrl}/api/v1/topics/${topicId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch topic: ${response.statusText}`);
      }
      const data: TopicResponse = await response.json();
      setTopic({
        topicId: data.topic_id,
        memo: data.memo ?? '',
        runningHash: data.running_hash,
        sequenceNumber: data.sequence_number,
        adminKey: data.admin_key?.key ?? null,
        submitKey: data.submit_key?.key ?? null,
        autoRenewPeriod: data.auto_renew_period ?? 0,
        expirationTimestamp: data.expiration_timestamp ?? null,
        deleted: data.deleted ?? false,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [topicId, mirrorNodeUrl]);

  useEffect(() => {
    fetchTopic();
  }, [fetchTopic]);

  return { topic, loading, error, refetch: fetchTopic };
}

export interface TopicMessage {
  consensusTimestamp: string;
  message: string;
  sequenceNumber: number;
  runningHash: string;
  topicId: string;
}

export interface UseTopicMessagesResult {
  messages: TopicMessage[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface TopicMessageResponse {
  consensus_timestamp: string;
  message: string;
  sequence_number: number;
  running_hash: string;
  topic_id: string;
}

/**
 * Fetch messages submitted to an HCS topic, with optional sequence range.
 * Messages are returned in ascending order by sequence number.
 */
export function useTopicMessages(
  topicId: string,
  options?: {
    limit?: number;
    sequenceNumberGte?: number;
    sequenceNumberLte?: number;
  }
): UseTopicMessagesResult {
  const { mirrorNodeUrl } = useHiero();
  const [messages, setMessages] = useState<TopicMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const { limit = 25, sequenceNumberGte, sequenceNumberLte } = options ?? {};

  const fetchMessages = useCallback(async () => {
    if (!topicId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: String(limit) });
      if (sequenceNumberGte !== undefined) {
        params.append('sequencenumber', `gte:${sequenceNumberGte}`);
      }
      if (sequenceNumberLte !== undefined) {
        params.append('sequencenumber', `lte:${sequenceNumberLte}`);
      }

      const response = await fetch(
        `${mirrorNodeUrl}/api/v1/topics/${topicId}/messages?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch topic messages: ${response.statusText}`);
      }
      const data = await response.json();
      const formatted: TopicMessage[] = (data.messages ?? []).map(
        (m: TopicMessageResponse) => ({
          consensusTimestamp: m.consensus_timestamp,
          message: m.message ? atob(m.message) : '',
          sequenceNumber: m.sequence_number,
          runningHash: m.running_hash,
          topicId: m.topic_id,
        })
      );
      setMessages(formatted);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [topicId, limit, sequenceNumberGte, sequenceNumberLte, mirrorNodeUrl]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return { messages, loading, error, refetch: fetchMessages };
}