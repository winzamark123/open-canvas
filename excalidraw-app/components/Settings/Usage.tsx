import * as React from "react";
import { Progress } from "../ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { SettingsContent } from "./SettingsContent";
import { ArrowRight } from "lucide-react";
import { Loader2 } from "lucide-react";

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

interface UsageProps {
  usageData?: UsageData | null;
  loading?: boolean;
  error?: string | null;
  onUpgrade?: () => void;
}

export const Usage: React.FC<UsageProps> = ({
  usageData,
  loading = false,
  error = null,
  onUpgrade,
}) => {
  const getProgressPercentage = () => {
    if (!usageData) return 0;
    return (
      (usageData.imageGenerationsUsed / usageData.imageGenerationLimit) * 100
    );
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
    onUpgrade?.();
  };

  if (!usageData) {
    return null;
  }

  return (
    <SettingsContent title="Usage" loading={loading} error={error}>
      <div className="space-y-6">
        {/* Top Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Usage Card */}
          <Card>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 text-2xl font-bold text-black">
                  Plan:{" "}
                  <span className="font-medium text-black">
                    {usageData.planName.charAt(0).toUpperCase() +
                      usageData.planName.slice(1)}
                  </span>
                </div>
                <div className="mb-3 flex justify-between text-sm">
                  <span className="text-black">Image Generations</span>
                  <span className="font-medium text-black">
                    {usageData.imageGenerationsUsed} /{" "}
                    {usageData.imageGenerationLimit}
                  </span>
                </div>
                <div className="relative">
                  <Progress value={getProgressPercentage()} />
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

          {/* Next Plan Card */}
          {usageData.nextPlan && (
            <Card>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 text-2xl font-bold text-black">
                    {usageData.nextPlan.name.charAt(0).toUpperCase() +
                      usageData.nextPlan.name.slice(1)}
                  </div>
                  <div className="mb-4 text-sm text-black">
                    ${usageData.nextPlan.priceMonthly}/month
                  </div>
                  <div className="mb-4 space-y-2">
                    <div className="text-sm text-black">
                      • {usageData.nextPlan.imageGenerationLimit} image
                      generations/month
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full cursor-pointer"
                  onClick={handleUpgradeClick}
                >
                  Upgrade Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Premium Plan Message */}
          {!usageData.nextPlan && (
            <Card>
              <CardContent>
                <h2 className="text-lg font-semibold text-black">
                  Premium Member
                </h2>
                <p className="text-black">
                  Please contact us if you would like to upgrade to an
                  Enterprise plan.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Events Table */}
        <div className="">
          <h3 className="text-lg font-semibold text-black">Recent Activity</h3>
          {usageData.events.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-black">No activity yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black">Date</TableHead>
                  <TableHead className="text-black">Type</TableHead>
                  <TableHead className="text-black">ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageData.events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="text-black">
                      {formatDate(event.date)}
                    </TableCell>
                    <TableCell className="capitalize text-black">
                      {event.type.replace("_", " ")}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-black">
                      {event.id.substring(0, 8)}...
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </SettingsContent>
  );
};
