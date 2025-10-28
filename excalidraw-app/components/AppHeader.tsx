import React from "react";
import { useUser, SignInButton, SignOutButton } from "@clerk/clerk-react";
import { Header } from "@excalidraw/excalidraw/index";
import { Button } from "./ui/button";
import { Settings, LogOut, LogIn } from "lucide-react";
import { Pricing } from "./Pricing";
import { SettingsModal } from "./Settings/SettingsModal";

export const AppHeader = React.memo(() => {
  const { isSignedIn } = useUser();
  const [isPricingModalOpen, setIsPricingModalOpen] = React.useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = React.useState(false);

  return (
    <>
      <Header>
        <div
          className="absolute top-4 right-4 flex gap-2"
          style={{ zIndex: 10 }}
        >
          <Button onClick={() => setIsPricingModalOpen(true)} variant="outline">
            Pricing
          </Button>
          {isSignedIn ? (
            <>
              <Button
                onClick={() => setIsSettingsModalOpen(true)}
                variant="outline"
                size="icon"
              >
                <Settings className="size-4" />
              </Button>
            </>
          ) : (
            <SignInButton mode="redirect">
              <Button variant="outline">
                <LogIn className="size-4" />
                Log in
              </Button>
            </SignInButton>
          )}
        </div>
      </Header>
      <Pricing
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </>
  );
});

AppHeader.displayName = "AppHeader";
