import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "@clerk/backend";
import { getUserUsage, incrementImageGeneration } from "./db-helpers.js";

interface BaseHandlerConfig {
  handler: (
    req: VercelRequest,
    res: VercelResponse,
  ) => Promise<void | VercelResponse>;
  requireAuth?: boolean;
}

/**
 * Base handler wrapper that checks usage limits and tracks image generations
 */
export function baseEdgeHandler(config: BaseHandlerConfig) {
  const { handler, requireAuth = false } = config;

  return async (req: VercelRequest, res: VercelResponse) => {
    let userId: string | null = null;
    let clerkUserId: string | null = null;

    try {
      // Parse request to get Clerk session token (from Authorization header)
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);

        try {
          // Verify token with Clerk
          const claims = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
          });
          clerkUserId = claims.sub;

          if (clerkUserId) {
            // Query DB for user's plan and current usage count
            const userUsage = await getUserUsage(clerkUserId);
            userId = userUsage.userId;

            console.log("userUsage", userUsage);

            // Check if usage reaches the maximum limit
            if (userUsage.usageCount >= userUsage.limit) {
              return res.status(403).json({
                error: "Usage limit reached, please upgrade your plan",
                details: {
                  usageCount: userUsage.usageCount,
                  limit: userUsage.limit,
                  planName: userUsage.planName,
                },
              });
            }
          }
        } catch (error) {
          console.error("Token verification or DB query failed:", error);
          // If authentication fails but not required, continue as anonymous
          if (requireAuth) {
            return res.status(401).json({ error: "Invalid token" });
          }
        }
      } else if (requireAuth) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Call the wrapped handler function
      await handler(req, res);

      // After successful response, increment usage for authenticated users
      if (userId) {
        // Non-blocking DB write (happens asynchronously within serverless timeout)
        incrementImageGeneration(userId).catch((error) => {
          console.error("Failed to increment image generation count:", error);
          // Don't block the response if tracking fails
        });
      }
    } catch (error) {
      // If handler threw an error, don't increment usage
      console.error("Handler error:", error);

      // Only send error response if not already sent
      if (!res.headersSent) {
        res.status(500).json({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  };
}
