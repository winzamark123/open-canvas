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

    // Retry configuration
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 1000; // Start with 1 second delay

    let lastError: Error | null = null;

    // Retry loop with exponential backoff
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
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

        // Validate the result has reasonable content
        if (
          !result.object.description ||
          result.object.description.trim().length < 5
        ) {
          throw new Error("Invalid or too short description from AI");
        }

        // Success! Return the result
        return res.json({
          success: true,
          analysis: result.object,
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Attempt ${attempt + 1}/${MAX_RETRIES} failed:`, error);

        // If this was the last attempt, don't wait
        if (attempt < MAX_RETRIES - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    throw lastError || new Error("Failed after all retry attempts");
  } catch (error) {
    console.error("Error analyzing image:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
