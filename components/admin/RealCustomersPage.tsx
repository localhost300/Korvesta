"use client";
import { useEffect, useMemo, useState } from "react";
import {
  AdminCard,
  AdminHeading,
  AdminMetric,
  AdminModal,
  AdminStatus,
  AdminTable,
  ConfirmBox,
  FieldLabel,
} from "./AdminUI";
import {
  IconEdit,
  IconKey,
  IconLock,
  IconTrash,
  IconShieldCheck,
  IconUsers,
  IconWallet,
} from "@tabler/icons-react";
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
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<
    | { type: "edit"; customer: Customer }
    | { type: "access" | "balance" | "password" | "delete"; customer: Customer }
    | null
  >(null);
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState("");
  const [balanceKind, setBalanceKind] = useState<"credit" | "debit">("credit");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
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
  function openEdit(customer: Customer) {
    setError("");
    setNote("");
    setFullName(customer.full_name);
    setCountry(customer.country ?? "");
    setModal({ type: "edit", customer });
  }
  function openAccess(customer: Customer) {
    setError("");
    setNote("");
    setModal({ type: "access", customer });
  }
  async function change(customerId: string, status: string) {
    setSaving(true);
    const response = await fetch("/api/admin/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, status, note }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error);
      setSaving(false);
      return;
    }
    setNotice(`Customer access changed to ${status}.`);
    setNote("");
    await load();
    setSaving(false);
    setModal(null);
  }
  async function saveProfile(customerId: string) {
    setSaving(true);
    const response = await fetch("/api/admin/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_profile",
        customerId,
        fullName,
        country,
        note,
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error);
      setSaving(false);
      return;
    }
    setNotice("Customer details updated successfully.");
    await load();
    setSaving(false);
    setModal(null);
  }
  function openAction(type: "balance" | "password" | "delete", customer: Customer) {
    setError(""); setNote(""); setAmount(""); setPassword(""); setConfirmation("");
    setModal({ type, customer });
  }
  async function runAction(action: "adjust_balance" | "change_password" | "delete", customerId: string) {
    setSaving(true); setError("");
    const response = await fetch("/api/admin/customers", {
      method: action === "delete" ? "DELETE" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, customerId, amount: Number(amount), kind: balanceKind, note, password, confirmation }),
    });
    const body = await response.json();
    if (!response.ok) { setError(body.error); setSaving(false); return; }
    setNotice(action === "adjust_balance" ? "Customer balance updated." : action === "change_password" ? "Customer password changed." : "Customer account deleted.");
    await load(); setSaving(false); setModal(null);
  }
  return (
    <>
      <AdminHeading
        title="Customer Management"
        subtitle="Real customer profiles, verification states, access controls, and ledger values."
      />
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      {notice && <p className="mb-4 text-sm text-[#00d084]">{notice}</p>}
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
        <div className="mb-4">
          <input
            className="dash-input"
            placeholder="Search customers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
              <button
                type="button"
                className="dash-button min-h-8 px-3"
                onClick={() => openEdit(customer)}
              >
                <IconEdit size={14} /> Edit
              </button>
              <button
                type="button"
                className="dash-button min-h-8 px-3"
                onClick={() => openAccess(customer)}
              >
                <IconLock size={14} /> Manage access
              </button>
              <button type="button" className="dash-button min-h-8 px-3" onClick={() => openAction("balance", customer)}><IconWallet size={14} /> Balance</button>
              <button type="button" className="dash-button min-h-8 px-3" onClick={() => openAction("password", customer)}><IconKey size={14} /> Password</button>
              <button type="button" className="dash-button min-h-8 px-3 text-[#ef4444]" onClick={() => openAction("delete", customer)}><IconTrash size={14} /> Delete</button>
            </div>,
          ])}
        />
      </AdminCard>
      {modal?.type === "edit" ? (
        <AdminModal
          title="Edit customer"
          copy={`Update ${modal.customer.full_name || modal.customer.email}'s profile details.`}
          close={() => setModal(null)}
        >
          <div className="grid gap-4">
            <FieldLabel label="Full name">
              <input className="dash-input" value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </FieldLabel>
            <FieldLabel label="Email address">
              <input className="dash-input opacity-70" value={modal.customer.email} disabled />
            </FieldLabel>
            <FieldLabel label="Country">
              <input className="dash-input" value={country} onChange={(event) => setCountry(event.target.value)} />
            </FieldLabel>
            <FieldLabel label="Reason for change">
              <textarea className="dash-input min-h-24 py-3" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Required for the audit log" />
            </FieldLabel>
            <button type="button" className="gold-button w-full" disabled={saving || !fullName.trim() || !country.trim() || !note.trim()} onClick={() => void saveProfile(modal.customer.id)}>
              <IconEdit size={16} /> {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </AdminModal>
      ) : null}
      {modal?.type === "access" ? (
        <AdminModal
          title="Manage customer access"
          copy={`Current status: ${modal.customer.account_status}`}
          close={() => setModal(null)}
        >
          <ConfirmBox>
            Restricted means read-only access with trading and withdrawals blocked. Suspended blocks all customer access. Active restores normal access.
          </ConfirmBox>
          <FieldLabel label="Reason for change">
            <textarea className="dash-input mt-4 min-h-24 py-3" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Required for the audit log" />
          </FieldLabel>
          <div className="mt-4 grid gap-2">
            {["active", "restricted", "suspended"].map((status) => (
              <button key={status} type="button" disabled={saving || !note.trim() || status === modal.customer.account_status} className="dash-button w-full justify-between capitalize disabled:opacity-40" onClick={() => void change(modal.customer.id, status)}>
                {status}<span className="text-[10px] font-normal text-[var(--dash-muted)]">{status === "active" ? "Normal access" : status === "restricted" ? "Read-only access" : "No account access"}</span>
              </button>
            ))}
          </div>
        </AdminModal>
      ) : null}
      {modal?.type === "balance" ? <AdminModal title="Adjust customer balance" copy={`Current portfolio: ${modal.customer.portfolioValue.toLocaleString(undefined, { style: "currency", currency: "USD" })}`} close={() => setModal(null)}>
        <ConfirmBox>Credits and debits are posted as balanced USDT ledger entries and recorded in the audit log. A debit cannot exceed the customer&apos;s available balance.</ConfirmBox>
        <div className="mt-4 grid grid-cols-2 gap-2">{(["credit", "debit"] as const).map((kind) => <button key={kind} type="button" className={`dash-button capitalize ${balanceKind === kind ? "border-[#ffc400] text-[#ffc400]" : ""}`} onClick={() => setBalanceKind(kind)}>{kind}</button>)}</div>
        <FieldLabel label="Amount (USDT)"><input className="dash-input" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /></FieldLabel>
        <FieldLabel label="Audit reason"><textarea className="dash-input min-h-24 py-3" value={note} onChange={(event) => setNote(event.target.value)} /></FieldLabel>
        <button type="button" className="gold-button mt-4 w-full" disabled={saving || !(Number(amount) > 0) || !note.trim()} onClick={() => void runAction("adjust_balance", modal.customer.id)}>{saving ? "Posting…" : `Confirm ${balanceKind}`}</button>
      </AdminModal> : null}
      {modal?.type === "password" ? <AdminModal title="Change customer password" copy={modal.customer.email} close={() => setModal(null)}>
        <ConfirmBox>This immediately replaces the customer&apos;s sign-in password. Share it securely and ask the customer to change it after signing in.</ConfirmBox>
        <FieldLabel label="New password"><input type="password" autoComplete="new-password" className="dash-input" value={password} onChange={(event) => setPassword(event.target.value)} /></FieldLabel>
        <button type="button" className="gold-button mt-4 w-full" disabled={saving || password.length < 8} onClick={() => void runAction("change_password", modal.customer.id)}><IconKey size={16}/>{saving ? "Changing…" : "Change password"}</button>
      </AdminModal> : null}
      {modal?.type === "delete" ? <AdminModal title="Delete customer account" copy={modal.customer.email} close={() => setModal(null)}>
        <div className="rounded-xl border border-[#ef444455] bg-[#ef444410] p-4 text-xs leading-5 text-[#ef4444]">This permanently deletes the customer&apos;s authentication account and profile. Financial retention rules may prevent deletion when ledger records exist.</div>
        <FieldLabel label="Type DELETE to confirm"><input className="dash-input" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></FieldLabel>
        <button type="button" className="dash-button mt-4 w-full text-[#ef4444]" disabled={saving || confirmation !== "DELETE"} onClick={() => void runAction("delete", modal.customer.id)}><IconTrash size={16}/>{saving ? "Deleting…" : "Permanently delete customer"}</button>
      </AdminModal> : null}
    </>
  );
}
