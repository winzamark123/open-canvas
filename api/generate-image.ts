import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fal } from "@fal-ai/client";
import { baseEdgeHandler } from "./_lib/baseEdgeHandler.js";

async function generateImageHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      prompt,
      aspect_ratio = "1:1",
      guidance_scale = 3.5,
      num_images = 1,
      enhance_prompt = true,
    } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Prompt is required and must be a string",
      });
    }

    const apiKey = process.env.FAL_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "fal.ai API key not configured",
      });
    }

    // Configure fal client
    fal.config({
      credentials: apiKey,
    });

    // Call fal.ai API using client
    const result = await fal.run("fal-ai/flux-pro/kontext/max/text-to-image", {
      input: {
        prompt,
        aspect_ratio,
        guidance_scale,
        num_images,
        enhance_prompt,
      },
    });

    if (!result.data.images || !result.data.images[0]?.url) {
      console.error("Invalid response structure:", result.data);
      return res.status(500).json({
        error: "Image generation failed",
        details: result.data,
      });
    }

    const imageUrl = result.data.images[0].url;

    // Fetch the image and convert to base64 to avoid CORS issues
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return res.status(500).json({
        error: "Failed to fetch generated image",
      });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const mimeType = imageResponse.headers.get("content-type") || "image/png";

    res.json({
      success: true,
      imageData: `data:${mimeType};base64,${base64Image}`,
      seed: result.data.seed,
      timings: result.data.timings,
    });
  } catch (error) {
    console.error("Error generating image:", error);

    // Handle fal.ai ValidationError (status 422)
    if (
      error instanceof Error &&
      "status" in error &&
      error.status === 422 &&
      "body" in error &&
      typeof error.body === "object" &&
      error.body !== null &&
      "detail" in error.body
    ) {
      return res.status(422).json({
        success: false,
        error: "Validation error",
        message: "Image generation request validation failed",
        details: error.body.detail,
      });
    }

    // Handle other fal.ai errors with status codes
    if (
      error instanceof Error &&
      "status" in error &&
      typeof error.status === "number"
    ) {
      const status = error.status as number;
      const errorBody = "body" in error ? error.body : null;
      return res.status(status).json({
        success: false,
        error: "Image generation failed",
        message: error.message || "Unknown error",
        details: errorBody,
      });
    }

    // Generic error fallback
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export default baseEdgeHandler({
  handler: generateImageHandler,
  requireAuth: false,
  actionType: "image_generation",
});
