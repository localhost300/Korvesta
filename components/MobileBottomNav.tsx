"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconBook2,
  IconBuildingSkyscraper,
  IconChartBar,
  IconDots,
  IconHeadset,
  IconHome,
  IconLogin,
  IconNews,
  IconRocket,
  IconTools,
  IconX,
} from "@tabler/icons-react";
import styles from "./MobileBottomNav.module.css";

const primaryItems = [
  { label: "Home", href: "/", icon: IconHome },
  { label: "Markets", href: "/markets", icon: IconChartBar },
  { label: "Insights", href: "/insights", icon: IconNews },
  { label: "Tools", href: "/trade-tools", icon: IconTools },
];

const moreItems = [
  {
    label: "Learn",
    description: "Trading guides and lessons",
    href: "/learn",
    icon: IconBook2,
  },
  {
    label: "Company",
    description: "About Korvesta",
    href: "/company",
    icon: IconBuildingSkyscraper,
  },
  {
    label: "Support",
    description: "Help centre and contact",
    href: "/support",
    icon: IconHeadset,
  },
  {
    label: "Sign In",
    description: "Access your account",
    href: "/sign-in",
    icon: IconLogin,
  },
];

function routeIsActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const moreRouteActive =
    ["/register", "/verify", "/success"].some((route) =>
      routeIsActive(pathname, route),
    ) ||
    moreItems.some((item) => routeIsActive(pathname, item.href));

  return (
    <>
      <AnimatePresence>
        {menuOpen ? (
          <>
            <motion.button
              key="mobile-menu-backdrop"
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-sm lg:hidden"
              aria-label="Close navigation menu"
            />

            <motion.aside
              key="mobile-menu-sheet"
              initial={{ opacity: 0, y: 36, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 28, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 360, damping: 32 }}
              className={`${styles.sheet} fixed inset-x-3 z-[90] overflow-y-auto rounded-2xl border p-4 shadow-2xl lg:hidden`}
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
              }}
              aria-label="More navigation options"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div>
                  <h2 className="font-semibold">More from Korvesta</h2>
                  <p className="mt-1 text-[11px] text-muted">
                    Explore learning, company and account pages.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full border text-muted"
                  style={{ borderColor: "var(--border)" }}
                  aria-label="Close menu"
                >
                  <IconX size={18} />
                </button>
              </div>

              <nav className="grid gap-2" aria-label="Additional navigation">
                {moreItems.map(({ label, description, href, icon: Icon }) => {
                  const active = routeIsActive(pathname, href);

                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${active ? "bg-[rgba(255,196,0,.09)] text-[var(--amber)]" : "hover:bg-[var(--surface-2)]"}`}
                      style={{ borderColor: "var(--border-soft)" }}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--surface-2)]">
                        <Icon size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block text-sm">{label}</strong>
                        <span className="mt-0.5 block truncate text-[11px] text-muted">
                          {description}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </nav>

              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="gold-button mt-3 w-full"
              >
                <IconRocket size={18} />
                Get Started
              </Link>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <nav
        className={`${styles.navigation} fixed inset-x-0 bottom-0 z-[100] border-t backdrop-blur-2xl lg:hidden`}
        style={{
          borderColor: "var(--border)",
          background: "color-mix(in srgb, var(--surface) 92%, transparent)",
        }}
        aria-label="Mobile navigation"
      >
        <div className="mx-auto grid h-[74px] max-w-lg grid-cols-5 px-2">
          {primaryItems.map(({ label, href, icon: Icon }) => {
            const active = routeIsActive(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium transition-colors ${active ? "text-[var(--amber)]" : "text-muted hover:text-[var(--text)]"}`}
                aria-current={active ? "page" : undefined}
              >
                {active ? (
                  <motion.span
                    layoutId="mobile-nav-active"
                    className="absolute inset-x-2 top-1 h-[3px] rounded-full bg-[var(--amber)]"
                  />
                ) : null}
                <Icon size={21} stroke={active ? 2.3 : 1.8} />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium transition-colors ${menuOpen || moreRouteActive ? "text-[var(--amber)]" : "text-muted hover:text-[var(--text)]"}`}
            aria-label="Open more navigation options"
            aria-expanded={menuOpen}
          >
            {menuOpen || moreRouteActive ? (
              <motion.span
                layoutId="mobile-nav-active"
                className="absolute inset-x-2 top-1 h-[3px] rounded-full bg-[var(--amber)]"
              />
            ) : null}
            {menuOpen ? <IconX size={21} /> : <IconDots size={21} />}
            <span>Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}
