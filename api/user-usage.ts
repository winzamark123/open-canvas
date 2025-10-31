import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "./_db/index.js";
import { userSubscriptions, plans, imageLogs } from "./_db/schema.js";
import { getCurrentMonthBoundaries } from "./_lib/db-helpers.js";
import { eq, and, desc, gt, gte, lt } from "drizzle-orm";
import {
  baseEdgeHandler,
  type HandlerContext,
} from "./_lib/baseEdgeHandler.js";

async function userUsageHandler(
  req: VercelRequest,
  res: VercelResponse,
  context: HandlerContext,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!context.userUsage) {
      return res.status(404).json({ error: "User usage data not found" });
    }

    // Get user's subscription and plan details
    const [subscription] = await db
      .select({
        planId: plans.id,
        planName: plans.name,
        imageGenerationLimit: plans.imageGenerationLimit,
        priceMonthly: plans.priceMonthly,
        stripeSubscriptionId: userSubscriptions.stripeSubscriptionId,
      })
      .from(userSubscriptions)
      .innerJoin(plans, eq(userSubscriptions.planId, plans.id))
      .where(eq(userSubscriptions.userId, context.userId))
      .limit(1);

    if (!subscription) {
      return res.status(404).json({ error: "No subscription found" });
    }

    // Get recent image log events for current month (last 100)
    const { startOfMonth, endOfMonth } = getCurrentMonthBoundaries();
    const events = await db
      .select({
        id: imageLogs.id,
        type: imageLogs.type,
        createdAt: imageLogs.createdAt,
      })
      .from(imageLogs)
      .where(
        and(
          eq(imageLogs.userId, context.userId),
          gte(imageLogs.createdAt, startOfMonth),
          lt(imageLogs.createdAt, endOfMonth),
        ),
      )
      .orderBy(desc(imageLogs.createdAt))
      .limit(100);

    // Get next plan (if not on premium)
    let nextPlan = null;
    if (subscription.planName.toLowerCase() !== "premium") {
      // Get all plans sorted by limit to find the next tier
      const allPlans = await db
        .select({
          id: plans.id,
          name: plans.name,
          imageGenerationLimit: plans.imageGenerationLimit,
          priceMonthly: plans.priceMonthly,
        })
        .from(plans)
        .where(
          gt(plans.imageGenerationLimit, subscription.imageGenerationLimit),
        )
        .orderBy(plans.imageGenerationLimit)
        .limit(1);

      if (allPlans.length > 0) {
        nextPlan = allPlans[0];
      }
    }

    return res.status(200).json({
      planName: subscription.planName,
      imageGenerationLimit: subscription.imageGenerationLimit,
      imageGenerationsUsed: context.userUsage.usageCount, // From KV cache
      hasStripeSubscription: !!subscription.stripeSubscriptionId, // Flag to determine if user has active Stripe subscription
      events: events.map((event) => ({
        id: event.id,
        date: event.createdAt,
        type: event.type,
      })),
      nextPlan: nextPlan
        ? {
            name: nextPlan.name,
            imageGenerationLimit: nextPlan.imageGenerationLimit,
            priceMonthly: nextPlan.priceMonthly,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching user usage:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Wrap handler with baseEdgeHandler for authentication
// No usage limits or tracking needed for viewing usage data
export default baseEdgeHandler({
  handler: userUsageHandler,
  requireAuth: true,
  checkUsageLimits: false,
  trackUsage: false,
});
