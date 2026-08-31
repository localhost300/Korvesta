"use client";
/* eslint-disable react-hooks/set-state-in-effect -- initial request data is loaded from the authenticated admin API */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  IconCheck,
  IconEye,
  IconRefresh,
  IconSettings,
  IconX,
} from "@tabler/icons-react";
import { AdminCard, AdminHeading, AdminStatus, AdminTable } from "./AdminUI";
import { CryptoLogo } from "@/components/CryptoLogo";

type Payment = {
  id: string;
  type: "deposit" | "withdrawal";
  amount: string;
  fee?: string;
  destination?: string;
  transaction_hash?: string;
  proof_path?: string;
  status: "pending" | "approved" | "rejected";
  review_note?: string;
  created_at: string;
  assets: { symbol: string } | null;
  networks: { name: string } | null;
};

export function LivePaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/admin/payments");
    const body = await response.json();
    if (!response.ok)
      return setError(body.error ?? "Payments could not be loaded.");
    setPayments(body.data);
    setError("");
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function decide(decision: "approve" | "reject") {
    if (!selected) return;
    if (decision === "reject" && note.trim().length < 3)
      return setError("Enter a rejection reason.");
    const response = await fetch(
      `/api/admin/payments/${selected.id}/${decision}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selected.type, note }),
      },
    );
    const body = await response.json();
    if (!response.ok) return setError(body.error ?? "Decision failed.");
    setMessage(`${selected.type} request ${selected.id} was ${decision}d.`);
    setSelected(null);
    setNote("");
    await load();
  }
  async function openProof(path: string) {
    setError("");
    const response = await fetch(
      `/api/admin/payment-proofs?path=${encodeURIComponent(path)}`,
    );
    const body = await response.json();
    if (!response.ok)
      return setError(body.error ?? "Proof could not be opened.");
    window.open(body.url, "_blank", "noopener,noreferrer");
  }
  const tone = (status: Payment["status"]) =>
    status === "approved" ? "green" : status === "rejected" ? "red" : "yellow";
  return (
    <>
      <AdminHeading
        title="Deposits & Withdrawals"
        subtitle="Every customer request remains pending until an administrator approves or rejects it."
        action={
          <Link href="/admin/payments/methods" className="gold-button">
            <IconSettings size={16} />
            Manage deposit methods
          </Link>
        }
      />
      {error ? (
        <p className="mb-4 rounded-xl border border-[#ef444455] p-3 text-xs text-[#ef4444]">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-xl border border-[#00d08455] p-3 text-xs text-[#00d084]">
          {message}
        </p>
      ) : null}
      <AdminCard
        title="Approval queue"
        action={
          <button onClick={() => void load()} className="dash-button min-h-8">
            <IconRefresh size={14} />
            Refresh
          </button>
        }
      >
        <AdminTable
          headers={[
            "Reference",
            "Type",
            "Asset",
            "Network",
            "Amount",
            "Submitted",
            "Status",
            "Action",
          ]}
          rows={payments.map((payment) => [
            <code key="id">{payment.id.slice(0, 8)}</code>,
            <span key="type" className="capitalize">
              {payment.type}
            </span>,
            payment.assets?.symbol ? (
              <span key="asset" className="flex items-center gap-2">
                <CryptoLogo symbol={payment.assets.symbol} size="sm" />
                <b>{payment.assets.symbol}</b>
              </span>
            ) : (
              "—"
            ),
            payment.networks?.name ?? "—",
            Number(payment.amount).toLocaleString(),
            new Date(payment.created_at).toLocaleString(),
            <AdminStatus key="status" tone={tone(payment.status)}>
              {payment.status}
            </AdminStatus>,
            <button
              key="review"
              disabled={payment.status !== "pending"}
              onClick={() => setSelected(payment)}
              className="dash-button min-h-8 disabled:opacity-40"
            >
              Review
            </button>,
          ])}
        />
      </AdminCard>
      {selected ? (
        <div className="fixed inset-0 z-[150] grid place-items-center bg-black/75 p-4">
          <AdminCard className="w-full max-w-xl">
            <div className="flex justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold capitalize">
                  Review {selected.type}
                </h2>
                <p className="mt-1 text-xs text-[var(--dash-muted)]">
                  {selected.id}
                </p>
              </div>
              <button onClick={() => setSelected(null)}>
                <IconX size={18} />
              </button>
            </div>
            <div className="mt-5 grid gap-3 text-xs">
              {[
                [
                  "Asset",
                  selected.assets?.symbol ? (
                    <span
                      key="selected-asset"
                      className="inline-flex items-center gap-2"
                    >
                      <CryptoLogo symbol={selected.assets.symbol} size="sm" />
                      {selected.assets.symbol}
                    </span>
                  ) : null,
                ],
                ["Network", selected.networks?.name],
                ["Amount", selected.amount],
                ["Transaction hash", selected.transaction_hash],
                ["Destination", selected.destination],
                ["Proof path", selected.proof_path],
              ]
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="flex justify-between gap-6 border-b border-[var(--dash-line)] py-2"
                  >
                    <span className="text-[var(--dash-muted)]">{label}</span>
                    <b className="max-w-[65%] break-all text-right">{value}</b>
                  </div>
                ))}
            </div>
            {selected.proof_path ? (
              <button
                type="button"
                onClick={() => void openProof(selected.proof_path!)}
                className="dash-button mt-4 w-full"
              >
                <IconEye size={16} />
                Open uploaded proof
              </button>
            ) : null}
            <label className="mt-5 block text-xs">
              Decision note
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="dash-input mt-2 min-h-24 py-3"
              />
            </label>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => void decide("reject")}
                className="dash-button text-[#ef4444]"
              >
                <IconX size={16} />
                Reject
              </button>
              <button
                onClick={() => void decide("approve")}
                className="gold-button"
              >
                <IconCheck size={16} />
                Confirm
              </button>
            </div>
          </AdminCard>
        </div>
      ) : null}
    </>
  );
}
