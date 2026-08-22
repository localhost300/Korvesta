"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "./Logo";
import { MobileBottomNav } from "./MobileBottomNav";
import { navItems } from "@/lib/data";

const THEME_STORAGE_KEY = "korvesta-theme:v1";

function loadSavedTheme() {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "light";
  } catch {
    return false;
  }
}

function saveTheme(lightMode: boolean) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, lightMode ? "light" : "dark");
  } catch {
    // The selected theme still applies when browser storage is unavailable.
  }
}

export function Header() {
  const pathname = usePathname();
  const [lightMode, setLightMode] = useState(false);

  useEffect(() => {
    const shouldUseLightMode = loadSavedTheme();

    document.documentElement.classList.toggle("light", shouldUseLightMode);

    const animationFrame = window.requestAnimationFrame(() => {
      setLightMode(shouldUseLightMode);
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  const toggleTheme = () => {
    setLightMode((currentMode) => {
      const nextMode = !currentMode;

      document.documentElement.classList.toggle("light", nextMode);
      saveTheme(nextMode);

      return nextMode;
    });
  };

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{
          borderColor: "var(--border-soft)",
          background: "color-mix(in srgb, var(--bg) 88%, transparent)",
        }}
      >
        <div className="container-shell flex h-16 items-center justify-between gap-4 lg:h-[74px] lg:gap-7">
          <Logo />

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
            {navItems.map((item) => {
              const itemPath = item.href.split("#")[0];
              const active = pathname === itemPath || pathname.startsWith(`${itemPath}/`);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative py-7 text-[13px] font-medium transition-colors hover:text-[var(--amber)] ${active ? "text-[var(--amber)]" : "text-[var(--text)]"}`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                  {active ? (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-0 bottom-0 h-[2px] bg-[var(--amber)]"
                    />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-[58px] items-center rounded-full border p-1"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
              }}
              aria-label="Toggle colour theme"
              aria-pressed={lightMode}
            >
              <span className="theme-knob grid h-7 w-7 place-items-center rounded-full bg-[var(--surface-3)] text-[var(--amber)] transition-transform duration-300">
                <IconMoon size={16} className="theme-moon" />
                <IconSun size={16} className="theme-sun" />
              </span>
            </button>

            <Link
              href="/sign-in"
              className="ghost-button hidden min-h-10 px-4 lg:inline-flex"
            >
              Sign In
            </Link>

            <Link
              href="/register"
              className="gold-button hidden min-h-10 px-4 lg:inline-flex"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <MobileBottomNav />
    </>
  );
}
