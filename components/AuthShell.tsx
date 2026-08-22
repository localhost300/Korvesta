"use client";

import { Header } from "./Header";
import mobileStyles from "./MobileBottomNav.module.css";

export function AuthShell({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <div
      className={`app-shell min-h-screen ${mobileStyles.pageOffset} ${light ? "light" : ""}`}
    >
      <Header />
      {children}
      <footer
        className="container-shell flex flex-col gap-3 border-t py-5 text-[11px] text-muted sm:flex-row sm:justify-between"
        style={{ borderColor: "var(--border-soft)" }}
      >
        <span>© 2026 Korvesta. All rights reserved.</span>
        <div className="flex flex-wrap gap-x-7 gap-y-2">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Use</a>
          <a href="#">Cookie Policy</a>
        </div>
      </footer>
    </div>
  );
}
