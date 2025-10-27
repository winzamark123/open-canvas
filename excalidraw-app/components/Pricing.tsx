import React from "react";
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
  },
];

export const Pricing: React.FC<PricingProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choose Your Plan</DialogTitle>
          <DialogDescription>
            Select the perfect plan for your creative needs
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={`relative flex flex-col ${
                  tier.popular ? "border-primary" : "border-border"
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
                    className="w-full"
                    variant={tier.popular ? "default" : "outline"}
                    onClick={onClose}
                  >
                    {tier.cta}
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
