import { ElementCanvasButtons } from "@excalidraw/excalidraw/components/ElementCanvasButtons";
import { ElementCanvasButton } from "@excalidraw/excalidraw/components/MagicButton";
import {
  useExcalidrawAppState,
  useExcalidrawElements,
} from "@excalidraw/excalidraw/components/App";
import { isImageElement } from "@excalidraw/element";
import { newElementWith, newImageElement } from "@excalidraw/element";
import { RefreshCw, Copy, Loader2, Info, Save, Shuffle } from "lucide-react";
import { useState, useEffect } from "react";
import { useFreeUsage } from "../hooks/useFreeUsage";
import { useAuth } from "@clerk/clerk-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";

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
const generateImage = async (
  prompt: string,
  token: string | null,
): Promise<string> => {
  const response = await fetch("/api/generate-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ prompt }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to generate image");
  }
  return data.imageData;
};

/**
 * Generate image with usage tracking
 */
const generateImageWithUsageTracking = async (
  prompt: string,
  canGenerate: () => boolean,
  incrementUsage: () => void,
  excalidrawAPI: ExcalidrawImperativeAPI,
  token: string | null,
): Promise<string> => {
  // Check if user can generate more images
  if (!canGenerate()) {
    excalidrawAPI.setToast({
      message: "Rate limit reached. Please try again later.",
      type: "error",
    });
    throw new Error("Free generation limit reached");
  }

  const imageData = await generateImage(prompt, token);

  // Increment usage count after successful generation
  incrementUsage();

  return imageData;
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
// Image Metadata Modal Component
// ============================================================================

const ImageMetadataModal = ({
  imageElement,
  open,
  onOpenChange,
  excalidrawAPI,
}: {
  imageElement: ExcalidrawImageElement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  excalidrawAPI: ExcalidrawImperativeAPI;
}) => {
  const analysis = imageElement.customData?.analysis as
    | {
        description: string;
        objects: string[];
        colors: string[];
        style: string;
      }
    | undefined;

  const [editedDescription, setEditedDescription] = useState(
    analysis?.description || "",
  );
  const [editedObjects, setEditedObjects] = useState(
    analysis?.objects?.join(", ") || "",
  );
  const [editedColors, setEditedColors] = useState(
    analysis?.colors?.join(", ") || "",
  );
  const [editedStyle, setEditedStyle] = useState(analysis?.style || "");

  // Update all fields when imageElement changes
  useEffect(() => {
    const newAnalysis = imageElement.customData?.analysis as typeof analysis;
    setEditedDescription(newAnalysis?.description || "");
    setEditedObjects(newAnalysis?.objects?.join(", ") || "");
    setEditedColors(newAnalysis?.colors?.join(", ") || "");
    setEditedStyle(newAnalysis?.style || "");
  }, [imageElement.id]);

  const hasChanges =
    editedDescription !== (analysis?.description || "") ||
    editedObjects !== (analysis?.objects?.join(", ") || "") ||
    editedColors !== (analysis?.colors?.join(", ") || "") ||
    editedStyle !== (analysis?.style || "");

  // Field configuration for the form
  const fields = [
    {
      key: "description",
      label: "Description",
      type: "textarea" as const,
      value: editedDescription,
      onChange: setEditedDescription,
      rows: 3,
      placeholder: "",
    },
    {
      key: "objects",
      label: "Objects",
      type: "input" as const,
      value: editedObjects,
      onChange: setEditedObjects,
      placeholder: "Comma-separated objects",
    },
    {
      key: "colors",
      label: "Colors",
      type: "input" as const,
      value: editedColors,
      onChange: setEditedColors,
      placeholder: "Comma-separated colors",
    },
    {
      key: "style",
      label: "Style",
      type: "input" as const,
      value: editedStyle,
      onChange: setEditedStyle,
      placeholder: "Visual style",
    },
  ];

  const handleSave = () => {
    // Build updated analysis object
    const updatedAnalysis = {
      description: editedDescription,
      objects: editedObjects
        .split(",")
        .map((o) => o.trim())
        .filter((o) => o.length > 0),
      colors: editedColors
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0),
      style: editedStyle,
    };

    const updatedElement = newElementWith(imageElement, {
      customData: {
        ...imageElement.customData,
        analysis: updatedAnalysis,
      },
    });

    excalidrawAPI.updateScene({
      elements: excalidrawAPI
        .getSceneElements()
        .map((el) => (el.id === imageElement.id ? updatedElement : el)),
    });

    excalidrawAPI.setToast({ message: "Analysis updated successfully!" });
    onOpenChange(false);
  };

  const handleCancel = () => {
    const currentAnalysis = imageElement.customData
      ?.analysis as typeof analysis;
    setEditedDescription(currentAnalysis?.description || "");
    setEditedObjects(currentAnalysis?.objects?.join(", ") || "");
    setEditedColors(currentAnalysis?.colors?.join(", ") || "");
    setEditedStyle(currentAnalysis?.style || "");
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          const currentAnalysis = imageElement.customData
            ?.analysis as typeof analysis;
          setEditedDescription(currentAnalysis?.description || "");
          setEditedObjects(currentAnalysis?.objects?.join(", ") || "");
          setEditedColors(currentAnalysis?.colors?.join(", ") || "");
          setEditedStyle(currentAnalysis?.style || "");
        }
        onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Image Analysis</DialogTitle>
          <DialogDescription>
            Edit the AI analysis for this image
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {analysis &&
            fields.map((field) => (
              <div key={field.key}>
                <h3 className="font-semibold text-sm mb-1">{field.label}</h3>
                {field.type === "textarea" ? (
                  <textarea
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="w-full text-sm text-gray-700 bg-gray-50 p-3 rounded border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={field.rows}
                    placeholder={field.placeholder}
                    autoFocus={field.key === "description"}
                  />
                ) : (
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="w-full text-sm text-gray-700 bg-gray-50 p-3 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
            <Save className="size-4 mr-1" />
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// Button Configuration Interface
// ============================================================================

interface AIImageButtonConfig {
  icon: React.ComponentType<{ className?: string }>;
  function?: (params: {
    imageElement: ExcalidrawImageElement;
    description: string;
    excalidrawAPI: ExcalidrawImperativeAPI;
    canGenerate: () => boolean;
    incrementUsage: () => void;
    token: string | null;
  }) => Promise<void>;
  onClick?: () => void;
  description: string;
  title: string;
}

// ============================================================================
// Button Action Functions
// ============================================================================

/**
 * Regenerate the current image with the same description
 */
const regenerateImageAction = async ({
  imageElement,
  description,
  excalidrawAPI,
  canGenerate,
  incrementUsage,
  token,
}: {
  imageElement: ExcalidrawImageElement;
  description: string;
  excalidrawAPI: ExcalidrawImperativeAPI;
  canGenerate: () => boolean;
  incrementUsage: () => void;
  token: string | null;
}) => {
  const imageDataUrl = await generateImageWithUsageTracking(
    description,
    canGenerate,
    incrementUsage,
    excalidrawAPI,
    token,
  );
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
 * Create a duplicate image with the same description
 */
const duplicateImageAction = async ({
  imageElement,
  description,
  excalidrawAPI,
  canGenerate,
  incrementUsage,
  token,
}: {
  imageElement: ExcalidrawImageElement;
  description: string;
  excalidrawAPI: ExcalidrawImperativeAPI;
  canGenerate: () => boolean;
  incrementUsage: () => void;
  token: string | null;
}) => {
  const imageDataUrl = await generateImageWithUsageTracking(
    description,
    canGenerate,
    incrementUsage,
    excalidrawAPI,
    token,
  );
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
      generatedAt: Date.now(),
    },
  });

  excalidrawAPI.updateScene({
    elements: [...excalidrawAPI.getSceneElements(), newImage],
  });

  excalidrawAPI.setToast({ message: "Image duplicated successfully!" });
};

/**
 * Copy the image as binary data to clipboard
 */
const copyImageToBinaryAction = async ({
  imageElement,
  excalidrawAPI,
}: {
  imageElement: ExcalidrawImageElement;
  description: string;
  excalidrawAPI: ExcalidrawImperativeAPI;
}) => {
  // Get the file data using the fileId from the image element
  const fileId = imageElement.fileId;

  if (!fileId) {
    throw new Error("Image has no file ID");
  }

  const files = excalidrawAPI.getFiles();
  const fileData = files[fileId];

  if (!fileData) {
    throw new Error("Image file not found");
  }

  // Convert data URL to blob
  const blob = await (await fetch(fileData.dataURL)).blob();

  // Convert to PNG if needed (for better clipboard support)
  let pngBlob = blob;
  if (blob.type !== "image/png") {
    // Create an image element to convert the blob to PNG
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = fileData.dataURL;
    });

    canvas.width = img.width;
    canvas.height = img.height;
    ctx?.drawImage(img, 0, 0);

    pngBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), "image/png");
    });
  }

  // Copy to clipboard using Clipboard API with PNG format
  await navigator.clipboard.write([
    new ClipboardItem({
      "image/png": pngBlob,
    }),
  ]);

  excalidrawAPI.setToast({ message: "Image copied to clipboard!" });
};

// ============================================================================
// Button Configurations
// ============================================================================

const getAIImageButtonConfigs = (
  setShowMetadataModal: (show: boolean) => void,
): AIImageButtonConfig[] => [
  {
    icon: Copy,
    function: copyImageToBinaryAction,
    description: "Copy image as binary to clipboard",
    title: "Copy image",
  },
  {
    icon: RefreshCw,
    function: regenerateImageAction,
    description: "Regenerate image with the same prompt",
    title: "Regenerate image",
  },
  {
    icon: Shuffle,
    function: duplicateImageAction,
    description: "Create a variation with the same prompt",
    title: "Create variation",
  },
  {
    icon: Info,
    onClick: () => setShowMetadataModal(true),
    description: "View image metadata and prompt",
    title: "View metadata",
  },
];

// ============================================================================
// AI Image Buttons Component
// ============================================================================

const AIImageButtons = ({
  excalidrawAPI,
}: {
  excalidrawAPI: ExcalidrawImperativeAPI;
}) => {
  const { getToken } = useAuth();
  const { canGenerate, incrementUsage } = useFreeUsage();

  const appState = useExcalidrawAppState();
  const elements = useExcalidrawElements();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [showMetadataModal, setShowMetadataModal] = useState(false);

  // Get selected AI-generated image
  const selectedElements = elements.filter(
    (el: NonDeletedExcalidrawElement) => appState.selectedElementIds[el.id],
  ) as NonDeletedExcalidrawElement[];

  if (selectedElements.length !== 1 || !isImageElement(selectedElements[0])) {
    return null;
  }

  const imageElement = selectedElements[0] as ExcalidrawImageElement;
  const analysis = imageElement.customData?.analysis as
    | {
        description: string;
        objects: string[];
        colors: string[];
        style: string;
      }
    | undefined;

  if (!analysis?.description) {
    return null;
  }

  const elementsMap = new Map(
    elements.map((el: NonDeletedExcalidrawElement) => [el.id, el]),
  ) as ElementsMap;

  const buttonConfigs = getAIImageButtonConfigs(setShowMetadataModal);

  return (
    <>
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

                if (config.onClick) {
                  config.onClick();
                  return;
                }

                if (config.function) {
                  setActiveAction(config.title);
                  try {
                    // Get the Clerk session token
                    const token = await getToken();

                    await config.function({
                      imageElement,
                      description: analysis.description,
                      excalidrawAPI,
                      canGenerate,
                      incrementUsage,
                      token,
                    });
                  } catch (err) {
                    console.error(`Error in ${config.title}:`, err);
                    // Don't show additional error toast for usage limit reached
                    if (
                      err instanceof Error &&
                      err.message === "Free generation limit reached"
                    ) {
                      // Toast is already shown in generateImageWithUsageTracking
                      return;
                    }
                    excalidrawAPI.setToast({
                      message: `Error: ${
                        err instanceof Error ? err.message : "Operation failed"
                      }`,
                      type: "error",
                    });
                  } finally {
                    setActiveAction(null);
                  }
                }
              }}
            />
          );
        })}
      </ElementCanvasButtons>
      <ImageMetadataModal
        imageElement={imageElement}
        open={showMetadataModal}
        onOpenChange={setShowMetadataModal}
        excalidrawAPI={excalidrawAPI}
      />
    </>
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
  return <AIImageButtons excalidrawAPI={excalidrawAPI} />;
};
