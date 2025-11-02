import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fal } from "@fal-ai/client";
import { baseEdgeHandler } from "./_lib/baseEdgeHandler.js";

async function editImageHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, images } = req.body;

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

    // Process images: upload all images to fal storage for better compatibility
    const imageUrls: string[] = [];

    for (const imageData of images) {
      if (typeof imageData === "string") {
        // Handle data URLs - extract base64 data and mime type
        if (imageData.startsWith("data:image/")) {
          // Extract mime type and base64 data
          const [header, base64Data] = imageData.split(",");
          const mimeMatch = header.match(/data:image\/(\w+);base64/);
          const mimeType = mimeMatch ? `image/${mimeMatch[1]}` : "image/png";

          // Convert to Blob and upload to fal storage
          const byteCharacters = Buffer.from(base64Data, "base64");
          const blob = new Blob([byteCharacters], { type: mimeType });
          const uploadedUrl = await fal.storage.upload(blob);
          imageUrls.push(uploadedUrl);
        } else {
          // Already a URL (not a data URL), use directly
          imageUrls.push(imageData);
        }
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

    // Call fal.ai Flux Pro Kontext Max Multi API
    const result = await fal.run("fal-ai/flux-pro/kontext/max/multi", {
      input: {
        prompt,
        image_urls: imageUrls,
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
    });
  } catch (error) {
    console.error("Error editing image:", error);

    // Handle fal.ai ValidationError (status 422)
    // Check for status 422 first - don't require instanceof Error as ValidationError
    // might not pass instanceof check
    if (
      error &&
      typeof error === "object" &&
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
        message: "Image editing request validation failed",
        details: error.body.detail,
      });
    }

    // Handle other fal.ai errors with status codes
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      typeof error.status === "number"
    ) {
      const status = error.status as number;
      const errorBody = "body" in error ? error.body : null;
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as any)?.message || "Unknown error";

      return res.status(status).json({
        success: false,
        error: "Image editing failed",
        message: errorMessage,
        details: errorBody,
      });
    }

    // Generic error fallback
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message:
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null && "message" in error
          ? String((error as any).message)
          : "Unknown error",
    });
  }
}

export default baseEdgeHandler({
  handler: editImageHandler,
  requireAuth: false,
  actionType: "image_edits",
});
