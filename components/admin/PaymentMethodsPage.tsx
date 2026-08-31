"use client";
/* eslint-disable react-hooks/set-state-in-effect -- initial method data is loaded from the authenticated admin API */

import { useCallback, useEffect, useState } from "react";
import {
  IconCheck,
  IconPhotoUp,
  IconPlus,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import {
  AdminCard,
  AdminHeading,
  AdminStatus,
  AdminTable,
  FieldLabel,
} from "./AdminUI";
import { CryptoLogo } from "@/components/CryptoLogo";

type Method = {
  id: string;
  name: string;
  chain_id: string | null;
  confirmation_target: number;
  deposit_address: string | null;
  enabled: boolean;
  assets: { symbol: string; name: string; logo_color: string } | null;
};

const CRYPTO_ASSETS = [
  ["BTC", "Bitcoin", "8", "#f7931a"],
  ["ETH", "Ethereum", "18", "#627eea"],
  ["USDT", "Tether", "6", "#26a17b"],
  ["USDC", "USD Coin", "6", "#2775ca"],
  ["BNB", "BNB", "18", "#f3ba2f"],
  ["SOL", "Solana", "9", "#8b5cf6"],
  ["XRP", "XRP", "6", "#23292f"],
  ["ADA", "Cardano", "6", "#3468d4"],
  ["DOGE", "Dogecoin", "8", "#c2a633"],
  ["TRX", "TRON", "6", "#ef0027"],
  ["LTC", "Litecoin", "8", "#345d9d"],
  ["DOT", "Polkadot", "10", "#e6007a"],
] as const;

export function PaymentMethodsPage() {
  const [methods, setMethods] = useState<Method[]>([]);
  const [cryptoPreset, setCryptoPreset] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [qrCode, setQrCode] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState("");
  const [form, setForm] = useState({
    symbol: "",
    assetName: "",
    networkName: "",
    chainId: "",
    depositAddress: "",
    confirmationTarget: "1",
    decimals: "8",
    logoColor: "#f7931a",
  });
  const load = useCallback(async () => {
    const response = await fetch("/api/admin/payment-methods");
    const body = await response.json();
    if (!response.ok)
      return setError(body.error ?? "Methods could not be loaded.");
    setMethods(body.data);
    setError("");
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.set(key, value));
    if (qrCode) payload.set("qrCode", qrCode);
    const response = await fetch("/api/admin/payment-methods", {
      method: "POST",
      body: payload,
    });
    const body = await response.json();
    if (!response.ok)
      return setError(body.error ?? "Method could not be saved.");
    setNotice(
      `${form.symbol} on ${form.networkName} is now available to customers.`,
    );
    setForm({
      symbol: "",
      assetName: "",
      networkName: "",
      chainId: "",
      depositAddress: "",
      confirmationTarget: "1",
      decimals: "8",
      logoColor: "#f7931a",
    });
    setCryptoPreset("");
    setQrCode(null);
    await load();
  }
  async function toggle(method: Method) {
    const response = await fetch(`/api/admin/payment-methods/${method.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !method.enabled }),
    });
    const body = await response.json();
    if (!response.ok)
      return setError(body.error ?? "Method could not be updated.");
    await load();
  }
  async function remove(method: Method) {
    const label = `${method.assets?.symbol ?? "this cryptocurrency"} on ${method.name}`;
    if (
      !window.confirm(
        `Delete ${label}? It will immediately disappear from the user dashboard.`,
      )
    )
      return;
    setDeletingId(method.id);
    setError("");
    const response = await fetch(`/api/admin/payment-methods/${method.id}`, {
      method: "DELETE",
    });
    const body = await response.json().catch(() => ({}));
    setDeletingId("");
    if (!response.ok) {
      setError(body.error ?? "Method could not be deleted.");
      return;
    }
    setNotice(`${label} was deleted.`);
    await load();
  }
  const field =
    (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));
  return (
    <>
      <AdminHeading
        title="Deposit Methods"
        subtitle="Only enabled methods and addresses are shown to customers."
      />
      <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
        <AdminCard title="Add deposit method">
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
            <FieldLabel label="Cryptocurrency and logo">
              <div className="relative">
                <CryptoLogo
                  symbol={form.symbol || "?"}
                  size="sm"
                  className="pointer-events-none !absolute left-3 top-1/2 z-10 -translate-y-1/2"
                />
                <select
                  required
                  className="dash-input !pl-12"
                  value={cryptoPreset}
                  onChange={(event) => {
                    setCryptoPreset(event.target.value);
                    if (event.target.value === "custom") {
                      setForm((current) => ({
                        ...current,
                        symbol: "",
                        assetName: "",
                        decimals: "8",
                        logoColor: "#64748b",
                      }));
                      return;
                    }
                    const selected = CRYPTO_ASSETS.find(
                      ([symbol]) => symbol === event.target.value,
                    );
                    if (selected)
                      setForm((current) => ({
                        ...current,
                        symbol: selected[0],
                        assetName: selected[1],
                        decimals: selected[2],
                        logoColor: selected[3],
                      }));
                  }}
                >
                  <option value="">Select cryptocurrency</option>
                  {CRYPTO_ASSETS.map(([symbol, name]) => (
                    <option key={symbol} value={symbol}>
                      {name} ({symbol})
                    </option>
                  ))}
                  <option value="custom">Other cryptocurrency</option>
                </select>
              </div>
            </FieldLabel>
            {cryptoPreset === "custom" ? (
              <FieldLabel label="Currency symbol">
                <input
                  required
                  className="dash-input uppercase"
                  value={form.symbol}
                  maxLength={12}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      symbol: event.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="e.g. AVAX"
                />
              </FieldLabel>
            ) : null}
            <FieldLabel label="Asset name">
              <input
                required
                className="dash-input"
                value={form.assetName}
                onChange={field("assetName")}
                placeholder="Bitcoin"
              />
            </FieldLabel>
            <FieldLabel label="Network name">
              <input
                required
                className="dash-input"
                value={form.networkName}
                onChange={field("networkName")}
                placeholder="Bitcoin Network"
              />
            </FieldLabel>
            <FieldLabel label="Chain ID (optional)">
              <input
                className="dash-input"
                value={form.chainId}
                onChange={field("chainId")}
                placeholder="1"
              />
            </FieldLabel>
            <FieldLabel label="Confirmations">
              <input
                required
                type="number"
                min="1"
                className="dash-input"
                value={form.confirmationTarget}
                onChange={field("confirmationTarget")}
              />
            </FieldLabel>
            <FieldLabel label="Asset decimals">
              <input
                required
                type="number"
                min="0"
                max="30"
                className="dash-input"
                value={form.decimals}
                onChange={field("decimals")}
              />
            </FieldLabel>
            <FieldLabel label="Deposit address">
              <input
                required
                className="dash-input font-mono"
                value={form.depositAddress}
                onChange={field("depositAddress")}
                placeholder="Wallet address"
              />
            </FieldLabel>
            <FieldLabel label="Custom QR code (optional)">
              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#45535c] px-4 text-xs transition hover:border-[#ffc400]">
                <IconPhotoUp size={19} className="shrink-0 text-[#ffc400]" />
                <span className="min-w-0 truncate">
                  {qrCode ? qrCode.name : "Upload PNG, JPG or WebP (max 2 MB)"}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file && file.size > 2 * 1024 * 1024) {
                      setError("The QR-code image must be under 2 MB.");
                      event.target.value = "";
                      setQrCode(null);
                      return;
                    }
                    setError("");
                    setQrCode(file);
                  }}
                />
              </label>
            </FieldLabel>
            <button className="gold-button self-end">
              <IconPlus size={16} />
              Add method
            </button>
          </form>
          {error ? (
            <p className="mt-4 text-xs text-[#ef4444]">{error}</p>
          ) : null}
          {notice ? (
            <p className="mt-4 flex items-center gap-2 text-xs text-[#00d084]">
              <IconCheck size={15} />
              {notice}
            </p>
          ) : null}
        </AdminCard>
        <AdminCard
          title="Configured methods"
          action={
            <button className="dash-button min-h-8" onClick={() => void load()}>
              <IconRefresh size={14} />
              Refresh
            </button>
          }
        >
          <AdminTable
            headers={[
              "Asset",
              "Network",
              "Address",
              "Confirmations",
              "Status",
              "Action",
              "Delete",
            ]}
            rows={methods.map((method) => [
              <span key="asset" className="flex items-center gap-2">
                <CryptoLogo symbol={method.assets?.symbol ?? "?"} size="sm" />
                <b>{method.assets?.symbol ?? "—"}</b>
              </span>,
              method.name,
              <code key="address" className="block max-w-52 truncate">
                {method.deposit_address ?? "—"}
              </code>,
              String(method.confirmation_target),
              <AdminStatus key="status" tone={method.enabled ? "green" : "red"}>
                {method.enabled ? "Enabled" : "Disabled"}
              </AdminStatus>,
              <button
                key="action"
                className="dash-button min-h-8"
                onClick={() => void toggle(method)}
              >
                {method.enabled ? "Disable" : "Enable"}
              </button>,
              <button
                key="delete"
                disabled={deletingId === method.id}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[#ef444455] px-3 text-xs font-semibold text-[#ef4444] transition hover:bg-[#ef444412] disabled:opacity-50"
                onClick={() => void remove(method)}
              >
                <IconTrash size={14} />
                {deletingId === method.id ? "Deleting…" : "Delete"}
              </button>,
            ])}
          />
        </AdminCard>
      </div>
    </>
  );
}
