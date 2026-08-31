"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import type { Icon } from "@tabler/icons-react";
import {
  IconActivity,
  IconBell,
  IconBriefcase,
  IconChartCandle,
  IconChevronDown,
  IconCoins,
  IconDashboard,
  IconFileAnalytics,
  IconHelpCircle,
  IconHistory,
  IconIdBadge2,
  IconLogout,
  IconMenu2,
  IconMessageCircle,
  IconMoon,
  IconSettings,
  IconShield,
  IconSun,
  IconUser,
  IconUsers,
  IconWallet,
  IconX,
} from "@tabler/icons-react";
import { Logo } from "@/components/Logo";
import { AdminModal, AdminTabs } from "./AdminUI";
import { GlobalSearch } from "@/components/GlobalSearch";
import { createClient } from "@/lib/supabase/client";

const THEME_STORAGE_KEY = "korvesta-theme:v1";

type NavItem = {
  label: string;
  href: string;
  icon: Icon;
  children?: ReadonlyArray<readonly [string, string]>;
};

const adminNavigation: NavItem[] = [
  { label: "Overview", href: "/admin", icon: IconDashboard },
  { label: "Customers", href: "/admin/customers", icon: IconUsers },
  { label: "KYC & Compliance", href: "/admin/kyc", icon: IconIdBadge2 },
  {
    label: "Payments",
    href: "/admin/payments",
    icon: IconWallet,
    children: [
      ["Deposits & Withdrawals", "/admin/payments"],
      ["Deposit Methods", "/admin/payments/methods"],
      ["Transaction Ledger", "/admin/transactions"],
    ],
  },
  { label: "Investments", href: "/admin/investments", icon: IconBriefcase },
  {
    label: "Trading",
    href: "/admin/trading",
    icon: IconChartCandle,
    children: [
      ["Trading Oversight", "/admin/trading"],
      ["Bots & Copy Trading", "/admin/bots"],
    ],
  },
  { label: "Staking & Earn", href: "/admin/staking", icon: IconCoins },
  { label: "Support", href: "/admin/support", icon: IconMessageCircle },
  { label: "Communications", href: "/admin/communications", icon: IconBell },
  { label: "Reports", href: "/admin/reports", icon: IconFileAnalytics },
  { label: "Audit Logs", href: "/admin/audit", icon: IconHistory },
  { label: "Team & Roles", href: "/admin/team", icon: IconShield },
  { label: "Settings", href: "/admin/settings", icon: IconSettings },
];

const adminAlerts = [
  {
    title: "Withdrawal requires approval",
    copy: "WDR-78213 · $8,250.00 USDT",
    time: "2m",
    colour: "#ffc400",
    category: "Payments",
  },
  {
    title: "High-risk KYC application",
    copy: "KYC-9049 · Kelvin Boateng",
    time: "18m",
    colour: "#ef4444",
    category: "Compliance",
  },
  {
    title: "Account risk threshold reached",
    copy: "KRV-10476 has been automatically restricted",
    time: "41m",
    colour: "#ef4444",
    category: "Security",
  },
  {
    title: "Investment plan nearing capacity",
    copy: "Balanced Growth is now 92% allocated",
    time: "1h",
    colour: "#8b5cf6",
    category: "Investments",
  },
  {
    title: "Daily reconciliation complete",
    copy: "All ledgers balanced successfully",
    time: "2h",
    colour: "#00d084",
    category: "System",
  },
];

function routeActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav
      className="flex-1 overflow-y-auto px-3 py-4 scrollbar-none"
      aria-label="Administrator navigation"
    >
      {adminNavigation.map((item) => {
        const active =
          routeActive(pathname, item.href) ||
          item.children?.some(([, href]) => routeActive(pathname, href));
        return (
          <div key={item.label} className="mb-1">
            <Link
              href={item.href}
              onClick={onNavigate}
              className={clsx("dash-nav-item", active && "dash-nav-active")}
            >
              <item.icon size={18} stroke={1.8} />
              <span>{item.label}</span>
              {item.children ? (
                <IconChevronDown size={14} className="ml-auto" />
              ) : null}
            </Link>
            {item.children && active ? (
              <div className="admin-subnav ml-[25px] border-l border-[var(--dash-line)] py-1 pl-3">
                {item.children.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    className={clsx(
                      "block rounded-md px-3 py-2 text-[11px] transition",
                      pathname === href
                        ? "bg-[#211b0b] text-[#ffc400]"
                        : "text-[var(--dash-muted)] hover:text-[var(--dash-text)]",
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

function AdminSidebar({
  mobile,
  close,
}: {
  mobile?: boolean;
  close?: () => void;
}) {
  return (
    <aside
      className={clsx(
        "admin-sidebar flex h-full w-[220px] shrink-0 flex-col border-r border-[var(--dash-line)] bg-[var(--dash-bg)]",
        !mobile && "fixed inset-y-0 left-0 z-40 hidden xl:flex",
      )}
    >
      <div className="flex h-[68px] items-center justify-between border-b border-[var(--dash-line)] px-5">
        <Logo />
        {mobile ? (
          <button
            type="button"
            onClick={close}
            aria-label="Close administrator menu"
          >
            <IconX size={19} />
          </button>
        ) : null}
      </div>
      <div className="mx-3 mt-3 flex items-center gap-3 rounded-xl border border-[#ffc40030] bg-[#ffc40008] p-3">
        <span className="grid size-9 place-items-center rounded-lg bg-[#ffc40018] text-[#ffc400]">
          <IconShield size={19} />
        </span>
        <span>
          <b className="block text-xs">Admin Console</b>
          <small className="text-[10px] text-[var(--dash-muted)]">
            Operations workspace
          </small>
        </span>
      </div>
      <AdminNav onNavigate={close} />
      <div className="m-3 rounded-xl border border-[var(--dash-line)] bg-[var(--dash-card-2)] p-4 text-center">
        <IconHelpCircle className="mx-auto text-[#ffc400]" size={23} />
        <p className="mt-2 text-xs font-semibold">Operations support</p>
        <p className="mt-1 text-[10px] text-[var(--dash-muted)]">
          Escalation team online
        </p>
        <Link
          href="/admin/support"
          className="mt-3 inline-flex rounded-md border border-[var(--dash-line)] px-3 py-2 text-[10px]"
        >
          Open tickets
        </Link>
      </div>
    </aside>
  );
}

function AlertsModal({
  close,
  alerts,
}: {
  close: () => void;
  alerts: typeof adminAlerts;
}) {
  const [filter, setFilter] = useState("All");
  const categories = [
    "All",
    "Payments",
    "Compliance",
    "Security",
    "Investments",
    "System",
  ];
  const visible =
    filter === "All"
      ? alerts
      : alerts.filter((item) => item.category === filter);
  return (
    <AdminModal
      title="Administrative Alerts"
      copy="Operational events requiring attention or acknowledgement."
      close={close}
      size="lg"
    >
      <AdminTabs options={categories} value={filter} onChange={setFilter} />
      <div className="mt-4">
        {visible.map((alert) => (
          <div
            key={alert.title}
            className="flex items-start gap-3 border-b border-[var(--dash-line)] py-4 last:border-0"
          >
            <span
              className="mt-1 size-2.5 shrink-0 rounded-full"
              style={{
                background: alert.colour,
                boxShadow: `0 0 18px ${alert.colour}`,
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-4">
                <strong className="text-sm">{alert.title}</strong>
                <span className="text-[10px] text-[var(--dash-muted)]">
                  {alert.time}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--dash-muted)]">
                {alert.copy}
              </p>
              <button
                type="button"
                className="mt-2 text-[11px] font-semibold text-[#ffc400]"
              >
                Review now →
              </button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="dash-button mt-4 w-full" onClick={close}>
        Mark all as reviewed
      </button>
    </AdminModal>
  );
}

function ProfileMenu({ close }: { close: () => void }) {
  return (
    <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-[var(--dash-line)] bg-[var(--dash-card)] p-2 shadow-2xl">
      <div className="border-b border-[var(--dash-line)] px-3 py-2">
        <b className="text-xs">Administrator</b>
        <p className="mt-1 text-[10px] text-[var(--dash-muted)]">
          Protected session
        </p>
      </div>
      <Link
        href="/admin/team"
        onClick={close}
        className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-[var(--dash-card-2)]"
      >
        <IconUser size={16} />
        My access
      </Link>
      <Link
        href="/admin/audit"
        onClick={close}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-[var(--dash-card-2)]"
      >
        <IconActivity size={16} />
        My activity
      </Link>
      <form action="/api/auth/logout" method="post">
        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#ef4444] hover:bg-[#ef444410]">
          <IconLogout size={16} />
          Sign out
        </button>
      </form>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertItems, setAlertItems] = useState(adminAlerts);
  const [profileOpen, setProfileOpen] = useState(false);
  const [light, setLight] = useState(false);

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
    let client: ReturnType<typeof createClient>;
    try {
      client = createClient();
    } catch {
      return;
    }
    const labels: Record<string, readonly [string, string]> = {
      profiles: ["Customer account updated", "Compliance"],
      transactions: ["New transaction activity", "Payments"],
      kyc_submissions: ["KYC submission updated", "Compliance"],
      trading_orders: ["Trading order updated", "System"],
    };
    let channel = client.channel("admin-live-alerts");
    for (const table of Object.keys(labels)) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          const record = payload.new as unknown as Record<string, unknown>;
          const [title, category] = labels[table];
          setAlertItems((current) =>
            [
              {
                title,
                copy: String(
                  record.id ?? record.reference ?? "A platform record changed",
                ),
                time: "just now",
                colour: category === "Payments" ? "#ffc400" : "#00d084",
                category,
              },
              ...current,
            ].slice(0, 30),
          );
        },
      );
    }
    channel.subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, []);

  const toggleTheme = () => {
    setLight((current) => {
      const next = !current;
      document.documentElement.classList.toggle("light", next);
      document.documentElement.style.colorScheme = next ? "light" : "dark";
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next ? "light" : "dark");
      } catch {}
      return next;
    });
  };

  const mobileItems = adminNavigation.slice(0, 4);
  return (
    <div
      className={clsx(
        "dashboard-shell admin-shell min-h-screen",
        light && "dash-light",
      )}
    >
      <AdminSidebar />
      {menuOpen ? (
        <div
          className="fixed inset-0 z-[100] bg-black/70 xl:hidden"
          onMouseDown={() => setMenuOpen(false)}
        >
          <div
            className="h-full w-[280px]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <AdminSidebar mobile close={() => setMenuOpen(false)} />
          </div>
        </div>
      ) : null}
      <div className="min-h-screen xl:pl-[220px]">
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between gap-4 border-b border-[var(--dash-line)] bg-[color-mix(in_srgb,var(--dash-bg)_92%,transparent)] px-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg border border-[var(--dash-line)] xl:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open administrator menu"
          >
            <IconMenu2 size={19} />
          </button>
          <GlobalSearch
            area="admin"
            className="hidden w-full max-w-[420px] md:block"
          />
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-[#00d08435] bg-[#00d0840b] px-3 py-1.5 text-[10px] text-[#00d084] lg:flex">
              <i className="size-1.5 rounded-full bg-[#00d084]" />
              All systems operational
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className="grid size-9 place-items-center rounded-full border border-[var(--dash-line)] bg-[var(--dash-card)]"
              aria-label="Toggle administrator theme"
              aria-pressed={light}
            >
              {light ? (
                <IconSun size={18} className="text-[#b98500]" />
              ) : (
                <IconMoon size={18} />
              )}
            </button>
            <button
              type="button"
              onClick={() => setAlertsOpen(true)}
              className="relative grid size-9 place-items-center rounded-full border border-[var(--dash-line)] bg-[var(--dash-card)]"
              aria-label="Open administrative alerts"
            >
              <IconBell size={19} />
              <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-[#ef4444] text-[9px] font-bold text-white">
                {alertItems.length}
              </span>
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className="flex items-center gap-2 pl-1 text-left"
                aria-expanded={profileOpen}
              >
                <span className="grid size-9 place-items-center rounded-full bg-[#ffc40018] text-[#ffc400]">
                  <IconShield size={19} />
                </span>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold">Sarah Williams</p>
                  <p className="text-[10px] font-semibold text-[#ffc400]">
                    Super Administrator
                  </p>
                </div>
                <IconChevronDown size={14} className="hidden sm:block" />
              </button>
              {profileOpen ? (
                <ProfileMenu close={() => setProfileOpen(false)} />
              ) : null}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] p-4 pb-24 sm:p-6 sm:pb-24 xl:pb-8">
          {children}
        </main>
      </div>
      <nav className="admin-mobile-nav fixed inset-x-0 bottom-0 z-50 flex h-[68px] items-center justify-around border-t border-[var(--dash-line)] bg-[color-mix(in_srgb,var(--dash-bg)_94%,transparent)] px-2 backdrop-blur-xl xl:hidden">
        {mobileItems.map((item) => {
          const active = routeActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex min-w-14 flex-col items-center gap-1 text-[10px]",
                active ? "text-[#ffc400]" : "text-[var(--dash-muted)]",
              )}
            >
              <item.icon size={20} />
              <span>
                {item.label === "KYC & Compliance" ? "KYC" : item.label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex min-w-14 flex-col items-center gap-1 text-[10px] text-[var(--dash-muted)]"
        >
          <IconMenu2 size={20} />
          <span>More</span>
        </button>
      </nav>
      {alertsOpen ? (
        <AlertsModal close={() => setAlertsOpen(false)} alerts={alertItems} />
      ) : null}
    </div>
  );
}
