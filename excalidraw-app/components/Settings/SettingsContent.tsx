import * as React from "react";

interface SettingsContentProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const SettingsContent: React.FC<SettingsContentProps> = ({
  title,
  action,
  children,
}) => {
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
