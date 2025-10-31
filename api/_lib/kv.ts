import { Redis } from "@upstash/redis";

let kvClient: Redis | null = null;

/**
 * Get or create singleton KV client using Upstash Redis REST API
 */
export function getKVClient(): Redis {
  if (!kvClient) {
    kvClient = Redis.fromEnv();
  }
  return kvClient;
}

/**
 * Key helpers for consistent KV key naming
 */
export const KV_KEYS = {
  userUsage: (clerkId: string) => `user_usage:${clerkId}`,
};
