import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { ClerkProvider } from "@clerk/clerk-react";

import "../excalidraw-app/sentry";

import ExcalidrawApp from "./App";

window.__EXCALIDRAW_SHA__ = import.meta.env.VITE_APP_GIT_SHA;

// Get Clerk publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);
registerSW();

root.render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <ExcalidrawApp />
    </ClerkProvider>
  </StrictMode>,
);
