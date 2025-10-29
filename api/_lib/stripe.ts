import Stripe from "stripe";

let stripeClient: Stripe | null = null;

/**
 * Get or create singleton Stripe client
 */
export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}
