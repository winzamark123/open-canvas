import clsx from "clsx";

import { useTunnels } from "../../context/tunnels";
import { ExitZenModeAction, UndoRedoActions, ZoomActions } from "../Actions";

import type { ActionManager } from "../../actions/manager";
import type { UIAppState } from "../../types";

const Footer = ({
  appState,
  actionManager,
  showExitZenModeBtn,
  renderWelcomeScreen,
}: {
  appState: UIAppState;
  actionManager: ActionManager;
  showExitZenModeBtn: boolean;
  renderWelcomeScreen: boolean;
}) => {
  const { FooterCenterTunnel, WelcomeScreenHelpHintTunnel } = useTunnels();

  return (
    <footer
      role="contentinfo"
      className="absolute bottom-2 px-4 flex w-full items-end justify-between"
      style={{
        position: "absolute",
        bottom: "0.5rem",
        alignItems: "end",
      }}
    >
      <div
        className="flex justify-start items-center self-end gap-2 rounded-md bg-white p-1 px-2"
        style={{
          height: "fit-content",
        }}
      >
        <UndoRedoActions renderAction={actionManager.renderAction} />
        <ZoomActions
          renderAction={actionManager.renderAction}
          zoom={appState.zoom}
        />
      </div>
      <div className="w-full flex items-center justify-center pointer-events-none">
        <FooterCenterTunnel.Out />
      </div>
      <ExitZenModeAction
        actionManager={actionManager}
        showExitZenModeBtn={showExitZenModeBtn}
      />
    </footer>
  );
};

export default Footer;
Footer.displayName = "Footer";
