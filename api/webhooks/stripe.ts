import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { buffer } from "micro";
import { db } from "../_db/index.js";
import { userSubscriptions, plans } from "../_db/schema.js";
import { eq } from "drizzle-orm";
import { getStripeClient } from "../_lib/stripe.js";

// Disable body parsing to get raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

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

    // Use micro's buffer function to get raw body
    const rawBody = await buffer(req);

    // Construct the event from the raw body and signature
    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Get metadata from session
        const { userId, planId } = session.metadata!;

        if (!userId || !planId) {
          console.error("Missing userId or planId in session metadata");
          return res.status(400).json({ error: "Missing metadata" });
        }

        console.log(
          `Checkout completed for user ${userId}, plan ${planId}, subscription ${session.subscription}`,
        );

        // Check if user already has a subscription
        // Note: Users should always have a subscription (created at signup with free plan)
        // This event primarily handles plan upgrades/downgrades via checkout
        const [existingSubscription] = await db
          .select()
          .from(userSubscriptions)
          .where(eq(userSubscriptions.userId, userId))
          .limit(1);

        if (existingSubscription) {
          // Update existing subscription with new plan and Stripe details
          await db
            .update(userSubscriptions)
            .set({
              planId,
              stripeSubscriptionId: session.subscription as string,
              stripeCustomerId: session.customer as string,
              status: "active",
              updatedAt: new Date(),
            })
            .where(eq(userSubscriptions.userId, userId));

          console.log(
            `Updated subscription for user ${userId} to plan ${planId}`,
          );
        } else {
          // Fallback: Create new subscription if somehow missing
          // This should rarely happen since subscriptions are created at signup
          await db.insert(userSubscriptions).values({
            userId,
            planId,
            stripeSubscriptionId: session.subscription as string,
            stripeCustomerId: session.customer as string,
            status: "active",
          });

          console.log(`Created new subscription for user ${userId}`);
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        console.log(`Subscription updated: ${subscription.id}`);

        // Update subscription status
        // Note: current_period_start/end don't exist on Subscription object
        // They're on SubscriptionItems. We can derive period info from billing_cycle_anchor if needed
        await db
          .update(userSubscriptions)
          .set({
            status: subscription.status,
            updatedAt: new Date(),
          })
          .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));

        console.log(
          `Updated subscription status to ${subscription.status} for ${subscription.id}`,
        );

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        console.log(`Subscription deleted: ${subscription.id}`);

        // Get the free plan
        const [freePlan] = await db
          .select()
          .from(plans)
          .where(eq(plans.name, "free"))
          .limit(1);

        if (!freePlan) {
          console.error("Free plan not found");
          return res.status(500).json({ error: "Free plan not found" });
        }

        // Update subscription to cancelled and downgrade to free plan
        await db
          .update(userSubscriptions)
          .set({
            status: "cancelled",
            planId: freePlan.id,
            updatedAt: new Date(),
          })
          .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));

        console.log(`Downgraded subscription ${subscription.id} to free plan`);

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
