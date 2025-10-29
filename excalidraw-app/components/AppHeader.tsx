import React from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Header } from "@excalidraw/excalidraw/index";
import { Button } from "./ui/button";
import { Settings, LogOut, LogIn } from "lucide-react";
import { Pricing } from "./Pricing";
import { SettingsModal } from "./Settings/SettingsModal";

export const AppHeader = React.memo(() => {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [isPricingModalOpen, setIsPricingModalOpen] = React.useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = React.useState(false);

  // Handle post-signup checkout
  React.useEffect(() => {
    if (isSignedIn) {
      const urlParams = new URLSearchParams(window.location.search);
      const shouldCheckout = urlParams.get("checkout");
      const pendingPlan = urlParams.get("plan");

      if (shouldCheckout === "true" && pendingPlan && pendingPlan !== "free") {
        // Clean up URL params first
        window.history.replaceState({}, "", window.location.pathname);

        // Trigger checkout
        const initiateCheckout = async () => {
          try {
            const token = await getToken();
            const response = await fetch(
              "/api/stripe/create-checkout-session",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ planName: pendingPlan }),
              },
            );

            const data = await response.json();

            if (!response.ok) {
              throw new Error(
                data.error || "Failed to create checkout session",
              );
            }

            if (data.url) {
              window.location.href = data.url;
            }
          } catch (error) {
            console.error("Error creating checkout session:", error);
            alert(
              error instanceof Error
                ? error.message
                : "Failed to start checkout. Please try again.",
            );
          }
        };

        initiateCheckout();
      }
    }
  }, [isSignedIn, getToken]);

  return (
    <>
      <Header>
        <div
          className="absolute top-4 right-4 flex gap-2"
          style={{ zIndex: 10 }}
        >
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
            <>
              <Button
                onClick={() => setIsPricingModalOpen(true)}
                variant="outline"
              >
                Pricing
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/sign-in")}
              >
                <LogIn className="size-4" />
                Log in
              </Button>
            </>
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
