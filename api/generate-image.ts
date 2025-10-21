import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      prompt,
      image_size = "square_hd",
      num_inference_steps = 28,
      guidance_scale = 4.5,
      num_images = 1,
      enable_safety_checker = true,
      output_format = "jpeg",
      acceleration = "regular",
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

    // Call fal.ai API
    const response = await fetch("https://fal.run/fal-ai/flux/krea", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        image_size,
        num_inference_steps,
        guidance_scale,
        num_images,
        enable_safety_checker,
        output_format,
        acceleration,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("fal.ai API error:", errorData);
      return res.status(response.status).json({
        error: "Failed to generate image",
        details: errorData,
      });
    }

    const data = await response.json();

    if (!data.images || !data.images[0]?.url) {
      console.error("Invalid response structure:", data);
      return res.status(500).json({
        error: "Image generation failed",
        details: data,
      });
    }

    const imageUrl = data.images[0].url;

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
      seed: data.seed,
      timings: data.timings,
    });
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
