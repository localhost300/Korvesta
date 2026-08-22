"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconBell,
  IconBriefcase,
  IconChartCandle,
  IconChevronDown,
  IconCoins,
  IconDashboard,
  IconHelpCircle,
  IconHistory,
  IconMenu2,
  IconMoon,
  IconLogout,
  IconRobot,
  IconSearch,
  IconSettings,
  IconShield,
  IconSun,
  IconUser,
  IconWallet,
  IconX,
  IconUsers,
} from "@tabler/icons-react";
import { clsx } from "clsx";
import { Logo } from "@/components/Logo";
import { notifications } from "@/lib/dashboard-data";
import { Segmented } from "./DashboardUI";
import type { Icon } from "@tabler/icons-react";

const THEME_STORAGE_KEY = "korvesta-theme:v1";

type NavItem = {
  label: string;
  href: string;
  icon: Icon;
  children?: ReadonlyArray<readonly [string, string]>;
};

const navigation: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: IconDashboard },
  { label: "Portfolio", href: "/dashboard/portfolio", icon: IconBriefcase },
  { label: "Markets", href: "/dashboard/markets", icon: IconChartCandle },
  {
    label: "Trade",
    href: "/dashboard/trade",
    icon: IconChartCandle,
    children: [
      ["Spot Trading", "/dashboard/trade"],
      ["Futures Trading", "/dashboard/trade/futures"],
      ["Demo Trading", "/dashboard/trade/demo"],
    ],
  },
  {
    label: "AI Trading",
    href: "/dashboard/ai-trading",
    icon: IconRobot,
    children: [
      ["AI Bots", "/dashboard/ai-trading"],
      ["Create Bot", "/dashboard/ai-trading/create"],
      ["Copy Trading", "/dashboard/copy-trading"],
    ],
  },
  { label: "Earn", href: "/dashboard/earn", icon: IconCoins },
  {
    label: "Wallet",
    href: "/dashboard/wallet",
    icon: IconWallet,
    children: [
      ["Overview", "/dashboard/wallet"],
      ["Deposit", "/dashboard/wallet/deposit"],
      ["Withdraw", "/dashboard/wallet/withdraw"],
      ["Connect Wallet", "/dashboard/wallet/connect"],
    ],
  },
  { label: "Transactions", href: "/dashboard/transactions", icon: IconHistory },
  { label: "Security", href: "/dashboard/security", icon: IconShield },
  { label: "KYC Verification", href: "/dashboard/kyc", icon: IconUser },
  { label: "VIP & Referrals", href: "/dashboard/referrals", icon: IconUsers },
  { label: "Settings", href: "/dashboard/settings", icon: IconSettings },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav
      className="flex-1 overflow-y-auto px-3 py-4 scrollbar-none"
      aria-label="Dashboard navigation"
    >
      {navigation.map((item) => {
        const exactHome = item.href === "/dashboard";
        const active = exactHome
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <div key={item.label} className="mb-1">
            <Link
              href={item.href}
              onClick={onNavigate}
              className={clsx("dash-nav-item", active && "dash-nav-active")}
            >
              <item.icon size={18} stroke={1.8} />
              <span>{item.label}</span>
              {item.children && (
                <IconChevronDown size={14} className="ml-auto" />
              )}
            </Link>
            {item.children && active && (
              <div className="ml-[25px] border-l border-[#222c32] py-1 pl-3">
                {item.children.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    className={clsx(
                      "block rounded-md px-3 py-2 text-xs transition",
                      pathname === href
                        ? "bg-[#211b0b] text-[#ffc400]"
                        : "text-[#89949c] hover:text-white",
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function NotificationsModal({ close }: { close: () => void }) {
  const [filter, setFilter] = useState("All");
  const options = [
    "All",
    "Trade Alerts",
    "Price Alerts",
    "Bot Alerts",
    "Staking",
    "Security",
  ];
  const shown =
    filter === "All"
      ? notifications
      : notifications.filter((item) => item.category === filter);
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Notifications Center"
        onMouseDown={(event) => event.stopPropagation()}
        className="dash-card w-full max-w-[760px] p-0 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#222c32] px-5 py-4">
          <h2 className="text-lg font-semibold">Notifications Center</h2>
          <div className="flex items-center gap-4">
            <button className="text-xs text-[#b3bcc2]">Mark all as read</button>
            <button onClick={close} aria-label="Close notifications">
              <IconX size={19} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto p-4 scrollbar-none">
          <Segmented options={options} value={filter} onChange={setFilter} />
        </div>
        <div className="max-h-[520px] overflow-y-auto px-4 pb-4">
          {shown.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3 border-b border-[#1e282e] py-4 last:border-0"
            >
              <span
                className="grid size-10 shrink-0 place-items-center rounded-full"
                style={{ color: item.colour, background: `${item.colour}18` }}
              >
                <item.icon size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-3">
                  <strong className="text-sm">{item.title}</strong>
                  <span className="shrink-0 text-[11px] text-[#77838b]">
                    {item.time}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#89949c]">{item.copy}</p>
              </div>
              <span className="mt-4 size-1.5 rounded-full bg-[#00d084]" />
            </div>
          ))}
        </div>
        <button className="w-full border-t border-[#222c32] py-4 text-xs font-semibold text-[#a855f7]">
          Load more
        </button>
      </div>
    </div>
  );
}

function Sidebar({ mobile, close }: { mobile?: boolean; close?: () => void }) {
  return (
    <aside
      className={clsx(
        "flex h-full w-[184px] shrink-0 flex-col border-r border-[#1d272d] bg-[#060a0d]",
        !mobile && "fixed inset-y-0 left-0 z-40 hidden xl:flex",
      )}
    >
      <div className="flex h-[68px] items-center justify-between border-b border-[#1d272d] px-5">
        <Logo />
        {mobile && (
          <button onClick={close} aria-label="Close menu">
            <IconX size={19} />
          </button>
        )}
      </div>
      <NavContent onNavigate={close} />
      <div className="m-3 rounded-xl border border-[#252e35] bg-[#0d1317] p-4 text-center">
        <IconHelpCircle className="mx-auto text-[#ffc400]" size={24} />
        <p className="mt-2 text-sm font-semibold">Need Help?</p>
        <p className="mt-1 text-[10px] text-[#7f8a92]">24/7 Live Support</p>
        <Link
          href="/support"
          className="mt-3 inline-flex rounded-md border border-[#2a343b] px-3 py-2 text-[11px]"
        >
          Contact Support
        </Link>
      </div>
    </aside>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [light, setLight] = useState(false);
  const [account, setAccount] = useState<{
    full_name: string;
    account_status: string;
  } | null>(null);

  useEffect(() => {
    let saved = false;
    try {
      saved = window.localStorage.getItem(THEME_STORAGE_KEY) === "light";
    } catch {}
    document.documentElement.classList.toggle("light", saved);
    document.documentElement.style.colorScheme = saved ? "light" : "dark";
    const frame = window.requestAnimationFrame(() => setLight(saved));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/profile", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (body?.profile) setAccount(body.profile);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const toggleTheme = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    document.documentElement.style.colorScheme = next ? "light" : "dark";
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next ? "light" : "dark");
    } catch {}
  };

  const mobileNav = navigation.slice(0, 5);
  return (
    <div
      className={clsx("dashboard-shell min-h-screen", light && "dash-light")}
    >
      <Sidebar />
      {menuOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/70 xl:hidden"
          onMouseDown={() => setMenuOpen(false)}
        >
          <div
            className="h-full w-[260px]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <Sidebar mobile close={() => setMenuOpen(false)} />
          </div>
        </div>
      )}
      <div className="min-h-screen xl:pl-[184px]">
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between gap-4 border-b border-[#1d272d] bg-[#060a0de8] px-4 backdrop-blur-xl sm:px-6">
          <button
            className="grid size-9 place-items-center rounded-lg border border-[#263038] xl:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <IconMenu2 size={19} />
          </button>
          <div className="relative hidden w-full max-w-[360px] md:block">
            <IconSearch
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71808a]"
            />
            <input
              className="h-10 w-full rounded-lg border border-[#1f292f] bg-[#0b1014] pl-10 pr-4 text-xs outline-none focus:border-[#ffc400]"
              placeholder="Search assets, markets, or features..."
            />
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="grid size-9 place-items-center rounded-full border border-[#222c32] bg-[#0b1014]"
              aria-label="Toggle theme"
              aria-pressed={light}
            >
              {light ? (
                <IconSun size={18} className="text-[#b98500]" />
              ) : (
                <IconMoon size={18} />
              )}
            </button>
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative grid size-9 place-items-center rounded-full border border-[#222c32] bg-[#0b1014]"
              aria-label="Open notifications"
            >
              <IconBell size={19} />
              <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-[#ffc400] text-[9px] font-bold text-black">
                5
              </span>
            </button>
            <form action="/api/auth/logout" method="post">
              <button className="flex items-center gap-2 pl-1" title="Sign out">
                <span className="grid size-9 place-items-center rounded-full bg-[#263038]">
                  <IconUser size={19} />
                </span>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold">
                    {account?.full_name || "Customer"}
                  </p>
                  <p className="text-[10px] font-semibold text-[#ffc400]">
                    {account?.account_status === "restricted"
                      ? "Read-only account"
                      : "Secure session"}
                  </p>
                </div>
                <IconLogout size={14} className="hidden sm:block" />
              </button>
            </form>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 pb-24 sm:p-6 sm:pb-24 xl:pb-7">
          {account?.account_status === "restricted" && (
            <div className="mb-4 rounded-xl border border-[#ffc40055] bg-[#ffc40010] p-4 text-sm text-[#ffc400]">
              Your account is restricted to read-only access. Deposits,
              withdrawals, investments, trading, and profile changes are
              disabled. Contact support for assistance.
            </div>
          )}
          {children}
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-[68px] items-center justify-around border-t border-[#253038] bg-[#080d10f2] px-2 backdrop-blur-xl xl:hidden">
        {mobileNav.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex min-w-14 flex-col items-center gap-1 text-[10px]",
                active ? "text-[#ffc400]" : "text-[#829099]",
              )}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMenuOpen(true)}
          className="flex min-w-14 flex-col items-center gap-1 text-[10px] text-[#829099]"
        >
          <IconMenu2 size={20} />
          <span>More</span>
        </button>
      </nav>
      {notificationsOpen && (
        <NotificationsModal close={() => setNotificationsOpen(false)} />
      )}
    </div>
  );
}
