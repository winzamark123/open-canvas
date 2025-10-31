import { db } from "../_db/index.js";
import { users, userSubscriptions, plans, imageLogs } from "../_db/schema.js";
import { eq, and, count, ConsoleLogWriter, gte, lt } from "drizzle-orm";
import { getKVClient, KV_KEYS } from "./kv.js";

export interface UserUsage {
  userId: string;
  planName: string;
  limit: number;
  usageCount: number;
}

export interface KVUsageData {
  current_usage: number;
  plan_limit: number;
  month: string; // Format: "YYYY-MM"
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Get start and end boundaries of current calendar month
 */
export function getCurrentMonthBoundaries(): {
  startOfMonth: Date;
  endOfMonth: Date;
} {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 1);
  return { startOfMonth, endOfMonth };
}

/**
 * Get user's plan limit and current usage count
 * Uses KV cache with read-through strategy (check KV first, fallback to DB)
 * Optimized: checks cache with clerkId BEFORE querying DB for user details
 * Now includes monthly reset and plan limit caching
 */
export async function getUserUsage(clerkId: string): Promise<UserUsage> {
  const currentMonth = getCurrentMonth();
  const { startOfMonth, endOfMonth } = getCurrentMonthBoundaries();

  let usageCount = 0;
  let planLimit: number | null = null;
  let cacheHit = false;

  // Try to get usage data from KV cache FIRST (before any DB queries)
  try {
    const kv = getKVClient();
    const cachedData = await kv.get<KVUsageData>(KV_KEYS.userUsage(clerkId));

    if (cachedData && cachedData.month === currentMonth) {
      // Cache hit with matching month - use cached data
      usageCount = cachedData.current_usage;
      planLimit = cachedData.plan_limit;
      cacheHit = true;
      console.log(
        `[KV] Cache hit for clerkId ${clerkId}, month matches: ${currentMonth}`,
      );
    } else if (cachedData) {
      // Cache exists but month doesn't match - need to query DB and reset
      console.log(
        `[KV] Cache exists but month changed (cached: ${cachedData.month}, current: ${currentMonth})`,
      );
    }
  } catch (error) {
    // If KV fails, we'll fallback to DB query below
    console.error("[KV] Error accessing cache, will fallback to DB:", error);
  }

  // Get user from database (always needed for user ID)
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  // Get user's subscription and plan (needed for plan name and limit if not cached)
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

  // Use cached plan limit if available, otherwise use DB value
  if (planLimit === null) {
    planLimit = subscription.imageGenerationLimit;
  }

  // If cache miss or month changed, query DB for current month's count and populate cache
  if (!cacheHit) {
    console.log(
      `[KV] Querying DB for current month usage for clerkId ${clerkId}`,
    );
    const [generationCount] = await db
      .select({ count: count() })
      .from(imageLogs)
      .where(
        and(
          eq(imageLogs.userId, user.id),
          gte(imageLogs.createdAt, startOfMonth),
          lt(imageLogs.createdAt, endOfMonth),
        ),
      );

    usageCount = generationCount?.count || 0;

    // Populate cache with new structure
    try {
      const kv = getKVClient();
      const kvData: KVUsageData = {
        current_usage: usageCount,
        plan_limit: subscription.imageGenerationLimit,
        month: currentMonth,
      };
      await kv.set(KV_KEYS.userUsage(clerkId), kvData);
      console.log(
        `[KV] Cache populated for clerkId ${clerkId}: ${JSON.stringify(
          kvData,
        )}`,
      );
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
 * Now handles new KV structure with current_usage, plan_limit, and month
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
  const currentMonth = getCurrentMonth();

  // Insert into database
  try {
    const result = await db.insert(imageLogs).values({
      userId,
      type,
    });
    console.log("inserted into db", result);
  } catch (error) {
    console.error("[DB] Error inserting image log:", error);
    throw error;
  }

  // Update KV cache (write-through) using clerkId
  try {
    const kv = getKVClient();
    const key = KV_KEYS.userUsage(clerkId);

    // Get current cached data
    const cachedData = await kv.get<KVUsageData>(key);

    if (cachedData && cachedData.month === currentMonth) {
      // Cache exists and month matches - increment usage
      const updatedData: KVUsageData = {
        current_usage: cachedData.current_usage + 1,
        plan_limit: cachedData.plan_limit,
        month: currentMonth,
      };
      await kv.set(key, updatedData);
      console.log(
        `[KV] Incremented usage for clerkId ${clerkId}: ${updatedData.current_usage}`,
      );
    } else {
      // Cache doesn't exist or month changed - will be repopulated on next read
      console.log(
        `[KV] Cache miss or month mismatch for clerkId ${clerkId}, will repopulate on next read`,
      );
    }
  } catch (error) {
    // Log error but don't fail the request if KV update fails
    console.error("[KV] Error updating cache:", error);
    // Cache will be repopulated on next read (eventual consistency)
  }
}
