import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../_db/index.js";
import { plans, users, userSubscriptions } from "../_db/schema.js";
import { eq } from "drizzle-orm";
import {
  baseEdgeHandler,
  type HandlerContext,
} from "../_lib/baseEdgeHandler.js";
import { getStripeClient } from "../_lib/stripe.js";

async function createCheckoutSessionHandler(
  req: VercelRequest,
  res: VercelResponse,
  context?: HandlerContext,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get authenticated user from context (provided by baseEdgeHandler)
    if (!context?.clerkUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user from database using clerkId from context
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, context.clerkUserId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user's subscription to retrieve Stripe customer ID
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, user.id))
      .limit(1);

    if (!subscription) {
      return res.status(404).json({ error: "User subscription not found" });
    }

    if (!subscription.stripeCustomerId) {
      return res.status(400).json({
        error: "No Stripe customer ID found. Please contact support.",
      });
    }

    // Get the plan name from request
    const { planName } = req.body;
    if (!planName) {
      return res.status(400).json({ error: "Plan name is required" });
    }

    // Get the plan from database
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.name, planName))
      .limit(1);

    if (!plan || !plan.stripePriceId) {
      return res
        .status(400)
        .json({ error: "Invalid plan or missing price ID" });
    }

    // Get the app URL from environment or use default
    const appUrl =
      process.env.NODE_ENV === "production"
        ? process.env.VITE_APP_URL
        : "http://localhost:3000";

    const stripe = getStripeClient();

    // Create Stripe Checkout Session for existing customer
    // This will update their subscription to the new plan
    const session = await stripe.checkout.sessions.create({
      customer: subscription.stripeCustomerId,
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${appUrl}/?checkout=success`,
      cancel_url: `${appUrl}/?checkout=cancelled`,
      metadata: {
        userId: user.id,
        planId: plan.id,
        clerkId: user.clerkId,
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return res.status(500).json({
      error: "Failed to create checkout session",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Wrap handler with baseEdgeHandler for authentication
// No usage limits or tracking needed for checkout
export default baseEdgeHandler({
  handler: createCheckoutSessionHandler,
  requireAuth: true,
  checkUsageLimits: false,
  trackUsage: false,
});
