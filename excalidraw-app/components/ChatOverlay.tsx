import { useState } from "react";

import { newImageElement } from "@excalidraw/element";

import { Paperclip } from "lucide-react";

import Spinner from "@excalidraw/excalidraw/components/Spinner";

import { ArrowUp } from "lucide-react";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { BinaryFileData } from "@excalidraw/excalidraw/types";

import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface ChatOverlayProps {
  excalidrawAPI: ExcalidrawImperativeAPI;
}

export const ChatOverlay = ({ excalidrawAPI }: ChatOverlayProps) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addImageToCanvas = async (imageDataUrl: string) => {
    // Convert base64 data URL to binary data for Excalidraw
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();

    // Generate unique file ID
    const fileId = `image_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;

    // Create binary file data
    const binaryFileData: BinaryFileData = {
      id: fileId as BinaryFileData["id"],
      dataURL: imageDataUrl as BinaryFileData["dataURL"],
      mimeType: (blob.type || "image/png") as BinaryFileData["mimeType"],
      created: Date.now(),
      lastRetrieved: Date.now(),
    };

    // Add file to Excalidraw
    excalidrawAPI.addFiles([binaryFileData]);

    // Get current app state to determine canvas center
    const appState = excalidrawAPI.getAppState();
    const currentElements = excalidrawAPI.getSceneElements();

    // Calculate center position based on current viewport
    const centerX =
      (appState.width / 2 - appState.scrollX) / appState.zoom.value;
    const centerY =
      (appState.height / 2 - appState.scrollY) / appState.zoom.value;

    // Create image element (positioned at center, size will be determined by the actual image)
    const imageElement = newImageElement({
      type: "image",
      x: centerX - 150, // Offset to center the image (assuming ~300px width)
      y: centerY - 150, // Offset to center the image (assuming ~300px height)
      width: 300,
      height: 300,
      fileId: fileId as BinaryFileData["id"],
      scale: [1, 1],
    });

    // Add the new image element to the scene
    excalidrawAPI.updateScene({
      elements: [...currentElements, imageElement],
    });

    // Show success toast
    excalidrawAPI.setToast({
      message: "Image generated and added to canvas!",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) {
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Call our local API endpoint instead of external API
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate image");
      }

      await addImageToCanvas(data.imageData);

      // Clear the input
      setPrompt("");
    } catch (err) {
      console.error("Error generating image:", err);
      setError(err instanceof Error ? err.message : "Failed to generate image");
      // Show error toast
      excalidrawAPI.setToast({
        message: `Error: ${
          err instanceof Error ? err.message : "Failed to generate image"
        }`,
        type: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex items-center px-8 bg-white rounded-lg flex-1 max-w-3xl">
      <Input
        type="text"
        placeholder="Ask Anything..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        // className="border-none outline-none box-shadow-none"
        className="flex-1"
        style={{
          border: "none",
          outline: "none",
          boxShadow: "none",
        }}
      />

      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline">
            <Paperclip className="size-4" />
            Attach
          </Button>
        </div>
        {isGenerating ? (
          <Spinner />
        ) : (
          <ArrowUp className="size-4" onClick={handleSubmit} />
        )}
      </div>
    </div>
  );
};
