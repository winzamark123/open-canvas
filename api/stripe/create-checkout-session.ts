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
  context: HandlerContext,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get user's email from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, context.userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.email) {
      return res.status(400).json({
        error: "User email not found. Please contact support.",
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
        .json({ error: "Invalid plan or missing Stripe price ID" });
    }

    // Get user's existing subscription to find Stripe customer ID
    const [existingSubscription] = await db
      .select({
        stripeCustomerId: userSubscriptions.stripeCustomerId,
      })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, context.userId))
      .limit(1);

    // Get or create Stripe customer
    const stripe = getStripeClient();
    let stripeCustomerId: string;

    if (existingSubscription?.stripeCustomerId) {
      stripeCustomerId = existingSubscription.stripeCustomerId;
    } else {
      // Create Stripe customer if one doesn't exist
      const customer = await stripe.customers.create({
        email: user.email,
        name:
          [user.firstName, user.lastName].filter(Boolean).join(" ") ||
          undefined,
        metadata: {
          userId: context.userId,
          clerkId: user.clerkId,
        },
      });

      stripeCustomerId = customer.id;

      // Update user subscription with Stripe customer ID if subscription exists
      if (existingSubscription) {
        await db
          .update(userSubscriptions)
          .set({ stripeCustomerId: customer.id })
          .where(eq(userSubscriptions.userId, context.userId));
      }
    }

    // Determine success and cancel URLs
    let baseUrl = "";
    if (process.env.NODE_ENV === "development") {
      baseUrl = "http://localhost:3000";
    } else {
      baseUrl = "https://www.opencanvas.studio";
    }

    const successUrl = `${baseUrl}/?checkout=success`;
    const cancelUrl = `${baseUrl}/?checkout=cancelled`;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: context.userId,
        planId: plan.id,
        planName: plan.name,
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
