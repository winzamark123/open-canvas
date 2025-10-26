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
      className="absolute px-4 flex w-full items-end justify-between"
      style={{
        position: "absolute",
        bottom: "1rem",
        alignItems: "end",
      }}
    >
      <div
        className="absolute bottom-4 flex justify-start items-center self-end gap-2 rounded-2xl bg-white p-2 px-4"
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
