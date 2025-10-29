import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fal } from "@fal-ai/client";
import { baseEdgeHandler } from "./_lib/baseEdgeHandler.js";

async function editImageHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      prompt,
      images,
      image_size = "square_hd",
      num_images = 1,
      max_images = 1,
      enable_safety_checker = true,
    } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Prompt is required and must be a string",
      });
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        error: "At least one image is required for editing",
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

    // Process images: upload files or use dataURLs directly
    const imageUrls: string[] = [];

    for (const imageData of images) {
      if (typeof imageData === "string") {
        // Already a dataURL or URL, use directly
        imageUrls.push(imageData);
      } else if (imageData.data && imageData.type) {
        // File-like object with base64 data, convert to Blob and upload
        const base64Data = imageData.data.split(",")[1] || imageData.data;
        const byteCharacters = Buffer.from(base64Data, "base64");
        const blob = new Blob([byteCharacters], { type: imageData.type });

        // Upload to fal storage
        const uploadedUrl = await fal.storage.upload(blob);
        imageUrls.push(uploadedUrl);
      } else {
        console.warn("Skipping invalid image data:", imageData);
      }
    }

    if (imageUrls.length === 0) {
      return res.status(400).json({
        error: "No valid images could be processed",
      });
    }

    // Call fal.ai Seedream v4 Edit API
    const result = await fal.run("fal-ai/bytedance/seedream/v4/edit", {
      input: {
        prompt,
        image_urls: imageUrls,
        image_size,
        num_images,
        max_images,
        enable_safety_checker,
      },
    });

    if (!result.data.images || !result.data.images[0]?.url) {
      console.error("Invalid response structure:", result.data);
      return res.status(500).json({
        error: "Image editing failed",
        details: result.data,
      });
    }

    const imageUrl = result.data.images[0].url;

    // Fetch the image and convert to base64 to avoid CORS issues
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return res.status(500).json({
        error: "Failed to fetch edited image",
      });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const mimeType = imageResponse.headers.get("content-type") || "image/png";

    res.json({
      success: true,
      imageData: `data:${mimeType};base64,${base64Image}`,
      seed: result.data.seed,
    });
  } catch (error) {
    console.error("Error editing image:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export default baseEdgeHandler({
  handler: editImageHandler,
  requireAuth: false,
  actionType: "image_edits",
});
