import { useEffect, useState } from "react";
import { useAuth, SignOutButton } from "@clerk/clerk-react";
import { Dialog, DialogContent } from "../ui/dialog";
import { Sidebar, SidebarContent, SidebarItem } from "../ui/sidebar";
import {
  BarChart3,
  CreditCard,
  Mail,
  LogOut,
  GithubIcon,
  TwitterIcon,
  Linkedin,
} from "lucide-react";
import { Billing } from "./Billing";
import { Usage } from "./Usage";

interface Event {
  id: string;
  date: string;
  type: string;
}

interface NextPlan {
  name: string;
  imageGenerationLimit: number;
  priceMonthly: string;
}

interface UsageData {
  planName: string;
  imageGenerationLimit: number;
  imageGenerationsUsed: number;
  events: Event[];
  nextPlan: NextPlan | null;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabId = "usage" | "billing" | "contact" | "logout";

interface SidebarItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sidebarItems: SidebarItem[] = [
  { id: "usage", label: "Usage", icon: BarChart3 },
  { id: "billing", label: "Billing & Invoices", icon: CreditCard },
  { id: "contact", label: "Contact Us", icon: Mail },
  { id: "logout", label: "Logout", icon: LogOut },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { getToken } = useAuth();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("usage");

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsageData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        if (!token) {
          throw new Error("No authentication token");
        }

        const response = await fetch("/api/user-usage", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch usage data");
        }

        const data = await response.json();
        setUsageData(data);
      } catch (err) {
        console.error("Error fetching usage data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchUsageData();
  }, [isOpen, getToken]);

  const handleSidebarItemClick = (id: TabId) => {
    setActiveTab(id);
  };

  const handleUpgradeClick = async () => {
    if (!usageData?.nextPlan) {
      console.error("No next plan available");
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        throw new Error("No authentication token");
      }

      // Create checkout session
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planName: usageData.nextPlan.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const { url } = await response.json();

      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
      setError(
        err instanceof Error ? err.message : "Failed to start checkout process",
      );
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "usage":
        return (
          <Usage
            usageData={usageData}
            loading={loading}
            error={error}
            onUpgrade={handleUpgradeClick}
          />
        );

      case "billing":
        return (
          <Billing
            onManageSubscription={() => {
              // TODO: Integrate with Stripe billing portal
              console.log("Manage subscription clicked");
            }}
          />
        );
      case "contact":
        const socials = [
          {
            icon: GithubIcon,
            href: "https://github.com/winzamark123",
          },
          {
            icon: TwitterIcon,
            href: "https://twitter.com/winzamark12",
          },
          {
            icon: Linkedin,
            href: "https://linkedin.com/in/teeranadecheng",
          },
        ];

        return (
          <div className="p-4 flex flex-col gap-4 h-full relative">
            <h2
              className="text-3xl"
              style={{
                fontFamily: "Alga",
              }}
            >
              Contact Us
            </h2>
            <div>
              <p className="text-gray-600 dark:text-gray-400">
                For all support inquiries, including billing issues, receipts,
                and general assistance, please email{" "}
                <a
                  href="mailto:winzamark12@gmail.com"
                  className="text-blue-500 underline"
                >
                  winzamark12@gmail.com
                </a>
              </p>
            </div>
            <div className="absolute bottom-4 right-4 flex gap-3">
              {socials.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                  </a>
                );
              })}
            </div>
          </div>
        );

      case "logout":
        return (
          <div className="p-4 flex flex-col gap-4 h-full relative">
            <h2
              className="text-3xl"
              style={{
                fontFamily: "Alga",
              }}
            >
              Logout
            </h2>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to log out of your account?
              </p>
            </div>
            <div className="absolute bottom-4 right-4">
              <SignOutButton>
                <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px] h-[600px] max-h-[85vh] flex flex-col p-8">
        <div className="flex flex-1 min-h-0">
          <Sidebar className="flex-shrink-0 pr-4">
            <SidebarContent className="p-0 h-full flex flex-col justify-between">
              <div className="flex flex-col gap-2">
                {sidebarItems
                  .filter((item) => item.id !== "logout")
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarItem
                        key={item.id}
                        isActive={activeTab === item.id}
                        onClick={() => handleSidebarItemClick(item.id)}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </SidebarItem>
                    );
                  })}
              </div>
              <div className="flex flex-col gap-2">
                {sidebarItems
                  .filter((item) => item.id === "logout")
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarItem
                        key={item.id}
                        isActive={activeTab === item.id}
                        onClick={() => handleSidebarItemClick(item.id)}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </SidebarItem>
                    );
                  })}
              </div>
            </SidebarContent>
          </Sidebar>

          <div className="flex-1 min-w-0 overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
