import { db } from "../_db/index.js";
import { users, userSubscriptions, plans, imageLogs } from "../_db/schema.js";
import { eq, and, count } from "drizzle-orm";

export interface UserUsage {
  userId: string;
  planName: string;
  limit: number;
  usageCount: number;
}

/**
 * Get user's plan limit and current usage count
 */
export async function getUserUsage(clerkId: string): Promise<UserUsage> {
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

  // Count user's image logs (generations and edits)
  const [generationCount] = await db
    .select({ count: count() })
    .from(imageLogs)
    .where(eq(imageLogs.userId, user.id));

  return {
    userId: user.id,
    planName: subscription.planName,
    limit: subscription.imageGenerationLimit,
    usageCount: generationCount?.count || 0,
  };
}

/**
 * Insert new record in imageLogs table
 */
export async function logImageAction({
  userId,
  type,
}: {
  userId: string;
  type: "image_generation" | "image_edits";
}): Promise<void> {
  await db.insert(imageLogs).values({
    userId,
    type,
  });
}
