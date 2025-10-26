import { Eye } from "lucide-react";

import "./ToolIcon.scss";

type RecenterButtonProps = {
  title?: string;
  onClick(): void;
};

export const RecenterButton = (props: RecenterButtonProps) => {
  return (
    <button
      className="recenter-button"
      type="button"
      onClick={props.onClick}
      title={props.title}
      aria-label={props.title}
      data-testid="toolbar-recenter"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.5rem",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        borderRadius: "4px",
        color: "var(--icon-fill-color)",
      }}
    >
      <Eye size={20} strokeWidth={1.25} />
    </button>
  );
};
