import clsx from "clsx";

import { ToolButton } from "./ToolButton";
import { createIcon } from "./icons";
import { Minimize } from "lucide-react";

import "./ToolIcon.scss";

type RecenterButtonProps = {
  title?: string;
  onClick(): void;
};

export const RecenterButton = (props: RecenterButtonProps) => {
  return (
    <ToolButton
      className={clsx("Shape")}
      type="button"
      icon={<Minimize />}
      title={props.title}
      aria-label={props.title || "Recenter canvas"}
      data-testid="toolbar-recenter"
      onClick={props.onClick}
    />
  );
};
