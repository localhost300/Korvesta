"use client";

import { useState } from "react";
import {
  IconAlertTriangle,
  IconBell,
  IconCheck,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconKey,
  IconLock,
  IconMapPin,
  IconRefresh,
  IconShieldCheck,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import {
  Card,
  DataTable,
  LineChart,
  PageHeading,
  Segmented,
  Status,
} from "./DashboardUI";
import { marketSeries, notifications } from "@/lib/dashboard-data";
import { useAccountActivity } from "@/lib/use-account-activity";

export function TransactionsPage() {
  const [filter, setFilter] = useState("All");
  const { transactions, loading, error, refresh } = useAccountActivity();
  const label = (kind: string) =>
    ({
      deposit: "Deposit",
      withdrawal: "Withdrawal",
      investment_subscription: "Investment",
      investment_accrual: "ROI credit",
      investment_redemption: "Redemption",
    })[kind] ?? kind.replaceAll("_", " ");
  const category = (kind: string) =>
    kind.startsWith("investment_") ? "Investment" : label(kind);
  const shown = transactions.filter(
    (item) => filter === "All" || category(item.activity_type) === filter,
  );
  const rows = shown.map((item) => {
    const amount = Number(item.amount);
    return [
      <b key="type" className="capitalize">
        {label(item.activity_type)}
      </b>,
      item.asset_symbol,
      <span
        key="amount"
        className={amount >= 0 ? "text-[#00d084]" : "text-[#ef4444]"}
      >
        {amount >= 0 ? "+" : ""}
        {amount.toLocaleString(undefined, { maximumFractionDigits: 8 })}{" "}
        {item.asset_symbol}
      </span>,
      <Status
        key="status"
        tone={
          item.status === "rejected"
            ? "red"
            : item.status === "pending"
              ? "yellow"
              : "green"
        }
      >
        {item.status}
      </Status>,
      new Date(item.occurred_at).toLocaleString(),
      <span
        key="tx"
        title={item.reference}
        className="font-mono text-[#809099]"
      >
        {item.reference.length > 18
          ? `${item.reference.slice(0, 10)}…${item.reference.slice(-6)}`
          : item.reference}
      </span>,
    ];
  });
  return (
    <>
      <PageHeading
        title="Transaction History"
        subtitle="Real payment and investment activity from your account ledger."
        action={
          <button onClick={() => void refresh()} className="dash-button">
            <IconRefresh size={16} />
            Refresh
          </button>
        }
      />
      {error ? (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      <Card>
        <div className="mb-5 overflow-x-auto">
          <Segmented
            options={["All", "Deposit", "Withdrawal", "Investment"]}
            value={filter}
            onChange={setFilter}
          />
        </div>
        {loading ? (
          <p className="py-10 text-center text-sm text-[#7c8991]">
            Loading account activity…
          </p>
        ) : rows.length ? (
          <DataTable
            headers={[
              "Type",
              "Asset",
              "Amount",
              "Status",
              "Date & Time",
              "Reference",
            ]}
            rows={rows}
          />
        ) : (
          <p className="py-10 text-center text-sm text-[#7c8991]">
            No {filter.toLowerCase()} transactions yet.
          </p>
        )}
        <p className="mt-5 text-xs text-[#7c8991]">
          Showing {rows.length} real account record
          {rows.length === 1 ? "" : "s"}.
        </p>
      </Card>
    </>
  );
}

export function SecurityPage() {
  return (
    <>
      <PageHeading
        title="Security Center"
        subtitle="Protect your account and assets with enterprise-grade security."
      />
      <div className="grid gap-4 lg:grid-cols-[1.6fr_.7fr]">
        <Card>
          <div className="grid gap-6 md:grid-cols-[190px_1fr_.9fr]">
            <div className="grid place-items-center">
              <span className="grid size-36 place-items-center rounded-full border border-[#00d08455] bg-[#06331f] shadow-[0_0_45px_rgba(0,208,132,.18)]">
                <IconShieldCheck size={78} className="text-[#00d084]" />
              </span>
            </div>
            <div>
              <p className="text-sm">Security Score</p>
              <p className="mt-2 text-4xl font-semibold text-[#00d084]">
                95<small className="text-base text-[#8b969e]"> / 100</small>
              </p>
              <p className="mt-2 text-xs text-[#87949c]">
                Your account security is strong. Keep it up!
              </p>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#253038]">
                <div className="h-full w-[95%] bg-[#00a861]" />
              </div>
              {[
                "Two-Factor Authentication",
                "Email Verification",
                "Identity Verification",
                "Anti-phishing Code",
              ].map((a) => (
                <div key={a} className="mt-4 flex justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <IconCheck size={15} className="text-[#00d084]" />
                    {a}
                  </span>
                  <Status>Enabled</Status>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-[#253038] bg-[#0a0f12] p-4">
              <h3 className="text-sm font-semibold">Improve Your Security</h3>
              {[
                "Enable Hardware Key",
                "Add Withdrawal Whitelist",
                "Enable Login Password",
              ].map((a) => (
                <div key={a} className="mt-4 flex gap-3">
                  <IconKey size={17} className="text-[#ffc400]" />
                  <span>
                    <b className="text-xs">{a}</b>
                    <small className="mt-1 block text-[#79868e]">
                      +5 security points
                    </small>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card title="Account Status">
          {[
            ["Account Level", "Level 2 Verified"],
            ["Daily Withdrawal Limit", "100 BTC"],
            ["Account Created", "May 12, 2023"],
            ["Last Login", "Jun 11, 2024 18:36"],
            ["Account Status", "Normal"],
          ].map(([a, b]) => (
            <div
              key={a}
              className="flex justify-between border-b border-[#253038] py-4 text-xs"
            >
              <span className="text-[#839099]">{a}</span>
              <b>{b}</b>
            </div>
          ))}
          <button className="gold-button mt-5 w-full">Manage Account</button>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Two-Factor Authentication (2FA)">
          {[
            [IconKey, "Authenticator App", "Enabled"],
            [IconDeviceMobile, "SMS Authentication", "Disabled"],
            [IconBell, "Email Authentication", "Enabled"],
            [IconLock, "Hardware Security Key", "Disabled"],
          ].map(([Icon, a, b]) => (
            <div
              key={String(a)}
              className="flex items-center gap-3 border-b border-[#253038] py-4"
            >
              <Icon size={20} />
              <div>
                <b className="text-xs">{String(a)}</b>
                <small className="block text-[#7d8991]">
                  Extra account protection
                </small>
              </div>
              <Status tone={b === "Enabled" ? "green" : "yellow"}>
                {String(b)}
              </Status>
            </div>
          ))}
        </Card>
        <Card title="Recent Login Activity">
          {[
            ["Lagos, Nigeria", "Current Session"],
            ["Abuja, Nigeria", "Jun 11, 16:22"],
            ["London, United Kingdom", "Jun 10, 21:45"],
            ["New York, USA", "Jun 9, 14:30"],
          ].map(([a, b]) => (
            <div key={a} className="flex gap-3 border-b border-[#253038] py-4">
              <IconMapPin size={19} />
              <div>
                <b className="text-xs">{a}</b>
                <small className="block text-[#7d8991]">
                  Chrome on Windows
                </small>
              </div>
              <span className="ml-auto text-[10px] text-[#00d084]">{b}</span>
            </div>
          ))}
        </Card>
        <Card title="Device Management">
          {[
            [IconDeviceDesktop, "Windows PC", "Current"],
            [IconDeviceMobile, "iPhone 14 Pro", "Trusted"],
            [IconDeviceDesktop, "MacBook Pro", "Trusted"],
            [IconDeviceMobile, "Samsung Galaxy S23", "Remove"],
          ].map(([Icon, a, b]) => (
            <div
              key={String(a)}
              className="flex gap-3 border-b border-[#253038] py-4"
            >
              <Icon size={19} />
              <div>
                <b className="text-xs">{String(a)}</b>
                <small className="block text-[#7d8991]">
                  Last active recently
                </small>
              </div>
              <Status>{String(b)}</Status>
            </div>
          ))}
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_.7fr]">
        <Card title="Withdrawal Whitelist">
          <DataTable
            headers={["Address", "Network", "Asset", "Added On", "Status"]}
            rows={[
              ["0xB3F7a8...9a2B45cE", "Ethereum (ERC20)", "ETH"],
              ["bc1qxy2kgdy...v98kkge", "Bitcoin", "BTC"],
              ["D05qtfj...Jf9v3h2", "Solana", "SOL"],
            ].map((a) => [
              a[0],
              a[1],
              a[2],
              "May 20, 2024",
              <Status key="status">Active</Status>,
            ])}
          />
        </Card>
        <Card title="Security Alerts">
          {notifications.slice(0, 4).map((n) => (
            <div
              key={n.title}
              className="flex gap-3 border-b border-[#253038] py-4"
            >
              <IconAlertTriangle size={18} className="text-[#ef4444]" />
              <div>
                <b className="text-xs">{n.title}</b>
                <small className="block text-[#7d8991]">{n.copy}</small>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

export function KycPage() {
  const [started, setStarted] = useState(false);
  return (
    <>
      <PageHeading
        title="KYC Verification"
        subtitle="Complete identity verification to unlock all platform features."
        action={<button className="dash-button">Need Help?</button>}
      />
      <div className="mb-6 flex items-center justify-between">
        {[
          "Personal Info",
          "ID Verification",
          "Face Verification",
          "Address Verification",
          "Review",
        ].map((a, i) => (
          <div
            key={a}
            className="flex flex-1 flex-col items-center text-center"
          >
            <span
              className={`grid size-8 place-items-center rounded-full border ${i < 2 ? "border-[#00d084] bg-[#06331f] text-[#00d084]" : i === 2 ? "border-[#8b5cf6] bg-[#4d248e]" : "border-[#303b42] text-[#687780]"}`}
            >
              {i < 2 ? <IconCheck size={15} /> : i + 1}
            </span>
            <small className="mt-2 hidden text-[#849099] sm:block">{a}</small>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[.8fr_1fr_.7fr]">
        <Card title="Face Verification">
          <p className="text-xs text-[#849099]">
            Please follow the steps below to complete your verification.
          </p>
          {[
            "Use a well-lit area",
            "Remove hats, glasses and masks",
            "Look directly at the camera",
            "Follow the on-screen instructions",
          ].map((a) => (
            <div
              key={a}
              className="mt-4 flex gap-3 rounded-lg bg-[#0a1013] p-3 text-xs"
            >
              <IconCheck size={16} className="text-[#8b5cf6]" />
              {a}
            </div>
          ))}
        </Card>
        <Card className="text-center">
          <span
            className={`mx-auto grid size-48 place-items-center rounded-full border-4 ${started ? "border-[#00d084] shadow-[0_0_40px_rgba(0,208,132,.25)]" : "border-[#8b5cf6]"}`}
          >
            <IconUser size={100} className="text-[#9aa5ac]" />
          </span>
          <p className="mt-5 text-sm">Position your face in the centre</p>
          <button
            onClick={() => setStarted(!started)}
            className="mt-5 min-h-11 w-full rounded-lg bg-[#6d31cc] font-semibold"
          >
            {started ? "Face Scan Complete" : "Start Face Scan"}
          </button>
        </Card>
        <div className="space-y-4">
          <Card title="Verification Status">
            <p className="text-center text-3xl font-semibold">60%</p>
            <p className="text-center text-xs text-[#00d084]">Completed</p>
            {[
              "Personal Information",
              "ID Verification",
              "Face Verification",
              "Address Verification",
              "Review",
            ].map((a, i) => (
              <div key={a} className="mt-4 flex justify-between text-xs">
                <span>{a}</span>
                <Status tone={i < 2 ? "green" : i === 2 ? "purple" : "yellow"}>
                  {i < 2 ? "Completed" : i === 2 ? "In Progress" : "Pending"}
                </Status>
              </div>
            ))}
          </Card>
          <Card title="Why verify?">
            <p className="text-xs leading-6 text-[#819099]">
              Higher withdrawal limits
              <br />
              Access all features
              <br />
              Better account security
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}

export function SettingsPage() {
  const [tab, setTab] = useState("Profile");
  return (
    <>
      <PageHeading
        title="Account Settings"
        subtitle="Manage your profile, security and platform preferences."
      />
      <Card>
        <Segmented
          options={[
            "Profile",
            "KYC Verification",
            "Security",
            "API Management",
            "Notifications",
            "Preferences",
          ]}
          value={tab}
          onChange={setTab}
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_.8fr]">
          <div className="rounded-xl border border-[#253038] p-5">
            <div className="flex items-center gap-4">
              <span className="grid size-20 place-items-center rounded-full bg-[#263038]">
                <IconUser size={38} />
              </span>
              <div>
                <h2 className="text-xl font-semibold">Alex Johnson</h2>
                <p className="mt-1 text-sm text-[#ffc400]">Pro Trader</p>
                <p className="mt-1 text-xs text-[#7f8b93]">alex@korvesta.org</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-xs">
                Display Name
                <input
                  className="dash-input mt-2"
                  defaultValue="Alex Johnson"
                />
              </label>
              <label className="text-xs">
                Phone Number
                <input
                  className="dash-input mt-2"
                  defaultValue="+1 555 123 4567"
                />
              </label>
              <label className="text-xs">
                Country
                <select className="dash-input mt-2">
                  <option>United States</option>
                  <option>Nigeria</option>
                </select>
              </label>
              <label className="text-xs">
                Account ID
                <input
                  className="dash-input mt-2"
                  value="KYY23456789"
                  readOnly
                />
              </label>
            </div>
            <button className="gold-button mt-5">Save Changes</button>
          </div>
          <div className="rounded-xl border border-[#253038] p-5">
            <h3 className="font-semibold">Account Level</h3>
            <p className="mt-3 text-3xl font-semibold">Pro Trader</p>
            <div className="mt-5 h-2 rounded-full bg-[#263038]">
              <div className="h-full w-[78%] rounded-full bg-[#00d084]" />
            </div>
            {[
              ["Trading Fee Discount", "20%"],
              ["Withdrawal Limit", "100 BTC / 24h"],
              ["Priority Support", "Yes"],
              ["API Rate Limit", "High"],
            ].map(([a, b]) => (
              <div key={a} className="mt-5 flex justify-between text-xs">
                <span className="text-[#849099]">{a}</span>
                <b>{b}</b>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </>
  );
}

export function ReferralsPage() {
  return (
    <>
      <PageHeading
        title="VIP & Referral Center"
        subtitle="Invite friends and earn up to 40% commission."
        action={<button className="dash-button">Referral Code</button>}
      />
      <div className="grid gap-4 lg:grid-cols-[1.35fr_.7fr]">
        <Card title="Your Referral Link">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className="dash-input flex-1"
              value="https://korvesta.com/ref/JohnTrader"
              readOnly
            />
            <button className="dash-button">Copy</button>
          </div>
        </Card>
        <Card title="Referral Stats">
          <div className="grid grid-cols-2 gap-4">
            {[
              ["Total Referrals", "248"],
              ["Active Referrals", "142"],
              ["Total Earnings", "12,458.75 USDT"],
              ["This Month", "1,245.30 USDT"],
            ].map(([a, b]) => (
              <div key={a}>
                <small className="text-[#7f8b93]">{a}</small>
                <b className="mt-2 block">{b}</b>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_.7fr]">
        <div className="space-y-4">
          <Card title="Commission Overview">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Direct Referrals", "40%"],
                ["Level 2", "20%"],
                ["Level 3", "10%"],
              ].map(([a, b]) => (
                <div
                  key={a}
                  className="rounded-xl border border-[#253038] p-5 text-center"
                >
                  <IconUsers className="mx-auto text-[#ffc400]" />
                  <p className="mt-3 text-xs text-[#839099]">{a}</p>
                  <p className="mt-2 text-3xl font-semibold text-[#00d084]">
                    {b}
                  </p>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Referral Earnings">
            <div className="h-[300px]">
              <LineChart
                data={marketSeries.map((v, i) => v + (i % 2 ? 20 : -10))}
                colour="#ffc400"
                yAxis
              />
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="VIP Level">
            <p className="text-3xl font-semibold text-[#ffc400]">VIP 3</p>
            <p className="mt-2 text-xs text-[#849099]">Current Level</p>
            <div className="mt-5 h-2 rounded-full bg-[#253038]">
              <div className="h-full w-[62%] bg-[#ffc400]" />
            </div>
            <button className="gold-button mt-5 w-full">
              View VIP Benefits
            </button>
          </Card>
          <Card title="Recent Referrals">
            {[
              "TraderMax",
              "CryptoGirl",
              "BlockchainPro",
              "MoonHunter",
              "TradeQueen",
            ].map((a, i) => (
              <div
                key={a}
                className="flex justify-between border-b border-[#253038] py-4 text-xs"
              >
                <span>
                  {a}
                  <small className="block text-[#77858d]">
                    Jun {18 - i}, 2024
                  </small>
                </span>
                <b className="text-[#00d084]">+${25 - i * 3}.00 USDT</b>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}
