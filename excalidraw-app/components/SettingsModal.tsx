import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Progress } from "./ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { SignOutButton } from "@clerk/clerk-react";
import { Sidebar, SidebarContent, SidebarItem } from "./ui/sidebar";
import { BarChart3, CreditCard, Mail, LogOut } from "lucide-react";
import { Button } from "./ui/button";

interface UsageData {
  planName: string;
  imageGenerationLimit: number;
  imageGenerationsUsed: number;
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

  const getProgressPercentage = () => {
    if (!usageData) return 0;
    return (
      (usageData.imageGenerationsUsed / usageData.imageGenerationLimit) * 100
    );
  };

  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (percentage >= 90) return "bg-red-600";
    if (percentage >= 70) return "bg-yellow-600";
    return "bg-blue-600";
  };

  const handleSidebarItemClick = (id: TabId) => {
    if (id === "logout") {
      // Logout is handled separately via SignOutButton
      return;
    }
    setActiveTab(id);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "usage":
        return (
          <div className="space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading...</div>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
                {error}
              </div>
            )}

            {!loading && !error && usageData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Plan:{" "}
                    {usageData.planName.charAt(0).toUpperCase() +
                      usageData.planName.slice(1)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Image Generations
                      </span>
                      <span className="font-medium">
                        {usageData.imageGenerationsUsed} /{" "}
                        {usageData.imageGenerationLimit}
                      </span>
                    </div>
                    <div className="relative">
                      <Progress
                        value={getProgressPercentage()}
                        className="h-3"
                      />
                      <div
                        className={`absolute inset-0 h-3 rounded-full transition-all ${getProgressColor()}`}
                        style={{
                          width: `${getProgressPercentage()}%`,
                        }}
                      />
                    </div>
                  </div>

                  {getProgressPercentage() >= 80 && (
                    <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                      You're approaching your generation limit. Consider
                      upgrading your plan.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "billing":
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Billing & Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Billing and invoice history will be displayed here.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "contact":
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle
                  className="text-2xl"
                  style={{
                    fontFamily: "Alga",
                  }}
                >
                  Contact Us
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  For all support inquiries, including billing issues, receipts,
                  and general assistance, please email{" "}
                  <a
                    href="mailto:opencanvas@gmail.com"
                    className="text-blue-500 underline"
                  >
                    opencanvas@gmail.com
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "logout":
        return(

        )

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto p-10">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 mt-6">
          <Sidebar>
            <SidebarContent>
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                if (item.id === "logout") {
                  return (
                    <SignOutButton key={item.id}>
                      <SidebarItem>
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </SidebarItem>
                    </SignOutButton>
                  );
                }
                return (
                  <SidebarItem
                    key={item.id}
                    isActive={activeTab === item.id}
                    onClick={() => handleSidebarItemClick(item.id)}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </SidebarItem>
                );
              })}
            </SidebarContent>
          </Sidebar>

          <div className="flex-1 min-w-0">{renderContent()}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
