import { actionLoadScene, actionShortcuts } from "../../actions";
import { getShortcutFromShortcutName } from "../../actions/shortcuts";
import { useTunnels } from "../../context/tunnels";
import { useUIAppState } from "../../context/ui-appState";
import { t, useI18n } from "../../i18n";
import { useDevice, useExcalidrawActionManager } from "../App";
import { ExcalidrawLogo } from "../ExcalidrawLogo";
import { HelpIcon, LoadIcon, usersIcon } from "../icons";

import type { JSX } from "react";

const WelcomeScreenMenuItemContent = ({
  icon,
  shortcut,
  children,
}: {
  icon?: JSX.Element;
  shortcut?: string | null;
  children: React.ReactNode;
}) => {
  const device = useDevice();
  return (
    <>
      <div className="welcome-screen-menu-item__icon">{icon}</div>
      <div className="welcome-screen-menu-item__text">{children}</div>
      {shortcut && !device.editor.isMobile && (
        <div className="welcome-screen-menu-item__shortcut">{shortcut}</div>
      )}
    </>
  );
};
WelcomeScreenMenuItemContent.displayName = "WelcomeScreenMenuItemContent";

const WelcomeScreenMenuItem = ({
  onSelect,
  children,
  icon,
  shortcut,
  className = "",
  ...props
}: {
  onSelect: () => void;
  children: React.ReactNode;
  icon?: JSX.Element;
  shortcut?: string | null;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      {...props}
      type="button"
      className={`welcome-screen-menu-item ${className}`}
      onClick={onSelect}
    >
      <WelcomeScreenMenuItemContent icon={icon} shortcut={shortcut}>
        {children}
      </WelcomeScreenMenuItemContent>
    </button>
  );
};
WelcomeScreenMenuItem.displayName = "WelcomeScreenMenuItem";

const WelcomeScreenMenuItemLink = ({
  children,
  href,
  icon,
  shortcut,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  href: string;
  icon?: JSX.Element;
  shortcut?: string | null;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  return (
    <a
      {...props}
      className={`welcome-screen-menu-item ${className}`}
      href={href}
      target="_blank"
      rel="noopener"
    >
      <WelcomeScreenMenuItemContent icon={icon} shortcut={shortcut}>
        {children}
      </WelcomeScreenMenuItemContent>
    </a>
  );
};
WelcomeScreenMenuItemLink.displayName = "WelcomeScreenMenuItemLink";

const Center = ({ children }: { children?: React.ReactNode }) => {
  const { WelcomeScreenCenterTunnel } = useTunnels();
  return (
    <WelcomeScreenCenterTunnel.In>
      <div className="welcome-screen-center">
        {children || (
          <>
            <Logo />
            <Heading>{t("welcomeScreen.defaults.center_heading")}</Heading>
            <Menu>
              <MenuItemLoadScene />
              <MenuItemHelp />
            </Menu>
          </>
        )}
      </div>
    </WelcomeScreenCenterTunnel.In>
  );
};
Center.displayName = "Center";

const Logo = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="welcome-screen-center__logo welcome-screen-decor">
      {children || (
        <>
          <svg
            viewBox="0 0 1024 1024"
            xmlns="http://www.w3.org/2000/svg"
            className="welcome-screen-favicon"
            style={{ width: "60px", height: "60px" }}
          >
            <path
              fill="currentColor"
              d="M263.991 540.742C357.404 546.475 438.719 621.843 493.03 691.886C499.986 700.857 506.22 710.298 512.219 719.925C520.491 703.926 532.675 689.273 543.951 675.329C599.853 606.199 668.881 550.119 760.574 541.854C760.836 553.769 760.933 565.687 760.866 577.604C760.908 593.86 761.172 611.458 760.611 627.598C752.184 626.14 737.913 625.486 729.319 625.448C690.051 624.964 651.136 632.906 615.197 648.736C581.19 664.026 553.668 685.158 533.634 717.31C527.565 727.051 522.434 740.265 518.384 750.937C513.334 750.731 507.386 750.834 502.265 750.811L502.002 748.942C497.521 718.144 470.255 688.284 445.998 670.019C397.233 633.3 323.864 618.58 263.972 627.513L263.991 540.742Z"
            />
            <path
              fill="currentColor"
              d="M519.886 278.749C523.42 281.448 537.71 296.531 541.354 300.236C556.221 315.428 571.194 330.517 586.27 345.502C583.576 348.099 580.709 350.727 578.088 353.314C560.915 370.642 548.876 395.737 546.908 420.174C545.937 432.222 546.425 446.361 546.412 458.625L546.377 514.25L546.363 553.606C538.773 549.915 527.841 545.048 520.036 542.064L519.886 278.749Z"
            />
            <path
              fill="currentColor"
              d="M503.159 278.876C504.485 283.369 503.517 333.27 503.512 340.56L503.493 541.874C494.737 545.75 486.032 549.742 477.38 553.848L477.448 514.75L477.379 434.251C477.188 396.129 464.343 371.746 437.793 345.461C443.668 338.523 454.075 328.694 460.679 322.036L503.159 278.876Z"
            />
            <path
              fill="currentColor"
              d="M371.984 341.769L379.478 341.559C370.905 402.34 355.634 443.065 322.905 494.3C380.498 514.921 420.746 546.846 459.047 594.389C472.026 610.499 483.448 625.624 494.141 643.527C499.727 652.878 504.758 662.672 509.935 672.269C504.441 666.617 498.257 658.698 493.148 652.471C439.473 588.362 374.242 532.406 290.889 512.815C287.434 512.004 283.97 511.236 280.504 510.471C314.706 468.838 336.319 436.907 356.325 386.366C359.533 378.426 362.343 370.332 364.747 362.113C365.676 358.96 369.271 343.864 370.331 342.038L371.984 341.769Z"
            />
            <path
              fill="currentColor"
              d="M643.643 341.052C646.902 341.035 649.93 341.281 653.176 341.512C654.559 348.242 659.151 362.517 661.47 369.368C679.241 421.23 706.859 469.174 742.807 510.566C653.785 531.806 591.701 578.896 534.008 648.183C527.369 656.035 520.848 663.986 514.448 672.034C514.845 671.166 515.255 670.303 515.677 669.447C553.931 592.893 617.622 522.636 700.643 495.131C671.639 448.961 650.474 395.289 643.643 341.052Z"
            />
            <path
              fill="currentColor"
              d="M511.281 550.895C511.557 550.883 542.034 563.368 545.42 564.696C537.157 582.758 529.645 601.07 521.533 619.191C518.241 626.546 515.022 633.823 512.01 641.301L511.406 641.354C510.64 640.469 505.821 628.624 504.842 626.391L478.038 564.87C489.267 560.572 500.354 555.911 511.281 550.895Z"
            />
          </svg>
          <span className="welcome-screen-title">Open Canvas</span>
        </>
      )}
    </div>
  );
};
Logo.displayName = "Logo";

const Heading = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="welcome-screen-center__heading welcome-screen-decor excalifont">
      {children}
    </div>
  );
};
Heading.displayName = "Heading";

const Menu = ({ children }: { children?: React.ReactNode }) => {
  return <div className="welcome-screen-menu">{children}</div>;
};
Menu.displayName = "Menu";

const MenuItemHelp = () => {
  const actionManager = useExcalidrawActionManager();

  return (
    <WelcomeScreenMenuItem
      onSelect={() => actionManager.executeAction(actionShortcuts)}
      shortcut="?"
      icon={HelpIcon}
    >
      {t("helpDialog.title")}
    </WelcomeScreenMenuItem>
  );
};
MenuItemHelp.displayName = "MenuItemHelp";

const MenuItemLoadScene = () => {
  const appState = useUIAppState();
  const actionManager = useExcalidrawActionManager();

  if (appState.viewModeEnabled) {
    return null;
  }

  return (
    <WelcomeScreenMenuItem
      onSelect={() => actionManager.executeAction(actionLoadScene)}
      shortcut={getShortcutFromShortcutName("loadScene")}
      icon={LoadIcon}
    >
      {t("buttons.load")}
    </WelcomeScreenMenuItem>
  );
};
MenuItemLoadScene.displayName = "MenuItemLoadScene";

const MenuItemLiveCollaborationTrigger = ({
  onSelect,
}: {
  onSelect: () => any;
}) => {
  const { t } = useI18n();
  return (
    <WelcomeScreenMenuItem shortcut={null} onSelect={onSelect} icon={usersIcon}>
      {t("labels.liveCollaboration")}
    </WelcomeScreenMenuItem>
  );
};
MenuItemLiveCollaborationTrigger.displayName =
  "MenuItemLiveCollaborationTrigger";

// -----------------------------------------------------------------------------

Center.Logo = Logo;
Center.Heading = Heading;
Center.Menu = Menu;
Center.MenuItem = WelcomeScreenMenuItem;
Center.MenuItemLink = WelcomeScreenMenuItemLink;
Center.MenuItemHelp = MenuItemHelp;
Center.MenuItemLoadScene = MenuItemLoadScene;
Center.MenuItemLiveCollaborationTrigger = MenuItemLiveCollaborationTrigger;

export { Center };
