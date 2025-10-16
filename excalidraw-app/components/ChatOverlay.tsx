import { useState } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { newImageElement } from "@excalidraw/element";
import type { BinaryFileData } from "@excalidraw/element/types";

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
		const fileId = `image_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

		// Create binary file data
		const binaryFileData: BinaryFileData = {
			id: fileId as BinaryFileData["id"],
			dataURL: imageDataUrl,
			mimeType: blob.type || "image/png",
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
		if (!prompt.trim() || isGenerating) return;

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
				message: `Error: ${err instanceof Error ? err.message : "Failed to generate image"}`,
			});
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<div
			style={{
				position: "fixed",
				bottom: "0",
				left: "0",
				right: "0",
				zIndex: 50,
				display: "flex",
				justifyContent: "center",
				padding: "16px",
				pointerEvents: "none",
			}}
		>
			<div
				style={{
					pointerEvents: "auto",
					width: "100%",
					maxWidth: "36rem",
				}}
			>
				<div
					style={{
						backgroundColor: "rgba(255, 255, 255, 0.95)",
						backdropFilter: "blur(8px)",
						borderRadius: "8px",
						border: "1px solid #e5e5e5",
						boxShadow:
							"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
					}}
				>
					<form onSubmit={handleSubmit} style={{ padding: "8px" }}>
						{error && (
							<div
								style={{
									fontSize: "14px",
									color: "#ef4444",
									padding: "0 8px 8px 8px",
								}}
							>
								{error}
							</div>
						)}
						<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
							<input
								type="text"
								value={prompt}
								onChange={(e) => setPrompt(e.target.value)}
								placeholder="Describe an image to generate..."
								disabled={isGenerating}
								style={{
									flex: 1,
									border: "none",
									outline: "none",
									padding: "12px 16px",
									borderRadius: "6px",
									backgroundColor: "transparent",
									fontSize: "16px",
								}}
							/>

							<button
								type="submit"
								disabled={!prompt.trim() || isGenerating}
								style={{
									padding: "12px",
									borderRadius: "6px",
									border: "none",
									backgroundColor:
										!prompt.trim() || isGenerating ? "#9ca3af" : "#3b82f6",
									color: "white",
									cursor:
										!prompt.trim() || isGenerating ? "not-allowed" : "pointer",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									minWidth: "48px",
									minHeight: "48px",
								}}
							>
								{isGenerating ? (
									<div
										style={{
											width: "16px",
											height: "16px",
											border: "2px solid transparent",
											borderTop: "2px solid white",
											borderRadius: "50%",
											animation: "spin 1s linear infinite",
										}}
									/>
								) : (
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
										aria-label="Send message"
									>
										<title>Send message</title>
										<path
											d="M7 11L12 6L17 11M12 18V7"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
											transform="rotate(45 12 12)"
										/>
									</svg>
								)}
							</button>
						</div>
					</form>
				</div>
			</div>

			{/* Keyframes for spinner animation */}
			<style>
				{`
					@keyframes spin {
						from { transform: rotate(0deg); }
						to { transform: rotate(360deg); }
					}
				`}
			</style>
		</div>
	);
};
