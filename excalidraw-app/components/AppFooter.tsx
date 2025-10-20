import { Footer } from "@excalidraw/excalidraw/index";
import React from "react";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import { DebugFooter, isVisualDebuggerEnabled } from "./DebugCanvas";
import { ChatOverlay } from "./ChatOverlay";

export const AppFooter = React.memo(
  ({
    onChange,
    excalidrawAPI,
  }: {
    onChange: () => void;
    excalidrawAPI: ExcalidrawImperativeAPI;
  }) => {
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
        <ChatOverlay excalidrawAPI={excalidrawAPI} />
      </Footer>
    );
  },
);
