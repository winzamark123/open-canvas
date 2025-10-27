import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Progress } from "./ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { SignOutButton } from "@clerk/clerk-react";

interface UsageData {
  planName: string;
  imageGenerationLimit: number;
  imageGenerationsUsed: number;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { getToken } = useAuth();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

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
                    <Progress value={getProgressPercentage()} className="h-3" />
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
                    You're approaching your generation limit. Consider upgrading
                    your plan.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
