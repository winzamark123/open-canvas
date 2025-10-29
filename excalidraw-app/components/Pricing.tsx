import React from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Check } from "lucide-react";

interface PricingTier {
  name: string;
  subheading: string;
  price: number;
  features: string[];
  cta: string;
  popular?: boolean;
  borderColor?: string;
  planName: string;
}

interface PricingProps {
  isOpen: boolean;
  onClose: () => void;
}

const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    subheading: "Perfect for getting started",
    price: 0,
    features: ["Basic drawing features", "Limited image generations"],
    cta: "Get Started",
    borderColor: "border-border",
    planName: "free",
  },
  {
    name: "Standard",
    subheading: "Great for individuals",
    price: 5,
    features: [
      "All drawing features",
      "60 image generations/edits per month",
      "Priority support",
    ],
    cta: "Upgrade to Standard",
    popular: true,
    borderColor: "border-primary",
    planName: "standard",
  },
  {
    name: "Pro",
    subheading: "Best for power users",
    price: 11,
    features: [
      "All advanced features",
      "150 image generations/edits per month",
      "Premium support",
      "Custom AI models",
      "Unlimited private projects",
    ],
    cta: "Upgrade to Pro",
    borderColor: "border-rose-400",
    planName: "pro",
  },
];

export const Pricing: React.FC<PricingProps> = ({ isOpen, onClose }) => {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = React.useState<string | null>(null);

  const handleUpgrade = async (tier: PricingTier) => {
    // Not signed in - redirect to sign in with return URL for all tiers
    if (!isSignedIn) {
      // For free tier, just redirect to home after sign in
      // For paid tiers, pass the plan via URL parameter for checkout
      const redirectUrl =
        tier.planName === "free"
          ? "/"
          : `/?checkout=true&plan=${tier.planName}`;

      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(
        redirectUrl,
      )}`;
      return;
    }

    // Free tier - already signed in, just close the modal
    if (tier.planName === "free") {
      onClose();
      return;
    }

    // User is signed in - create checkout session
    try {
      setIsLoading(tier.planName);

      const token = await getToken();
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planName: tier.planName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
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
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto p-10">
        <DialogHeader>
          <DialogTitle
            className="text-4xl"
            style={{
              fontFamily: "Alga",
            }}
          >
            AI brought into your favorite{" "}
            <span className="font-bold italic underline decoration-2 underline-offset-4">
              whiteboard
            </span>
          </DialogTitle>
          <DialogDescription className="text-lg">
            Select the perfect plan for your creative needs
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={`relative flex flex-col ${
                  tier.popular ? "border-primary" : tier.borderColor
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="px-3 py-1">Popular</Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.subheading}</CardDescription>
                </CardHeader>

                <CardContent className="flex-grow">
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold">${tier.price}</span>
                      <span className="text-muted-foreground ml-2">/month</span>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full cursor-pointer"
                    variant={tier.popular ? "default" : "outline"}
                    onClick={() => handleUpgrade(tier)}
                    disabled={isLoading === tier.planName}
                  >
                    {isLoading === tier.planName ? "Loading..." : tier.cta}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
