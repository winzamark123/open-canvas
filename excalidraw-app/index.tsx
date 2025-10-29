import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { shadcn } from "@clerk/themes";

import "../excalidraw-app/sentry";

import ExcalidrawApp from "./App";
import { SignInPage } from "./components/auth/SignInPage";
import { SignUpPage } from "./components/auth/SignUpPage";

window.__EXCALIDRAW_SHA__ = import.meta.env.VITE_APP_GIT_SHA;

// Get Clerk publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);
registerSW();

root.render(
  <StrictMode>
    <ClerkProvider
      publishableKey={clerkPubKey}
      appearance={{
        theme: shadcn,
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="/*" element={<ExcalidrawApp />} />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
);
