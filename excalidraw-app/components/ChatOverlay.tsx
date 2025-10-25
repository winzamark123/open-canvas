import { useState, useRef, useEffect } from "react";

import { newImageElement, isImageElement } from "@excalidraw/element";

import { Paperclip, PenLine, Text, X, Loader2 } from "lucide-react";

import { ArrowUp } from "lucide-react";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { BinaryFileData } from "@excalidraw/excalidraw/types";
import type { FileId } from "@excalidraw/element/types";

import { Input } from "./ui/input";
import { Button } from "./ui/button";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const modes = [
  {
    icon: PenLine,
    label: "Draw",
  },
  {
    icon: Text,
    label: "Write",
  },
];

interface AttachedCanvasImage {
  id: string;
  fileId: FileId;
  dataURL: string;
  prompt?: string;
}

interface ChatOverlayProps {
  excalidrawAPI: ExcalidrawImperativeAPI;
}

export const ChatOverlay = ({ excalidrawAPI }: ChatOverlayProps) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMode, setSelectedMode] = useState(modes[0].label);
  const [canvasImages, setCanvasImages] = useState<AttachedCanvasImage[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setUploadedFiles((prev) => [...prev, ...Array.from(files)]);
    }
    // Reset input value to allow re-selecting same file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Sync canvas selection with canvasImages
  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }

    const unsubscribe = excalidrawAPI.onChange((elements, appState, files) => {
      // Get selected image elements
      const selectedImages = elements.filter(
        (el) => isImageElement(el) && appState.selectedElementIds[el.id],
      );

      // Convert to AttachedCanvasImage format
      const canvasImageData: AttachedCanvasImage[] = [];

      for (const el of selectedImages) {
        if (!isImageElement(el) || !el.fileId) {
          continue;
        }

        const fileData = files[el.fileId];
        if (fileData?.dataURL) {
          canvasImageData.push({
            id: el.id,
            fileId: el.fileId,
            dataURL: fileData.dataURL,
            prompt: el.customData?.prompt,
          });
        }
      }

      setCanvasImages(canvasImageData);
    });

    return unsubscribe;
  }, [excalidrawAPI]);

  const addImageToCanvas = async ({
    imageDataUrl,
    prompt,
  }: {
    imageDataUrl: string;
    prompt: string;
  }) => {
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
      customData: {
        prompt: prompt,
        generatedAt: Date.now(),
      },
    });

    // Add the new image element to the scene
    excalidrawAPI.updateScene({
      elements: [...currentElements, imageElement],
    });

    // Show success toast
    excalidrawAPI.setToast({
      message: "Image generated and added to canvas!",
      type: "success",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) {
      return;
    }

    setIsGenerating(true);
    const currentPrompt = prompt.trim(); // Store prompt before clearing

    try {
      // Check if we have attached images (canvas or uploaded files)
      const hasAttachedImages =
        canvasImages.length > 0 || uploadedFiles.length > 0;

      if (hasAttachedImages) {
        // Use edit endpoint with attached images
        const images: any[] = [];

        // Add canvas images (already as dataURLs)
        canvasImages.forEach((img) => {
          images.push(img.dataURL);
        });

        // Add uploaded files (convert to base64 dataURLs)
        for (const file of uploadedFiles) {
          const reader = new FileReader();
          const dataURL = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          images.push(dataURL);
        }

        const response = await fetch("/api/edit-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: currentPrompt,
            images: images,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to edit image");
        }

        await addImageToCanvas({
          imageDataUrl: data.imageData,
          prompt: currentPrompt,
        });
      } else {
        // Use generate endpoint without images
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: currentPrompt }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to generate image");
        }

        await addImageToCanvas({
          imageDataUrl: data.imageData,
          prompt: currentPrompt,
        });
      }

      // Clear the input
      setPrompt("");
      setCanvasImages([]);
      setUploadedFiles([]);
    } catch (err) {
      console.error("Error generating image:", err);
      // Show error toast
      const errorMessage =
        err instanceof Error && err.message
          ? err.message
          : "Failed to generate/edit image";
      excalidrawAPI.setToast({
        message: errorMessage,
        type: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-2 bg-white rounded-2xl flex-1 max-w-3xl shadow-md z-100 pointer-events-auto">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />
      {(canvasImages.length > 0 || uploadedFiles.length > 0) && (
        <div className="flex gap-2 flex-wrap w-full mb-2">
          {/* Canvas Images - auto-synced with selection */}
          {canvasImages.map((img) => (
            <div
              key={img.id}
              className="flex flex-col items-center gap-2 px-3 py-1.5 rounded-md text-xs border border-blue-300"
            >
              <div className="flex flex-col">
                {img.fileId && (
                  <span className="text-gray-700 font-medium">{img.id}</span>
                )}
                <span className="text-gray-500 text-[10px]">image/png</span>
              </div>
            </div>
          ))}

          {/* Uploaded Files - manual removal */}
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs border border-gray-300"
            >
              <div className="flex flex-col">
                <span className="text-gray-700 font-medium">
                  {file.name.length > 20
                    ? `${file.name.substring(0, 20)}...`
                    : file.name}
                </span>
                <span className="text-gray-500 text-[10px]">
                  {file.type || "unknown"}
                </span>
              </div>
              <X
                className="size-3 cursor-pointer text-gray-400 hover:text-red-500"
                onClick={() => removeUploadedFile(index)}
              />
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 w-full">
        <Select value={selectedMode} onValueChange={setSelectedMode}>
          <SelectTrigger className="w-fit rounded-full shadow-none">
            <SelectValue>
              <div className="flex items-center gap-2">
                {modes.find((mode) => mode.label === selectedMode)?.icon &&
                  (() => {
                    const Icon = modes.find(
                      (mode) => mode.label === selectedMode,
                    )!.icon;
                    return <Icon className="size-3" />;
                  })()}
                {/* <span className="text-xs">{selectedMode}</span> */}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Mode</SelectLabel>
              {modes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <SelectItem key={mode.label} value={mode.label}>
                    <div className="flex items-center gap-2">
                      <Icon className="size-4" />
                      <span>{mode.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Input
          type="text"
          placeholder="Ask Anything..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              prompt.trim() &&
              !isGenerating
            ) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          className="flex-1"
          style={{
            border: "none",
            outline: "none",
            boxShadow: "none",
          }}
        />

        <div className="flex gap-2 items-center">
          <Paperclip
            className="size-4 cursor-pointer hover:text-gray-700"
            onClick={() => fileInputRef.current?.click()}
          />
          <Button
            variant="outline"
            onClick={handleSubmit}
            disabled={!prompt.trim()}
            className="rounded-full aspect-square shadow-none !bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            size="sm"
          >
            {isGenerating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowUp className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
