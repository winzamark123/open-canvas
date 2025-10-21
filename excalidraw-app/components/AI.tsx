import {
  DiagramToCodePlugin,
  exportToBlob,
  getTextFromElements,
  MIME_TYPES,
  TTDDialog,
} from "@excalidraw/excalidraw";
import { getDataURL } from "@excalidraw/excalidraw/data/blob";
import { safelyParseJSON } from "@excalidraw/common";
import { ElementCanvasButtons } from "@excalidraw/excalidraw/components/ElementCanvasButtons";
import { ElementCanvasButton } from "@excalidraw/excalidraw/components/MagicButton";
import {
  useExcalidrawAppState,
  useExcalidrawElements,
} from "@excalidraw/excalidraw/components/App";
import { isImageElement } from "@excalidraw/element";
import { newElementWith } from "@excalidraw/element";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

import type {
  ExcalidrawImperativeAPI,
  BinaryFileData,
} from "@excalidraw/excalidraw/types";
import type {
  NonDeletedExcalidrawElement,
  ExcalidrawImageElement,
  ElementsMap,
} from "@excalidraw/element/types";

const ImageRegenerateButton = ({
  excalidrawAPI,
}: {
  excalidrawAPI: ExcalidrawImperativeAPI;
}) => {
  const appState = useExcalidrawAppState();
  const elements = useExcalidrawElements();
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Get the selected element
  const selectedElements = elements.filter(
    (el: NonDeletedExcalidrawElement) => appState.selectedElementIds[el.id],
  ) as NonDeletedExcalidrawElement[];

  // Only show button if exactly one image element is selected and it's AI-generated
  if (
    selectedElements.length !== 1 ||
    !isImageElement(selectedElements[0]) ||
    !selectedElements[0].customData?.aiGenerated
  ) {
    return null;
  }

  const imageElement = selectedElements[0];
  const prompt = imageElement.customData?.prompt as string;

  if (!prompt) {
    return null;
  }

  const handleRegenerate = async () => {
    if (isRegenerating) {
      return;
    }

    setIsRegenerating(true);

    try {
      // Call the image generation API
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate image");
      }

      // Convert the new image data
      const imageDataUrl = data.imageData;
      const blob = await (await fetch(imageDataUrl)).blob();
      const fileId = `image_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 15)}`;

      const binaryFileData: BinaryFileData = {
        id: fileId as BinaryFileData["id"],
        dataURL: imageDataUrl as BinaryFileData["dataURL"],
        mimeType: (blob.type || "image/png") as BinaryFileData["mimeType"],
        created: Date.now(),
        lastRetrieved: Date.now(),
      };

      // Add new file
      excalidrawAPI.addFiles([binaryFileData]);

      // Update the element with the new file ID
      const updatedElement = newElementWith(imageElement, {
        fileId: fileId as BinaryFileData["id"],
        customData: {
          ...imageElement.customData,
          generatedAt: Date.now(),
        },
      });

      // Update the scene
      excalidrawAPI.updateScene({
        elements: excalidrawAPI
          .getSceneElements()
          .map((el) => (el.id === imageElement.id ? updatedElement : el)),
      });

      excalidrawAPI.setToast({
        message: "Image regenerated successfully!",
      });
    } catch (err) {
      console.error("Error regenerating image:", err);
      excalidrawAPI.setToast({
        message: `Error: ${
          err instanceof Error ? err.message : "Failed to regenerate image"
        }`,
        type: "error",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  // Get elementsMap for ElementCanvasButtons
  const elementsMap = new Map(
    elements.map((el: NonDeletedExcalidrawElement) => [el.id, el]),
  ) as ElementsMap;

  return (
    <ElementCanvasButtons element={imageElement} elementsMap={elementsMap}>
      <ElementCanvasButton
        title="Regenerate image with same prompt"
        icon={<RefreshCw className="size-4" />}
        checked={false}
        onChange={handleRegenerate}
      />
    </ElementCanvasButtons>
  );
};

export const AIComponents = ({
  excalidrawAPI,
}: {
  excalidrawAPI: ExcalidrawImperativeAPI;
}) => {
  return (
    <>
      <ImageRegenerateButton excalidrawAPI={excalidrawAPI} />
      <DiagramToCodePlugin
        generate={async ({ frame, children }) => {
          const appState = excalidrawAPI.getAppState();

          const blob = await exportToBlob({
            elements: children,
            appState: {
              ...appState,
              exportBackground: true,
              viewBackgroundColor: appState.viewBackgroundColor,
            },
            exportingFrame: frame,
            files: excalidrawAPI.getFiles(),
            mimeType: MIME_TYPES.jpg,
          });

          const dataURL = await getDataURL(blob);

          const textFromFrameChildren = getTextFromElements(children);

          const response = await fetch(
            `${
              import.meta.env.VITE_APP_AI_BACKEND
            }/v1/ai/diagram-to-code/generate`,
            {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                texts: textFromFrameChildren,
                image: dataURL,
                theme: appState.theme,
              }),
            },
          );

          if (!response.ok) {
            const text = await response.text();
            const errorJSON = safelyParseJSON(text);

            if (!errorJSON) {
              throw new Error(text);
            }

            if (errorJSON.statusCode === 429) {
              return {
                html: `<html>
                <body style="margin: 0; text-align: center">
                <div style="display: flex; align-items: center; justify-content: center; flex-direction: column; height: 100vh; padding: 0 60px">
                  <div style="color:red">Too many requests today,</br>please try again tomorrow!</div>
                  </br>
                  </br>
                  <div>You can also try <a href="${
                    import.meta.env.VITE_APP_PLUS_LP
                  }/plus?utm_source=excalidraw&utm_medium=app&utm_content=d2c" target="_blank" rel="noopener">Excalidraw+</a> to get more requests.</div>
                </div>
                </body>
                </html>`,
              };
            }

            throw new Error(errorJSON.message || text);
          }

          try {
            const { html } = await response.json();

            if (!html) {
              throw new Error("Generation failed (invalid response)");
            }
            return {
              html,
            };
          } catch (error: any) {
            throw new Error("Generation failed (invalid response)");
          }
        }}
      />

      <TTDDialog
        onTextSubmit={async (input) => {
          try {
            const response = await fetch(
              `${
                import.meta.env.VITE_APP_AI_BACKEND
              }/v1/ai/text-to-diagram/generate`,
              {
                method: "POST",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt: input }),
              },
            );

            const rateLimit = response.headers.has("X-Ratelimit-Limit")
              ? parseInt(response.headers.get("X-Ratelimit-Limit") || "0", 10)
              : undefined;

            const rateLimitRemaining = response.headers.has(
              "X-Ratelimit-Remaining",
            )
              ? parseInt(
                  response.headers.get("X-Ratelimit-Remaining") || "0",
                  10,
                )
              : undefined;

            const json = await response.json();

            if (!response.ok) {
              if (response.status === 429) {
                return {
                  rateLimit,
                  rateLimitRemaining,
                  error: new Error(
                    "Too many requests today, please try again tomorrow!",
                  ),
                };
              }

              throw new Error(json.message || "Generation failed...");
            }

            const generatedResponse = json.generatedResponse;
            if (!generatedResponse) {
              throw new Error("Generation failed...");
            }

            return { generatedResponse, rateLimit, rateLimitRemaining };
          } catch (err: any) {
            throw new Error("Request failed");
          }
        }}
      />
    </>
  );
};
