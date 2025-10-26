import clsx from "clsx";

import { ToolButton } from "./ToolButton";
import { createIcon } from "./icons";

import "./ToolIcon.scss";

const recenterIcon = createIcon(
  <g strokeWidth={1.25}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
    <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"></path>
    <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"></path>
  </g>,
  24,
);

type RecenterButtonProps = {
  title?: string;
  onClick(): void;
};

export const RecenterButton = (props: RecenterButtonProps) => {
  return (
    <ToolButton
      className={clsx("Shape")}
      type="button"
      icon={recenterIcon}
      title={props.title}
      aria-label={props.title || "Recenter canvas"}
      data-testid="toolbar-recenter"
      onClick={props.onClick}
    />
  );
};
