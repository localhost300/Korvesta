import { Header } from "./Header";
import { Footer } from "./Footer";
import mobileStyles from "./MobileBottomNav.module.css";

export function PageShell({
  children,
  ticker,
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
      {ticker ? null : null}
      <main className="page-enter">{children}</main>
      <Footer />
    </div>
  );
}
