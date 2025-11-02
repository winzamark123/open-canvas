import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "@clerk/backend";
import { getUserUsage, logImageAction } from "./db-helpers.js";

export interface HandlerContext {
  userId: string;
  clerkUserId: string;
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
    context: HandlerContext,
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

    try {
      // Parse request to get Clerk session token (from Authorization header)
      const authHeader = req.headers.authorization;

      // If auth is required, enforce it
      if (requireAuth) {
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authHeader.substring(7);

        try {
          // Verify token with Clerk
          const claims = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
          });
          clerkUserId = claims.sub;

          if (!clerkUserId) {
            return res.status(401).json({ error: "Invalid token" });
          }

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
        } catch (error) {
          console.error("Token verification or DB query failed:", error);
          return res.status(401).json({ error: "Invalid token" });
        }
      } else {
        // Optional auth: try to authenticate if header is provided
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.substring(7);

          try {
            const claims = await verifyToken(token, {
              secretKey: process.env.CLERK_SECRET_KEY,
            });
            clerkUserId = claims.sub;

            if (clerkUserId) {
              userUsage = await getUserUsage(clerkUserId);
              userId = userUsage.userId;

              // Check usage limits if checkUsageLimits is true
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
            }
          } catch (error) {
            console.error("Token verification or DB query failed:", error);
            // Continue as anonymous if auth fails but not required
          }
        }
      }

      // When requireAuth is true, userId and clerkUserId must be set
      if (requireAuth && (!userId || !clerkUserId)) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Create context - use empty strings as fallback for non-auth handlers
      const context: HandlerContext = {
        userId: userId || "",
        clerkUserId: clerkUserId || "",
        userUsage,
      };

      // Track response status to determine if handler succeeded
      let responseStatus: number | null = null;
      const originalStatus = res.status.bind(res);
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      // Wrap res.status() to track status code
      res.status = function (code: number) {
        responseStatus = code;
        return originalStatus(code);
      } as typeof res.status;

      // Wrap res.json() to track status (defaults to 200 if not set)
      res.json = function (body: any) {
        if (responseStatus === null) {
          responseStatus = 200; // Default success status
        }
        return originalJson(body);
      } as typeof res.json;

      // Wrap res.send() to track status (defaults to 200 if not set)
      res.send = function (body: any) {
        if (responseStatus === null) {
          responseStatus = 200; // Default success status
        }
        return originalSend(body);
      } as typeof res.send;

      // Call the wrapped handler function with context
      await handler(req, res, context);

      // After handler completes, check if response was successful (200-299)
      // Only track usage if handler succeeded and user is authenticated
      if (
        userId &&
        clerkUserId &&
        trackUsage &&
        responseStatus !== null &&
        responseStatus >= 200 &&
        responseStatus < 300
      ) {
        // Wait for DB write and KV increment to complete
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
      } else if (
        responseStatus !== null &&
        responseStatus >= 200 &&
        responseStatus < 300
      ) {
        // Log if usage tracking was skipped (for debugging)
        console.log(
          `Usage tracking skipped: userId=${userId}, clerkUserId=${clerkUserId}, trackUsage=${trackUsage}, status=${responseStatus}`,
        );
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
