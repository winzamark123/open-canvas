import { Footer } from "@excalidraw/excalidraw/index";
import React from "react";

import { DebugFooter, isVisualDebuggerEnabled } from "./DebugCanvas";

export const AppFooter = React.memo(
	({ onChange }: { onChange: () => void }) => {
		return (
			<Footer>
				{isVisualDebuggerEnabled() && (
					<div
						style={{
							display: "flex",
							gap: ".5rem",
							alignItems: "center",
						}}
					>
						<DebugFooter onChange={onChange} />
					</div>
				)}
			</Footer>
		);
	},
);
