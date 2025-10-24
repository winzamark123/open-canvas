import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// Define the schema for the image analysis output
const imageAnalysisSchema = z.object({
  description: z.string().describe("A general text description of the image"),
  objects: z
    .array(z.string())
    .describe("Main objects or elements detected in the image"),
  colors: z.array(z.string()).describe("Dominant colors present in the image"),
  style: z.string().describe("Visual style or type of the image"),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageData } = req.body;

    if (!imageData || typeof imageData !== "string") {
      return res.status(400).json({
        error: "imageData is required and must be a base64 data URL string",
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "OpenAI API key not configured",
      });
    }

    // Call OpenAI's GPT-4o with vision capabilities using Vercel AI SDK
    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: imageAnalysisSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and provide a basic description including: a general description, main objects/elements you see, dominant colors, and the visual style or type.",
            },
            {
              type: "image",
              image: imageData,
            },
          ],
        },
      ],
    });

    res.json({
      success: true,
      analysis: result.object,
    });
  } catch (error) {
    console.error("Error analyzing image:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
