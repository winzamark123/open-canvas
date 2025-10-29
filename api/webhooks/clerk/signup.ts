import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Webhook } from "svix";
import { db } from "../../_db/index.js";
import { users, plans, userSubscriptions } from "../../_db/schema.js";
import { eq } from "drizzle-orm";
import { getStripeClient } from "../../_lib/stripe.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get the webhook secret
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("CLERK_WEBHOOK_SECRET is not set");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    // Get the headers for signature verification
    const svixId = req.headers["svix-id"] as string;
    const svixTimestamp = req.headers["svix-timestamp"] as string;
    const svixSignature = req.headers["svix-signature"] as string;

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error("Missing svix headers");
      return res.status(400).json({ error: "Missing svix headers" });
    }

    // Get the raw body
    const body = JSON.stringify(req.body);

    // Create a new Webhook instance with the secret
    const wh = new Webhook(webhookSecret);

    let evt: any;

    // Verify the webhook signature
    try {
      evt = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Handle the webhook
    const { type, data } = evt;

    // Only handle user.created events
    if (type !== "user.created") {
      return res.status(200).json({ message: "Event type not handled" });
    }

    // Extract user data from Clerk webhook payload
    const clerkId = data.id;
    const email = data.email_addresses?.[0]?.email_address;
    const firstName = data.first_name || null;
    const lastName = data.last_name || null;

    if (!clerkId || !email) {
      console.error("Missing required user data:", { clerkId, email });
      return res.status(400).json({ error: "Missing required user data" });
    }

    // Create user in database
    const [newUser] = await db
      .insert(users)
      .values({
        clerkId,
        email,
        firstName,
        lastName,
      })
      .returning();

    if (!newUser) {
      console.error("Failed to create user");
      return res.status(500).json({ error: "Failed to create user" });
    }

    console.log("User created:", { id: newUser.id, clerkId, email });

    // Find the free plan
    const [freePlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.name, "free"))
      .limit(1);

    if (!freePlan) {
      console.error("Free plan not found in database");
      // User was created but subscription wasn't - this is a partial success
      return res.status(500).json({
        error: "Free plan not found",
        userId: newUser.id,
      });
    }

    if (!freePlan.stripePriceId) {
      console.error("Free plan missing stripePriceId");
      return res.status(500).json({
        error: "Free plan not configured properly",
        userId: newUser.id,
      });
    }

    // Create Stripe customer and subscription
    let stripeCustomerId: string | undefined;
    let stripeSubscriptionId: string | undefined;

    try {
      const stripe = getStripeClient();
      console.log("Creating Stripe customer for user:", { email, clerkId });

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email,
        name: [firstName, lastName].filter(Boolean).join(" ") || undefined,
        metadata: {
          clerkId,
          userId: newUser.id,
        },
      });

      stripeCustomerId = customer.id;
      console.log("Stripe customer created:", { customerId: customer.id });

      // Create Stripe subscription
      console.log("Creating Stripe subscription with free plan");
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [
          {
            price: freePlan.stripePriceId,
          },
        ],
        metadata: {
          userId: newUser.id,
          planId: freePlan.id,
        },
      });

      stripeSubscriptionId = subscription.id;
      console.log("Stripe subscription created:", {
        subscriptionId: subscription.id,
        status: subscription.status,
      });
    } catch (stripeError) {
      console.error(
        "Error creating Stripe customer/subscription:",
        stripeError,
      );
      // Log the error but don't fail the signup - user was still created
      // We'll just create the database subscription without Stripe IDs
    }

    // Create user subscription with free plan
    await db.insert(userSubscriptions).values({
      userId: newUser.id,
      planId: freePlan.id,
      status: "active",
      stripeCustomerId,
      stripeSubscriptionId,
    });

    console.log("User subscription created:", {
      userId: newUser.id,
      planId: freePlan.id,
      stripeCustomerId,
      stripeSubscriptionId,
    });

    return res.status(200).json({
      success: true,
      userId: newUser.id,
      message: "User created and assigned to free plan",
    });
  } catch (error) {
    console.error("Error in webhook handler:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
