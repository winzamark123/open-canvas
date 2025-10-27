import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "@clerk/backend";
import { db } from "./db/index.js";
import {
  users,
  userSubscriptions,
  plans,
  imageGenerations,
} from "./db/schema.js";
import { eq, and, count } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.substring(7);

    // Verify the session token with Clerk
    let clerkUserId: string;
    try {
      const claims = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      clerkUserId = claims.sub;

      if (!clerkUserId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      return res.status(401).json({ error: "Invalid token" });
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
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
      return res.status(404).json({ error: "No subscription found" });
    }

    // Count user's image generations
    const [generationCount] = await db
      .select({ count: count() })
      .from(imageGenerations)
      .where(eq(imageGenerations.userId, user.id));

    return res.status(200).json({
      planName: subscription.planName,
      imageGenerationLimit: subscription.imageGenerationLimit,
      imageGenerationsUsed: generationCount?.count || 0,
    });
  } catch (error) {
    console.error("Error fetching user usage:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
