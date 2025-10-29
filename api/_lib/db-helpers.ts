import { db } from "../_db/index.js";
import { users, userSubscriptions, plans, imageLogs } from "../_db/schema.js";
import { eq, and, count } from "drizzle-orm";
import { getKVClient, KV_KEYS } from "./kv.js";

export interface UserUsage {
  userId: string;
  planName: string;
  limit: number;
  usageCount: number;
}

/**
 * Get user's plan limit and current usage count
 * Uses KV cache with read-through strategy (check KV first, fallback to DB)
 * Optimized: checks cache with clerkId BEFORE querying DB for user details
 */
export async function getUserUsage(clerkId: string): Promise<UserUsage> {
  let usageCount = 0;
  let cacheHit = false;

  // Try to get usage count from KV cache FIRST (before any DB queries)
  try {
    const kv = getKVClient();
    const cachedCount = await kv.get<number>(KV_KEYS.userUsage(clerkId));

    if (cachedCount !== null && cachedCount !== undefined) {
      // Cache hit - we can skip the count query to DB
      usageCount = cachedCount;
      cacheHit = true;
      console.log(`[KV] Cache hit for clerkId ${clerkId}: ${usageCount}`);
    }
  } catch (error) {
    // If KV fails, we'll fallback to DB query below
    console.error("[KV] Error accessing cache, will fallback to DB:", error);
  }

  // Get user from database
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  // Get user's subscription and plan
  const [subscription] = await db
    .select({
      planName: plans.name,
      imageGenerationLimit: plans.imageGenerationLimit,
    })
    .from(userSubscriptions)
    .innerJoin(plans, eq(userSubscriptions.planId, plans.id))
    .where(eq(userSubscriptions.userId, user.id))
    .limit(1);

  if (!subscription) {
    throw new Error("No subscription found for user");
  }

  // If cache miss, query DB for count and populate cache
  if (!cacheHit) {
    console.log(`[KV] Cache miss for clerkId ${clerkId}, querying DB`);
    const [generationCount] = await db
      .select({ count: count() })
      .from(imageLogs)
      .where(eq(imageLogs.userId, user.id));

    usageCount = generationCount?.count || 0;

    // Populate cache (write-through)
    try {
      const kv = getKVClient();
      await kv.set(KV_KEYS.userUsage(clerkId), usageCount);
      console.log(`[KV] Cache populated for clerkId ${clerkId}: ${usageCount}`);
    } catch (error) {
      console.error("[KV] Error populating cache:", error);
      // Don't fail the request if cache population fails
    }
  }

  return {
    userId: user.id,
    planName: subscription.planName,
    limit: subscription.imageGenerationLimit,
    usageCount,
  };
}

/**
 * Insert new record in imageLogs table and update KV cache
 * Uses write-through strategy (update cache after DB write)
 */
export async function logImageAction({
  userId,
  clerkId,
  type,
}: {
  userId: string;
  clerkId: string;
  type: "image_generation" | "image_edits";
}): Promise<void> {
  // Insert into database
  await db.insert(imageLogs).values({
    userId,
    type,
  });

  // Update KV cache (write-through) using clerkId
  try {
    const kv = getKVClient();
    const newCount = await kv.incr(KV_KEYS.userUsage(clerkId));
    console.log(`[KV] Cache incremented for clerkId ${clerkId}: ${newCount}`);
  } catch (error) {
    // Log error but don't fail the request if KV update fails
    console.error("[KV] Error incrementing cache:", error);
    // Cache will be repopulated on next read (eventual consistency)
  }
}
