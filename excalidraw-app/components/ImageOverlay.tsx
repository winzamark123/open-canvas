import { ElementCanvasButtons } from "@excalidraw/excalidraw/components/ElementCanvasButtons";
import { ElementCanvasButton } from "@excalidraw/excalidraw/components/MagicButton";
import {
  useExcalidrawAppState,
  useExcalidrawElements,
} from "@excalidraw/excalidraw/components/App";
import { isImageElement } from "@excalidraw/element";
import { newElementWith, newImageElement } from "@excalidraw/element";
import { RefreshCw, Copy, Loader2 } from "lucide-react";
import { useState } from "react";

import type {
  ExcalidrawImperativeAPI,
  BinaryFileData,
} from "@excalidraw/excalidraw/types";
import type {
  NonDeletedExcalidrawElement,
  ElementsMap,
  ExcalidrawImageElement,
} from "@excalidraw/element/types";

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate image via API
 */
const generateImage = async (prompt: string): Promise<string> => {
  const response = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to generate image");
  }
  return data.imageData;
};

/**
 * Convert image data URL to binary file data for Excalidraw
 */
const createBinaryFileData = async (
  imageDataUrl: string,
): Promise<BinaryFileData> => {
  const blob = await (await fetch(imageDataUrl)).blob();
  const fileId = `image_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 15)}`;
  return {
    id: fileId as BinaryFileData["id"],
    dataURL: imageDataUrl as BinaryFileData["dataURL"],
    mimeType: (blob.type || "image/png") as BinaryFileData["mimeType"],
    created: Date.now(),
    lastRetrieved: Date.now(),
  };
};

// ============================================================================
// Button Configuration Interface
// ============================================================================

interface AIImageButtonConfig {
  icon: React.ComponentType<{ className?: string }>;
  function: (params: {
    imageElement: ExcalidrawImageElement;
    prompt: string;
    excalidrawAPI: ExcalidrawImperativeAPI;
  }) => Promise<void>;
  description: string;
  title: string;
}

// ============================================================================
// Button Action Functions
// ============================================================================

/**
 * Regenerate the current image with the same prompt
 */
const regenerateImageAction = async ({
  imageElement,
  prompt,
  excalidrawAPI,
}: {
  imageElement: ExcalidrawImageElement;
  prompt: string;
  excalidrawAPI: ExcalidrawImperativeAPI;
}) => {
  const imageDataUrl = await generateImage(prompt);
  const binaryFileData = await createBinaryFileData(imageDataUrl);

  excalidrawAPI.addFiles([binaryFileData]);

  const updatedElement = newElementWith(imageElement, {
    fileId: binaryFileData.id,
    customData: {
      ...imageElement.customData,
      generatedAt: Date.now(),
    },
  });

  excalidrawAPI.updateScene({
    elements: excalidrawAPI
      .getSceneElements()
      .map((el) => (el.id === imageElement.id ? updatedElement : el)),
  });

  excalidrawAPI.setToast({ message: "Image regenerated successfully!" });
};

/**
 * Create a duplicate image with the same prompt
 */
const duplicateImageAction = async ({
  imageElement,
  prompt,
  excalidrawAPI,
}: {
  imageElement: ExcalidrawImageElement;
  prompt: string;
  excalidrawAPI: ExcalidrawImperativeAPI;
}) => {
  const imageDataUrl = await generateImage(prompt);
  const binaryFileData = await createBinaryFileData(imageDataUrl);

  excalidrawAPI.addFiles([binaryFileData]);

  const newImage = newImageElement({
    type: "image",
    x: imageElement.x + 50,
    y: imageElement.y + 50,
    width: imageElement.width,
    height: imageElement.height,
    fileId: binaryFileData.id,
    scale: [1, 1] as [number, number],
    customData: {
      prompt: prompt,
      generatedAt: Date.now(),
    },
  });

  excalidrawAPI.updateScene({
    elements: [...excalidrawAPI.getSceneElements(), newImage],
  });

  excalidrawAPI.setToast({ message: "Image duplicated successfully!" });
};

// ============================================================================
// Button Configurations
// ============================================================================

const AI_IMAGE_BUTTON_CONFIGS: AIImageButtonConfig[] = [
  {
    icon: RefreshCw,
    function: regenerateImageAction,
    description: "Regenerate image with the same prompt",
    title: "Regenerate image",
  },
  {
    icon: Copy,
    function: duplicateImageAction,
    description: "Create a variation with the same prompt",
    title: "Create variation",
  },
];

// ============================================================================
// AI Image Buttons Component
// ============================================================================

const AIImageButtons = ({
  excalidrawAPI,
  buttonConfigs,
}: {
  excalidrawAPI: ExcalidrawImperativeAPI;
  buttonConfigs: AIImageButtonConfig[];
}) => {
  const appState = useExcalidrawAppState();
  const elements = useExcalidrawElements();
  const [activeAction, setActiveAction] = useState<string | null>(null);

  // Get selected AI-generated image
  const selectedElements = elements.filter(
    (el: NonDeletedExcalidrawElement) => appState.selectedElementIds[el.id],
  ) as NonDeletedExcalidrawElement[];

  if (selectedElements.length !== 1 || !isImageElement(selectedElements[0])) {
    return null;
  }

  const imageElement = selectedElements[0] as ExcalidrawImageElement;
  const prompt = imageElement.customData?.prompt as string;

  if (!prompt) {
    return null;
  }

  const elementsMap = new Map(
    elements.map((el: NonDeletedExcalidrawElement) => [el.id, el]),
  ) as ElementsMap;

  return (
    <ElementCanvasButtons element={imageElement} elementsMap={elementsMap}>
      {buttonConfigs.map((config, index) => {
        const Icon = config.icon;
        const isActive = activeAction === config.title;

        return (
          <ElementCanvasButton
            key={index}
            title={config.title}
            icon={
              isActive ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Icon className="size-4" />
              )
            }
            checked={false}
            onChange={async () => {
              if (isActive) {
                return;
              }

              setActiveAction(config.title);
              try {
                await config.function({ imageElement, prompt, excalidrawAPI });
              } catch (err) {
                console.error(`Error in ${config.title}:`, err);
                excalidrawAPI.setToast({
                  message: `Error: ${
                    err instanceof Error ? err.message : "Operation failed"
                  }`,
                  type: "error",
                });
              } finally {
                setActiveAction(null);
              }
            }}
          />
        );
      })}
    </ElementCanvasButtons>
  );
};

// ============================================================================
// Main Export
// ============================================================================

export const ImageOverlayComponents = ({
  excalidrawAPI,
}: {
  excalidrawAPI: ExcalidrawImperativeAPI;
}) => {
  return (
    <AIImageButtons
      excalidrawAPI={excalidrawAPI}
      buttonConfigs={AI_IMAGE_BUTTON_CONFIGS}
    />
  );
};
