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
      <div className="border-b border-[var(--border-soft)] bg-[rgba(255,196,0,.08)] px-4 py-2 text-center text-[11px] text-muted"><strong className="text-[var(--amber)]">Pre-launch preview:</strong> prices are demonstration data and no real financial transactions are executed.</div>
      {ticker ? <MarketTicker /> : null}
      <main className="page-enter">{children}</main>
      <Footer />
    </div>
  );
}
