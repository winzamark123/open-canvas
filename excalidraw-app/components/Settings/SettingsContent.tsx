import * as React from "react";
import { Loader2 } from "lucide-react";

interface SettingsContentProps {
  title: string;
  action?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
  error?: string | null;
}

export const SettingsContent: React.FC<SettingsContentProps> = ({
  title,
  action,
  loading = false,
  children,
  error = null,
}) => {
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="size-10 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2
          className="text-3xl"
          style={{
            fontFamily: "Alga",
          }}
        >
          {title}
        </h2>
        {action && <div>{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
};
