import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../_db/index.js";
import { userSubscriptions } from "../_db/schema.js";
import { eq } from "drizzle-orm";
import {
  baseEdgeHandler,
  type HandlerContext,
} from "../_lib/baseEdgeHandler.js";
import { getStripeClient } from "../_lib/stripe.js";

interface Invoice {
  id: string;
  date: string;
  description: string;
  status: "Paid" | "Pending" | "Failed";
  amount: number;
  currency: string;
  invoiceUrl?: string;
}

async function invoicesHandler(
  req: VercelRequest,
  res: VercelResponse,
  context: HandlerContext,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get user's subscription to retrieve Stripe customer ID
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, context.userId))
      .limit(1);

    if (!subscription) {
      return res.status(404).json({ error: "User subscription not found" });
    }

    if (!subscription.stripeCustomerId) {
      // User doesn't have a Stripe customer yet, return empty array
      return res.status(200).json({ invoices: [] });
    }

    const stripe = getStripeClient();

    // Fetch invoices from Stripe for this customer
    const stripeInvoices = await stripe.invoices.list({
      customer: subscription.stripeCustomerId,
      limit: 100, // Get last 100 invoices
    });

    // Transform Stripe invoices to match our Invoice interface
    const invoices: Invoice[] = stripeInvoices.data.map((invoice) => {
      // Format the date
      const date = new Date(invoice.created * 1000).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "short",
          day: "2-digit",
        },
      );

      // Determine status
      let status: Invoice["status"];
      if (invoice.status === "paid") {
        status = "Paid";
      } else if (invoice.status === "open") {
        status = "Pending";
      } else {
        status = "Failed";
      }

      // Get description - use lines description or default
      const description =
        invoice.lines.data[0]?.description || `Invoice for ${date}`;

      return {
        id: invoice.id,
        date,
        description,
        status,
        amount: invoice.amount_paid / 100, // Convert from cents to dollars
        currency: invoice.currency.toUpperCase(),
        invoiceUrl: invoice.hosted_invoice_url || undefined,
      };
    });

    return res.status(200).json({ invoices });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return res.status(500).json({
      error: "Failed to fetch invoices",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Wrap handler with baseEdgeHandler for authentication
// No usage limits or tracking needed for viewing invoices
export default baseEdgeHandler({
  handler: invoicesHandler,
  requireAuth: true,
  checkUsageLimits: false,
  trackUsage: false,
});
