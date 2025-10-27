import { useTunnels } from "../../context/tunnels";

const Header = ({ children }: { children?: React.ReactNode }) => {
  const { HeaderTunnel } = useTunnels();

  return <HeaderTunnel.In>{children}</HeaderTunnel.In>;
};

export default Header;
Header.displayName = "Header";
