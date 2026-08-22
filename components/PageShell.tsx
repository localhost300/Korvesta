import { Header } from "./Header";
import { MarketTicker } from "./MarketTicker";
import { Footer } from "./Footer";
import mobileStyles from "./MobileBottomNav.module.css";

export function PageShell({
  children,
  ticker = true,
  light = false,
}: {
  children: React.ReactNode;
  ticker?: boolean;
  light?: boolean;
}) {
  return (
    <div
      className={`app-shell ${mobileStyles.pageOffset} ${light ? "light" : ""}`}
    >
      <Header />
      {ticker ? <MarketTicker /> : null}
      <main className="page-enter">{children}</main>
      <Footer />
    </div>
  );
}
