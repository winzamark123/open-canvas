import dotenv from "dotenv";
import express from "express";
import ViteExpress from "vite-express";

dotenv.config();

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// API Route - adapted from the old Next.js route.ts
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Prompt is required and must be a string",
      });
    }

    const apiKey = process.env.JIGSAWSTACK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "JigsawStack API key not configured",
      });
    }

    // Call JigsawStack API
    const response = await fetch(
      "https://api.jigsawstack.com/v1/ai/image_generation",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          prompt,
          return_type: "url",
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("JigsawStack API error:", errorData);
      return res.status(response.status).json({
        error: "Failed to generate image",
        details: errorData,
      });
    }

    const data = await response.json();

    if (!data.success || !data.url) {
      console.error("Invalid response structure:", data);
      return res.status(500).json({
        error: "Image generation failed",
        details: data,
      });
    }

    // Fetch the image and convert to base64 to avoid CORS issues
    const imageResponse = await fetch(data.url);
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
      usage: data._usage,
    });
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Start the server with ViteExpress
const port = 3000;

ViteExpress.listen(app, port, () => {
  console.log(`Server is listening on port ${port}...`);
});
