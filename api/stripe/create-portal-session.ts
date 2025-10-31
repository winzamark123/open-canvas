import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../_db/index.js";
import { userSubscriptions, users } from "../_db/schema.js";
import { eq } from "drizzle-orm";
import {
  baseEdgeHandler,
  type HandlerContext,
} from "../_lib/baseEdgeHandler.js";
import { getStripeClient } from "../_lib/stripe.js";

async function createPortalSessionHandler(
  req: VercelRequest,
  res: VercelResponse,
  context: HandlerContext,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get user's subscription to retrieve Stripe customer ID
    const [subscription] = await db
      .select({
        stripeCustomerId: userSubscriptions.stripeCustomerId,
      })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, context.userId))
      .limit(1);

    if (!subscription) {
      return res.status(404).json({ error: "User subscription not found" });
    }

    if (!subscription.stripeCustomerId) {
      // Get user info to create Stripe customer if needed
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, context.userId))
        .limit(1);

      if (!user || !user.email) {
        return res.status(400).json({
          error: "User email not found. Please contact support.",
        });
      }

      // Create Stripe customer if one doesn't exist
      const stripe = getStripeClient();
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

      // Update user subscription with Stripe customer ID
      await db
        .update(userSubscriptions)
        .set({ stripeCustomerId: customer.id })
        .where(eq(userSubscriptions.userId, context.userId));

      subscription.stripeCustomerId = customer.id;
    }

    // Determine return URL
    let baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL ||
      "http://localhost:3000";

    // Ensure protocol is included
    if (baseUrl !== "http://localhost:3000" && !baseUrl.startsWith("http")) {
      baseUrl = `https://${baseUrl}`;
    }

    const returnUrl = `${baseUrl}/?portal=success`;

    // Create Stripe billing portal session
    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return res.status(500).json({
      error: "Failed to create portal session",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Wrap handler with baseEdgeHandler for authentication
export default baseEdgeHandler({
  handler: createPortalSessionHandler,
  requireAuth: true,
  checkUsageLimits: false,
  trackUsage: false,
});
