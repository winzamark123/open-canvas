"use client";

import {
	CircleCheckIcon,
	InfoIcon,
	Loader2Icon,
	OctagonXIcon,
	TriangleAlertIcon,
} from "lucide-react";
import { useExcalidrawAppState } from "../App";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	const theme = useExcalidrawAppState().theme;

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
            richColors
			icons={{
				success: <CircleCheckIcon className="size-4" />,
				info: <InfoIcon className="size-4" />,
				warning: <TriangleAlertIcon className="size-4" />,
				error: <OctagonXIcon className="size-4" />,
				loading: <Loader2Icon className="size-4 animate-spin" />,
			}}
			style={
				{
					"--normal-bg": "var(--popup-bg-color)",
					"--normal-text": "var(--popup-text-color)",
					"--normal-border": "var(--default-border-color)",
					"--border-radius": "var(--border-radius-md)",
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };
