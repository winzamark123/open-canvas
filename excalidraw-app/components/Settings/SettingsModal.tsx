import { useEffect, useState } from "react";
import { useAuth, SignOutButton } from "@clerk/clerk-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Progress } from "../ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Sidebar, SidebarContent, SidebarItem } from "../ui/sidebar";
import { BarChart3, CreditCard, Mail, LogOut, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Billing } from "./Billing";

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
    setActiveTab(id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleUpgradeClick = () => {
    console.log("Upgrade button clicked");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "usage":
        return (
          <div className="space-y-6">
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
              <>
                {/* Top Grid Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Current Usage Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Current Usage</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                          Plan:{" "}
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {usageData.planName.charAt(0).toUpperCase() +
                              usageData.planName.slice(1)}
                          </span>
                        </div>
                        <div className="mb-3 flex justify-between text-sm">
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

                  {/* Next Plan Card */}
                  {usageData.nextPlan && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Upgrade Plan</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {usageData.nextPlan.name.charAt(0).toUpperCase() +
                              usageData.nextPlan.name.slice(1)}
                          </div>
                          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                            ${usageData.nextPlan.priceMonthly}/month
                          </div>
                          <div className="mb-4 space-y-2">
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              • {usageData.nextPlan.imageGenerationLimit} image
                              generations/month
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              •{" "}
                              {usageData.nextPlan.imageGenerationLimit -
                                usageData.imageGenerationLimit}{" "}
                              more generations than current plan
                            </div>
                          </div>
                        </div>
                        <Button onClick={handleUpgradeClick} className="w-full">
                          Upgrade Now
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Premium Plan Message */}
                  {!usageData.nextPlan && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Premium Member
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-400">
                          You're on the highest plan with maximum benefits.
                          Thank you for your support!
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Events Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Recent Image Generations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {usageData.events.length === 0 ? (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                        No image generations yet
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>ID</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usageData.events.map((event) => (
                            <TableRow key={event.id}>
                              <TableCell>{formatDate(event.date)}</TableCell>
                              <TableCell className="capitalize">
                                {event.type.replace("_", " ")}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-gray-500">
                                {event.id.substring(0, 8)}...
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
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
        return (
          <div className="p-4 flex flex-col gap-4">
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
                  href="mailto:opencanvas@gmail.com"
                  className="text-blue-500 underline"
                >
                  opencanvas@gmail.com
                </a>
              </p>
            </div>
          </div>
        );

      case "logout":
        return (
          <div className="p-4 flex flex-col gap-4">
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
