import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { db } from "../_db/index.js";
import { userSubscriptions, plans, users } from "../_db/schema.js";
import { eq } from "drizzle-orm";
import getRawBody from "raw-body";
import { getStripeClient } from "../_lib/stripe.js";
import { getKVClient, KV_KEYS } from "../_lib/kv.js";
import type { KVUsageData } from "../_lib/db-helpers.js";
import { getCurrentMonth } from "../_lib/db-helpers.js";
import { getUserUsage } from "../_lib/db-helpers.js";

// Disable body parsing to get raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Update KV cache with new plan limit while preserving usage count
 */
async function updateKVCacheWithPlanLimit(
  clerkId: string,
  planLimit: number,
): Promise<void> {
  try {
    const kv = getKVClient();
    const key = KV_KEYS.userUsage(clerkId);
    const currentMonth = getCurrentMonth();

    const cachedData = await kv.get<KVUsageData>(key);

    if (cachedData && cachedData.month === currentMonth) {
      // Cache exists and month matches - update plan limit while preserving usage
      const updatedData: KVUsageData = {
        current_usage: cachedData.current_usage,
        plan_limit: planLimit,
        month: currentMonth,
      };
      await kv.set(key, updatedData);
      console.log(
        `[KV] Updated plan limit for clerkId ${clerkId}: ${planLimit}`,
      );
    } else {
      // Cache doesn't exist or month changed - get current usage and update
      const userUsage = await getUserUsage(clerkId);

      const kvData: KVUsageData = {
        current_usage: userUsage.usageCount,
        plan_limit: planLimit,
        month: currentMonth,
      };
      await kv.set(key, kvData);
      console.log(
        `[KV] Created/updated cache for clerkId ${clerkId} with plan limit: ${planLimit}`,
      );
    }
  } catch (error) {
    // Log error but don't fail the webhook if KV update fails
    console.error("[KV] Error updating cache with plan limit:", error);
    // Cache will be repopulated on next read (eventual consistency)
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const stripeCustomerId = session.customer as string;

  if (!stripeCustomerId) {
    throw new Error("Missing customer ID in checkout session");
  }

  // Identify user by Stripe customer ID
  let [existingSubscription] = await db
    .select({
      userId: userSubscriptions.userId,
      planId: userSubscriptions.planId,
    })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.stripeCustomerId, stripeCustomerId))
    .limit(1);

  // Fallback: if customer ID doesn't match, try to find by customer email
  if (!existingSubscription && session.customer_email) {
    const [userByEmail] = await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(eq(users.email, session.customer_email))
      .limit(1);

    if (userByEmail) {
      const [subscriptionByUser] = await db
        .select({
          userId: userSubscriptions.userId,
          planId: userSubscriptions.planId,
        })
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, userByEmail.id))
        .limit(1);

      if (subscriptionByUser) {
        existingSubscription = subscriptionByUser;
      }
    }
  }

  // If still no subscription found, try to use metadata from checkout session
  let finalUserId: string;
  if (!existingSubscription) {
    const userIdFromMetadata = session.metadata?.userId;
    if (userIdFromMetadata) {
      // Verify user exists
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, userIdFromMetadata))
        .limit(1);

      if (user) {
        finalUserId = user.id;
        console.log(
          `No existing subscription found, will create new one for user ${finalUserId} from checkout metadata`,
        );
      } else {
        throw new Error(
          `User not found for userId ${userIdFromMetadata} from checkout metadata`,
        );
      }
    } else {
      throw new Error(
        `User subscription not found for Stripe customer ${stripeCustomerId} and no userId in metadata`,
      );
    }
  } else {
    finalUserId = existingSubscription.userId;
  }

  // Get plan from line items (price ID) and match to database plan
  const stripe = getStripeClient();
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 1,
  });

  if (!lineItems.data || lineItems.data.length === 0) {
    throw new Error("No line items found in checkout session");
  }

  const priceId = lineItems.data[0].price?.id;
  if (!priceId) {
    throw new Error("No price ID found in line items");
  }

  // Find plan by stripePriceId
  const [planByPriceId] = await db
    .select()
    .from(plans)
    .where(eq(plans.stripePriceId, priceId))
    .limit(1);

  if (!planByPriceId) {
    throw new Error(`Plan not found for price ID ${priceId}`);
  }

  const finalPlanId = planByPriceId.id;
  console.log(
    `Checkout completed for user ${finalUserId}, plan ${finalPlanId}, subscription ${session.subscription}`,
  );

  // Get plan details
  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, finalPlanId))
    .limit(1);

  if (!plan) {
    throw new Error(`Plan ${finalPlanId} not found`);
  }

  // Get existing subscription to check if this is an upgrade
  const [userSubscription] = await db
    .select({
      id: userSubscriptions.id,
      planId: userSubscriptions.planId,
      stripeSubscriptionId: userSubscriptions.stripeSubscriptionId,
    })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, finalUserId))
    .limit(1);

  // If user has an existing subscription with a different plan, cancel the old one
  if (
    userSubscription &&
    userSubscription.stripeSubscriptionId &&
    userSubscription.planId !== finalPlanId &&
    userSubscription.stripeSubscriptionId !== session.subscription
  ) {
    try {
      console.log(
        `Cancelling old subscription ${userSubscription.stripeSubscriptionId} for user ${finalUserId}`,
      );
      await stripe.subscriptions.cancel(userSubscription.stripeSubscriptionId);
      console.log(
        `Successfully cancelled old subscription ${userSubscription.stripeSubscriptionId}`,
      );
    } catch (cancelError) {
      // Log error but don't fail the webhook - new subscription is already created
      console.error(
        `Error cancelling old subscription ${userSubscription.stripeSubscriptionId}:`,
        cancelError,
      );
    }
  }

  // Update or create subscription
  if (userSubscription) {
    await db
      .update(userSubscriptions)
      .set({
        planId: finalPlanId,
        stripeSubscriptionId: session.subscription as string,
        stripeCustomerId: stripeCustomerId,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.userId, finalUserId));

    console.log(
      `Updated subscription for user ${finalUserId} to plan ${finalPlanId}`,
    );
  } else {
    await db.insert(userSubscriptions).values({
      userId: finalUserId,
      planId: finalPlanId,
      stripeSubscriptionId: session.subscription as string,
      stripeCustomerId: stripeCustomerId,
      status: "active",
    });

    console.log(`Created new subscription for user ${finalUserId}`);
  }

  // Update KV cache
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, finalUserId))
    .limit(1);

  if (user) {
    await updateKVCacheWithPlanLimit(user.clerkId, plan.imageGenerationLimit);
  } else {
    console.warn(
      `Could not find user for userId ${finalUserId}, skipping KV update`,
    );
  }
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`Subscription updated: ${subscription.id}`);

  // Get the price ID from the subscription
  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) {
    throw new Error("No price ID found in subscription");
  }

  // Find plan by stripePriceId
  const [planByPriceId] = await db
    .select()
    .from(plans)
    .where(eq(plans.stripePriceId, priceId))
    .limit(1);

  if (!planByPriceId) {
    throw new Error(`Plan not found for price ID ${priceId}`);
  }

  const newPlanId = planByPriceId.id;

  // Get user subscription by stripeSubscriptionId
  const [userSubscription] = await db
    .select({
      id: userSubscriptions.id,
      userId: userSubscriptions.userId,
      planId: userSubscriptions.planId,
      stripeSubscriptionId: userSubscriptions.stripeSubscriptionId,
    })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (!userSubscription) {
    // Subscription not found - this shouldn't happen, but log it
    console.log(
      `Subscription ${subscription.id} not found in database - may need to be created`,
    );
    return; // Early return - can't process further
  }

  const finalUserId = userSubscription.userId;

  // Check if plan changed
  if (userSubscription.planId === newPlanId) {
    // Plan hasn't changed, just update subscription metadata if needed
    console.log(
      `Subscription ${subscription.id} plan unchanged, no action needed`,
    );
    return;
  }

  console.log(
    `Plan changed for subscription ${subscription.id}: ${userSubscription.planId} -> ${newPlanId}`,
  );

  // Get plan details
  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, newPlanId))
    .limit(1);

  if (!plan) {
    throw new Error(`Plan ${newPlanId} not found`);
  }

  const customerId = subscription.customer as string;
  if (!customerId) {
    throw new Error("Missing customer ID in subscription");
  }

  // Stripe has already updated the subscription in place (e.g., via customer portal).
  // Simply sync our database with Stripe's updated state.
  console.log(
    `Syncing subscription ${subscription.id} for user ${finalUserId} with new plan ${newPlanId}`,
  );

  // Map Stripe subscription status to our database status
  // Stripe statuses: active, canceled, past_due, unpaid, trialing, etc.
  const subscriptionStatus =
    subscription.status === "active" ||
    subscription.status === "trialing" ||
    subscription.status === "past_due"
      ? "active"
      : subscription.status;

  // Update database to reflect Stripe's updated subscription state
  await db
    .update(userSubscriptions)
    .set({
      planId: newPlanId,
      stripeSubscriptionId: subscription.id, // Keep the same subscription ID
      stripeCustomerId: customerId,
      status: subscriptionStatus,
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.userId, finalUserId));

  console.log(
    `Successfully updated subscription ${subscription.id} for user ${finalUserId} to plan ${newPlanId}`,
  );

  // Update KV cache
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, finalUserId))
    .limit(1);

  if (user) {
    await updateKVCacheWithPlanLimit(user.clerkId, plan.imageGenerationLimit);
  } else {
    console.warn(
      `Could not find user for userId ${finalUserId}, skipping KV update`,
    );
  }
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`Subscription deleted: ${subscription.id}`);

  // Get free plan
  const [freePlan] = await db
    .select()
    .from(plans)
    .where(eq(plans.name, "free"))
    .limit(1);

  if (!freePlan) {
    throw new Error("Free plan not found");
  }

  // Get user subscription
  const [userSubscription] = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (!userSubscription) {
    // Subscription not found - this is okay, it might have been deleted already
    // or it was a test subscription that never existed in our DB
    console.log(
      `Subscription ${subscription.id} not found in database - may have been deleted already or never existed`,
    );
    return; // Early return - no need to process further
  }

  // 🔒 FIX: Check if user has another active subscription (might have been upgraded)
  // This prevents race condition where old subscription deletion overwrites new subscription
  const [currentSubscription] = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userSubscription.userId))
    .limit(1);

  // If the current subscription has a different stripeSubscriptionId,
  // this deletion is for an old subscription that was replaced - ignore it
  if (
    currentSubscription &&
    currentSubscription.stripeSubscriptionId !== subscription.id &&
    currentSubscription.stripeSubscriptionId !== null
  ) {
    console.log(
      `Subscription ${subscription.id} deletion ignored - user already has active subscription ${currentSubscription.stripeSubscriptionId}`,
    );
    return; // Don't downgrade - user has a newer subscription
  }

  // Update subscription to free tier (no Stripe subscription, but keep customer ID for future purchases)
  await db
    .update(userSubscriptions)
    .set({
      status: "active",
      planId: freePlan.id,
      stripeSubscriptionId: null, // Clear Stripe subscription ID since free tier doesn't have one
      // Keep stripeCustomerId for future subscriptions
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));

  console.log(`Downgraded subscription ${subscription.id} to free tier`);

  // Update KV cache
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userSubscription.userId))
    .limit(1);

  if (user) {
    await updateKVCacheWithPlanLimit(
      user.clerkId,
      freePlan.imageGenerationLimit,
    );
  } else {
    console.warn(
      `Could not find user for subscription ${subscription.id}, skipping KV update`,
    );
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).json({ error: "Missing signature or secret" });
  }

  try {
    const stripe = getStripeClient();

    // Read raw body as Buffer from request stream
    const body = await buffer(req);

    // Construct the event from the raw body and signature
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        try {
          await handleCheckoutCompleted(session);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error("Error handling checkout completion:", errorMessage);
          return res.status(400).json({ error: errorMessage });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        try {
          await handleSubscriptionUpdated(subscription);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error("Error handling subscription update:", errorMessage);
          return res.status(400).json({ error: errorMessage });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        try {
          await handleSubscriptionDeleted(subscription);
          // Return 200 even if subscription wasn't found (it's already deleted)
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error("Error handling subscription deletion:", errorMessage);

          // Only return 500 for unexpected errors, not "not found" cases
          // (handleSubscriptionDeleted now handles "not found" gracefully)
          return res.status(500).json({ error: errorMessage });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(400).json({
      error: "Webhook error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Helper function to read raw body as Buffer
function buffer(req: VercelRequest): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    req.on("error", reject);
  });
}
