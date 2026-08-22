"use client";
import { useEffect, useMemo, useState } from "react";
import {
  AdminCard,
  AdminHeading,
  AdminMetric,
  AdminStatus,
  AdminTable,
} from "./AdminUI";
import { IconUsers, IconShieldCheck, IconWallet } from "@tabler/icons-react";
type Customer = {
  id: string;
  full_name: string;
  email: string;
  country: string | null;
  account_status: string;
  kyc_status: string;
  created_at: string;
  assetCount: number;
  portfolioValue: number;
};
export function RealCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const load = () =>
    fetch("/api/admin/customers", { cache: "no-store" })
      .then((r) =>
        r.json().then((b) => {
          if (!r.ok) throw new Error(b.error);
          setCustomers(b.customers);
        }),
      )
      .catch((e) => setError(e.message));
  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const shown = useMemo(
    () =>
      customers.filter((c) =>
        `${c.full_name} ${c.email} ${c.country}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [customers, query],
  );
  async function change(customerId: string, status: string) {
    const response = await fetch("/api/admin/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, status, note }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error);
      return;
    }
    setNote("");
    await load();
  }
  return (
    <>
      <AdminHeading
        title="Customer Management"
        subtitle="Real customer profiles, verification states, access controls, and ledger values."
      />
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <AdminMetric
          label="Customers"
          value={String(customers.length)}
          icon={IconUsers}
        />
        <AdminMetric
          label="KYC verified"
          value={String(
            customers.filter((c) => c.kyc_status === "verified").length,
          )}
          icon={IconShieldCheck}
          colour="#00d084"
        />
        <AdminMetric
          label="Total portfolio"
          value={customers
            .reduce((s, c) => s + c.portfolioValue, 0)
            .toLocaleString(undefined, { style: "currency", currency: "USD" })}
          icon={IconWallet}
        />
      </div>
      <AdminCard className="mt-4" title="Customers">
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr]">
          <input
            className="dash-input"
            placeholder="Search customers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <input
            className="dash-input"
            placeholder="Required reason for status changes"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <AdminTable
          headers={[
            "Customer",
            "Country",
            "KYC",
            "Access",
            "Assets",
            "Portfolio",
            "Joined",
            "Controls",
          ]}
          rows={shown.map((customer) => [
            <span key="customer">
              <b className="block">
                {customer.full_name || "Unnamed customer"}
              </b>
              <small className="text-[var(--dash-muted)]">
                {customer.email}
                <br />
                {customer.id}
              </small>
            </span>,
            customer.country ?? "—",
            <AdminStatus
              key="kyc"
              tone={
                customer.kyc_status === "verified"
                  ? "green"
                  : customer.kyc_status === "rejected"
                    ? "red"
                    : "yellow"
              }
            >
              {customer.kyc_status}
            </AdminStatus>,
            <AdminStatus
              key="access"
              tone={
                customer.account_status === "active"
                  ? "green"
                  : customer.account_status === "suspended"
                    ? "red"
                    : "yellow"
              }
            >
              {customer.account_status}
            </AdminStatus>,
            String(customer.assetCount),
            customer.portfolioValue.toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
            }),
            new Date(customer.created_at).toLocaleDateString(),
            <div key="controls" className="flex flex-wrap gap-1">
              {["active", "restricted", "suspended"]
                .filter((s) => s !== customer.account_status)
                .map((status) => (
                  <button
                    key={status}
                    disabled={!note.trim()}
                    className="dash-button min-h-8 px-2 capitalize disabled:opacity-40"
                    onClick={() => void change(customer.id, status)}
                  >
                    {status}
                  </button>
                ))}
            </div>,
          ])}
        />
      </AdminCard>
    </>
  );
}
