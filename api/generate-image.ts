import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fal } from "@fal-ai/client";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      prompt,
      image_size = "square_hd",
      aspect_ratio,
      num_inference_steps = 28,
      guidance_scale = 3.5,
      num_images = 1,
      enable_safety_checker = true,
      enhance_prompt = true,
      seed,
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
        image_size: aspect_ratio || image_size, // Use aspect_ratio if provided for backwards compatibility
        num_inference_steps,
        guidance_scale,
        num_images,
        enable_safety_checker,
        enhance_prompt,
        ...(seed !== undefined && { seed }),
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
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
