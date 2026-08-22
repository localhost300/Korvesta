"use client";
import { useCallback, useEffect, useState } from "react";
import {
  IconActivity,
  IconClock,
  IconDatabase,
  IconUsers,
} from "@tabler/icons-react";
import {
  AdminCard,
  AdminHeading,
  AdminMetric,
  AdminStatus,
  AdminTable,
} from "./AdminUI";
type Summary = {
  customers: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  pendingKyc: number;
  ledgerTransactions: number;
  investmentPositions: number;
  tradingOrders: number;
};
type LedgerEntry = {
  amount: string;
  ledger_accounts: {
    owner_id: string | null;
    assets: { symbol: string } | null;
    profiles: { full_name: string } | null;
  } | null;
};
type Ledger = {
  reference: string;
  kind: string;
  status: string;
  created_at: string;
  ledger_entries: LedgerEntry[];
};
type Investment = {
  id: string;
  principal: string;
  apy_bps: number;
  accrued_return: string;
  status: string;
  maturity_on: string;
  profiles: { full_name: string } | null;
  investment_plans: { name: string } | null;
};
type Trading = {
  id: string;
  pair: string;
  side: string;
  order_type: string;
  quantity: string;
  fill_price: string | null;
  status: string;
  provider: string;
  created_at: string;
  trading_accounts: {
    mode: string;
    profiles: { full_name: string } | null;
  } | null;
};
type Operations = {
  summary: Summary;
  ledger: Ledger[];
  investments: Investment[];
  trading: Trading[];
};
function useOperations() {
  const [data, setData] = useState<Operations | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(
    () =>
      fetch("/api/admin/operations", { cache: "no-store" })
        .then((r) =>
          r.json().then((body) => {
            if (!r.ok) throw new Error(body.error);
            setData(body);
          }),
        )
        .catch((reason) => setError(reason.message)),
    [],
  );
  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  return { data, error };
}
function ErrorLine({ error }: { error: string }) {
  return error ? (
    <p className="mb-4 rounded-lg border border-red-500/30 p-3 text-sm text-red-400">
      {error}
    </p>
  ) : null;
}
export function RealAdminUnavailablePage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <AdminHeading
        title={title}
        subtitle="No production service is configured for this area."
      />
      <AdminCard>
        <p className="text-sm text-[var(--dash-muted)]">{description}</p>
        <p className="mt-4 text-xs text-[var(--dash-muted)]">
          Fabricated operational totals and controls have been removed.
        </p>
      </AdminCard>
    </>
  );
}
export function RealAdminOverviewPage() {
  const { data, error } = useOperations();
  const s = data?.summary;
  return (
    <>
      <AdminHeading
        title="Operations Overview"
        subtitle="Live counts from customer, payment, KYC, ledger, investment, and trading records."
      />
      <ErrorLine error={error} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric
          label="Customers"
          value={s ? String(s.customers) : "Loading…"}
          icon={IconUsers}
        />
        <AdminMetric
          label="Pending payments"
          value={s ? String(s.pendingDeposits + s.pendingWithdrawals) : "—"}
          change={
            s
              ? `${s.pendingDeposits} deposits · ${s.pendingWithdrawals} withdrawals`
              : ""
          }
          icon={IconClock}
        />
        <AdminMetric
          label="Pending KYC"
          value={s ? String(s.pendingKyc) : "—"}
          icon={IconActivity}
        />
        <AdminMetric
          label="Recent ledger records"
          value={s ? String(s.ledgerTransactions) : "—"}
          change="Latest 250 maximum"
          icon={IconDatabase}
        />
      </div>
      <AdminCard className="mt-4" title="Operational records">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Investment positions", s?.investmentPositions],
            ["Trading orders", s?.tradingOrders],
            ["Ledger transactions", s?.ledgerTransactions],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-xl border border-[var(--dash-line)] p-5"
            >
              <small className="text-[var(--dash-muted)]">{label}</small>
              <b className="mt-2 block text-2xl">{value ?? "—"}</b>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-[var(--dash-muted)]">
          No fabricated AUM, revenue, customer-growth, or approval-rate values
          are shown.
        </p>
      </AdminCard>
    </>
  );
}
export function RealAdminTransactionsPage() {
  const { data, error } = useOperations();
  return (
    <>
      <AdminHeading
        title="Transaction Ledger"
        subtitle="Latest immutable ledger transactions and customer-side entries."
      />
      <ErrorLine error={error} />
      <AdminCard title="Ledger records">
        <AdminTable
          headers={[
            "Reference",
            "Type",
            "Customer entries",
            "Status",
            "Created",
          ]}
          rows={(data?.ledger ?? []).map((tx) => [
            <b key="ref">{tx.reference}</b>,
            tx.kind.replaceAll("_", " "),
            <div key="entries">
              {tx.ledger_entries
                .filter((e) => e.ledger_accounts?.owner_id)
                .map((e, index) => (
                  <div
                    key={index}
                    className={
                      Number(e.amount) >= 0 ? "text-[#00d084]" : "text-red-400"
                    }
                  >
                    {Number(e.amount) >= 0 ? "+" : ""}
                    {Number(e.amount).toLocaleString()}{" "}
                    {e.ledger_accounts?.assets?.symbol} ·{" "}
                    {e.ledger_accounts?.profiles?.full_name || "Customer"}
                  </div>
                ))}
            </div>,
            <AdminStatus
              key="status"
              tone={tx.status === "posted" ? "green" : "yellow"}
            >
              {tx.status}
            </AdminStatus>,
            new Date(tx.created_at).toLocaleString(),
          ])}
        />
      </AdminCard>
    </>
  );
}
export function RealAdminInvestmentsPage() {
  const { data, error } = useOperations();
  return (
    <>
      <AdminHeading
        title="Investment Management"
        subtitle="Real fixed-APY positions and accrued returns."
      />
      <ErrorLine error={error} />
      <AdminCard title="Investment positions">
        <AdminTable
          headers={[
            "Customer",
            "Plan",
            "Principal",
            "APY",
            "Accrued",
            "Status",
            "Maturity",
          ]}
          rows={(data?.investments ?? []).map((item) => [
            item.profiles?.full_name || "Customer",
            item.investment_plans?.name || "Plan",
            Number(item.principal).toLocaleString(),
            `${(item.apy_bps / 100).toFixed(2)}%`,
            Number(item.accrued_return).toLocaleString(),
            <AdminStatus
              key="status"
              tone={item.status === "active" ? "green" : "yellow"}
            >
              {item.status}
            </AdminStatus>,
            new Date(item.maturity_on).toLocaleDateString(),
          ])}
        />
      </AdminCard>
    </>
  );
}
export function RealAdminTradingPage() {
  const { data, error } = useOperations();
  return (
    <>
      <AdminHeading
        title="Trading Operations"
        subtitle="Real paper and Binance execution records."
      />
      <ErrorLine error={error} />
      <AdminCard title="Trading orders">
        <AdminTable
          headers={[
            "Customer",
            "Mode",
            "Pair",
            "Side",
            "Type",
            "Quantity",
            "Fill",
            "Provider",
            "Status",
            "Created",
          ]}
          rows={(data?.trading ?? []).map((item) => [
            item.trading_accounts?.profiles?.full_name || "Customer",
            item.trading_accounts?.mode || "—",
            item.pair,
            item.side,
            item.order_type,
            Number(item.quantity).toLocaleString(),
            item.fill_price ? Number(item.fill_price).toLocaleString() : "—",
            item.provider,
            <AdminStatus
              key="status"
              tone={
                item.status === "filled"
                  ? "green"
                  : item.status === "rejected"
                    ? "red"
                    : "yellow"
              }
            >
              {item.status}
            </AdminStatus>,
            new Date(item.created_at).toLocaleString(),
          ])}
        />
      </AdminCard>
    </>
  );
}
