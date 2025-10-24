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
      // className="layer-ui__wrapper__footer App-menu App-menu_bottom gap-2"
      className="absolute bottom-2 px-4 flex w-full justify-justify-evenly items-center"
      style={{
        position: "absolute",
        bottom: "0.5rem",
      }}
    >
      <div className="flex justify-start">
        <div className="flex gap-2 rounded-md bg-white border p-1">
          <UndoRedoActions renderAction={actionManager.renderAction} />
          {/* <Section heading="canvasActions"> */}
          <ZoomActions
            renderAction={actionManager.renderAction}
            zoom={appState.zoom}
          />
        </div>
        {/* </Section> */}
      </div>
      <div className="w-full flex items-center justify-center pointer-events-none">
        <FooterCenterTunnel.Out />
      </div>
      {/* <div
        className={clsx("layer-ui__wrapper__footer-right zen-mode-transition", {
          "transition-right": appState.zenModeEnabled,
        })}
      >
        <div style={{ position: "relative" }}>
          {renderWelcomeScreen && <WelcomeScreenHelpHintTunnel.Out />}
          <HelpButton
            onClick={() => actionManager.executeAction(actionShortcuts)}
          />
        </div>
      </div> */}
      <ExitZenModeAction
        actionManager={actionManager}
        showExitZenModeBtn={showExitZenModeBtn}
      />
    </footer>
  );
};

export default Footer;
Footer.displayName = "Footer";
