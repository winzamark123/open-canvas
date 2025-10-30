import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "@clerk/backend";
import { getUserUsage, logImageAction } from "./db-helpers.js";

export interface HandlerContext {
  userId?: string;
  clerkUserId?: string;
  userUsage?: {
    userId: string;
    usageCount: number;
    limit: number;
    planName: string;
  };
}

interface BaseHandlerConfig {
  handler: (
    req: VercelRequest,
    res: VercelResponse,
    context?: HandlerContext,
  ) => Promise<void | VercelResponse>;
  requireAuth?: boolean;
  checkUsageLimits?: boolean;
  trackUsage?: boolean;
  actionType?: "image_generation" | "image_edits";
}

/**
 * Base handler wrapper that handles authentication, checks usage limits, and tracks image actions
 * @param handler - The main request handler function
 * @param requireAuth - Whether authentication is required (default: false)
 * @param checkUsageLimits - Whether to check image generation limits (default: true)
 * @param trackUsage - Whether to track image action usage (default: true)
 * @param actionType - The type of image action ("image_generation" or "image_edits")
 */
export function baseEdgeHandler(config: BaseHandlerConfig) {
  const {
    handler,
    requireAuth = false,
    checkUsageLimits = true,
    trackUsage = true,
    actionType = "image_generation",
  } = config;

  return async (req: VercelRequest, res: VercelResponse) => {
    let userId: string | null = null;
    let clerkUserId: string | null = null;
    let userUsage: HandlerContext["userUsage"] | undefined;
    const context: HandlerContext = {};

    try {
      // Parse request to get Clerk session token (from Authorization header)
      const authHeader = req.headers.authorization;

      // Only proceed with auth/KV checks if auth is required OR an auth header is provided
      if (requireAuth || (authHeader && authHeader.startsWith("Bearer "))) {
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          // Auth is required but no valid header provided
          if (requireAuth) {
            return res.status(401).json({ error: "Unauthorized" });
          }
        } else {
          const token = authHeader.substring(7);

          try {
            // Verify token with Clerk
            const claims = await verifyToken(token, {
              secretKey: process.env.CLERK_SECRET_KEY,
            });
            clerkUserId = claims.sub;

            if (clerkUserId) {
              // Query DB for user's plan and current usage count
              userUsage = await getUserUsage(clerkUserId);
              userId = userUsage.userId;

              console.log("userUsage", userUsage);

              // Check if usage reaches the maximum limit (only if checkUsageLimits is true)
              if (checkUsageLimits && userUsage.usageCount >= userUsage.limit) {
                return res.status(403).json({
                  error: "Usage limit reached, please upgrade your plan",
                  details: {
                    usageCount: userUsage.usageCount,
                    limit: userUsage.limit,
                    planName: userUsage.planName,
                  },
                });
              }

              // Populate context with user information
              context.userId = userId;
              context.clerkUserId = clerkUserId;
              context.userUsage = userUsage;
            }
          } catch (error) {
            console.error("Token verification or DB query failed:", error);
            // If authentication fails but is required, return error
            if (requireAuth) {
              return res.status(401).json({ error: "Invalid token" });
            }
            // Otherwise continue as anonymous
          }
        }
      }

      console.log("userId", userId);
      console.log("clerkUserId", clerkUserId);
      console.log("trackUsage", trackUsage);

      // After successful response, log action for authenticated users (only if trackUsage is true)
      if (userId && clerkUserId && trackUsage) {
        // Wait for DB write and KV increment to complete
        console.log("logging image action");
        try {
          await logImageAction({
            userId,
            clerkId: clerkUserId,
            type: actionType,
          });
        } catch (error) {
          console.error("Failed to log image action:", error);
          // Don't fail the request if tracking fails
        }
      }

      // Call the wrapped handler function with context
      await handler(req, res, context);
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
