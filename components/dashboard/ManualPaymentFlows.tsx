"use client";
/* eslint-disable react-hooks/set-state-in-effect -- initial selections synchronize with asynchronously loaded provider data */
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  IconCheck,
  IconCloudUpload,
  IconCopy,
  IconLock,
} from "@tabler/icons-react";
import { QRCodeSVG } from "qrcode.react";
import { Card, PageHeading } from "./DashboardUI";
import { usePortfolio } from "@/lib/use-portfolio";
import { CryptoLogo } from "@/components/CryptoLogo";

type Network = {
  id: string;
  name: string;
  confirmation_target: number;
  deposit_address: string | null;
  qr_code_url: string | null;
};
type Asset = {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  logo_color: string;
  networks: Network[];
};
function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/assets")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setAssets(body.data);
      })
      .catch((reason) => setError(reason.message));
  }, []);
  return { assets, error };
}
function Notice({ error, success }: { error: string; success: string }) {
  return error ? (
    <p
      role="alert"
      className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-400"
    >
      {error}
    </p>
  ) : success ? (
    <p
      role="status"
      className="rounded-lg border border-[#00d08455] bg-[#00d08410] p-4 text-xs text-[#00d084]"
    >
      {success}
    </p>
  ) : null;
}

export function DepositFlow() {
  const { assets, error: loadError } = useAssets();
  const [assetId, setAssetId] = useState("");
  const asset = assets.find((item) => item.id === assetId) ?? assets[0];
  const [networkId, setNetworkId] = useState("");
  const network =
    asset?.networks.find((item) => item.id === networkId) ?? asset?.networks[0];
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const [proof, setProof] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (asset && !assetId) setAssetId(asset.id);
  }, [asset, assetId]);
  useEffect(() => {
    if (asset?.networks[0]) setNetworkId(asset.networks[0].id);
  }, [asset]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!asset || !network) return;
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    form.set("asset", asset.symbol);
    form.set("network", network.name);
    const response = await fetch("/api/payments/deposits", {
      method: "POST",
      body: form,
    }).catch(() => null);
    const result = response ? await response.json().catch(() => ({})) : {};
    setPending(false);
    if (!response?.ok) {
      setError(result.error ?? "Deposit submission failed.");
      return;
    }
    setSuccess(
      `Deposit request ${result.data.id} is awaiting manual confirmation.`,
    );
    event.currentTarget.reset();
    setProof(null);
  }
  return (
    <>
      <PageHeading
        title="Request a Deposit"
        subtitle="Submit an on-chain transfer for manual confirmation. Your balance changes only after approval."
      />
      <Card className="mx-auto max-w-3xl p-6">
        <Notice error={error || loadError} success={success} />
        <form onSubmit={submit} className="mt-5 grid gap-4">
          <label className="text-xs font-semibold">
            Asset
            <select
              className="dash-input mt-2"
              value={asset?.id ?? ""}
              onChange={(event) => setAssetId(event.target.value)}
            >
              {assets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.symbol})
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold">
            Network
            <select
              className="dash-input mt-2"
              value={network?.id ?? ""}
              onChange={(event) => setNetworkId(event.target.value)}
            >
              {asset?.networks.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.confirmation_target} confirmations
                </option>
              ))}
            </select>
          </label>
          {network?.deposit_address ? (
            <div className="grid gap-5 rounded-2xl border border-[#ffc40055] bg-[#ffc40008] p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <div className="mb-4 flex items-center gap-3">
                  <CryptoLogo
                    symbol={asset.symbol}
                    size="lg"
                    className="!size-10"
                  />
                  <div>
                    <p className="text-sm font-bold">{asset.name}</p>
                    <p className="text-xs text-[var(--dash-muted)]">
                      {asset.symbol} on {network.name}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-[var(--dash-muted)]">
                  Deposit address
                </span>
                <code className="mt-2 block break-all text-xs leading-5">
                  {network.deposit_address}
                </code>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#45535c] px-3 py-2 text-xs font-semibold transition hover:border-[#ffc400]"
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      network.deposit_address!,
                    );
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1800);
                  }}
                >
                  <IconCopy size={15} /> {copied ? "Copied" : "Copy address"}
                </button>
              </div>
              <div className="mx-auto rounded-2xl bg-white p-3 shadow-xl sm:mx-0">
                {network.qr_code_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed private-storage URLs are intentionally not optimized
                  <img
                    src={network.qr_code_url}
                    alt={`${asset.symbol} deposit QR code on ${network.name}`}
                    width={148}
                    height={148}
                    className="size-[148px] object-contain"
                  />
                ) : (
                  <QRCodeSVG
                    value={network.deposit_address}
                    size={148}
                    level="M"
                    title={`${asset.symbol} deposit address on ${network.name}`}
                  />
                )}
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-[#ffc40055] bg-[#ffc4000b] p-4 text-xs">
              A finance administrator must assign a deposit address before
              deposits can be accepted on this network.
            </p>
          )}
          <label className="text-xs font-semibold">
            Amount
            <input
              required
              name="amount"
              inputMode="decimal"
              pattern="\d+(\.\d+)?"
              className="dash-input mt-2"
              placeholder="0.00"
            />
          </label>
          <label className="text-xs font-semibold">
            Transaction hash
            <input
              required
              name="transactionHash"
              className="dash-input mt-2 font-mono"
              placeholder="Paste the on-chain transaction hash"
            />
          </label>
          <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#45535c] px-4 text-center text-xs transition hover:border-[#ffc400]">
            <IconCloudUpload className="mb-2 text-[#ffc400]" />
            <span className="font-semibold">
              {proof ? proof.name : "Choose payment proof"}
            </span>
            <span className="mt-1 text-[var(--dash-muted)]">
              {proof
                ? `${(proof.size / 1024 / 1024).toFixed(2)} MB selected`
                : "PNG, JPG, JPEG or PDF · maximum 10 MB"}
            </span>
            <input
              required
              name="proof"
              type="file"
              accept="image/png,image/jpeg,application/pdf"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (file && file.size > 10 * 1024 * 1024) {
                  setProof(null);
                  setError("The proof file must be smaller than 10 MB.");
                  event.target.value = "";
                  return;
                }
                setError("");
                setProof(file);
              }}
            />
          </label>
          <button
            disabled={pending || !network?.deposit_address || !proof}
            className="gold-button disabled:opacity-50"
          >
            {pending ? "Submitting…" : "Submit for verification"}
          </button>
        </form>
      </Card>
    </>
  );
}

export function WithdrawFlow() {
  const { assets, error: loadError } = useAssets();
  const portfolio = usePortfolio();
  const [assetId, setAssetId] = useState("");
  const asset = assets.find((item) => item.id === assetId) ?? assets[0];
  const [networkId, setNetworkId] = useState("");
  const network = useMemo(
    () =>
      asset?.networks.find((item) => item.id === networkId) ??
      asset?.networks[0],
    [asset, networkId],
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const requestKey = useRef(crypto.randomUUID());
  const holding = portfolio.positions.find(
    (item) => item.assetId === asset?.id,
  );
  const available = Number(holding?.available ?? 0);
  useEffect(() => {
    if (asset && !assetId) setAssetId(asset.id);
  }, [asset, assetId]);
  useEffect(() => {
    if (asset?.networks[0]) setNetworkId(asset.networks[0].id);
  }, [asset]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!asset || !network) return;
    if (!(Number(amount) > 0) || Number(amount) > available) {
      setError(
        `Enter an amount no greater than your available ${asset.symbol} balance.`,
      );
      return;
    }
    setPending(true);
    setError("");
    const response = await fetch("/api/payments/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId: asset.id,
        networkId: network.id,
        amount,
        destination,
        requestKey: requestKey.current,
      }),
    }).catch(() => null);
    const result = response ? await response.json().catch(() => ({})) : {};
    setPending(false);
    if (!response?.ok) {
      setError(result.error ?? "Withdrawal submission failed.");
      return;
    }
    setSuccess(
      `Withdrawal ${result.id} is reserved and awaiting administrator confirmation.`,
    );
    setAmount("");
    setDestination("");
    requestKey.current = crypto.randomUUID();
    await portfolio.refresh();
  }
  return (
    <>
      <PageHeading
        title="Request a Withdrawal"
        subtitle="Funds are reserved immediately and released only after administrator confirmation."
      />
      <Card className="mx-auto max-w-3xl p-6">
        <Notice error={error || loadError} success={success} />
        <form onSubmit={submit} className="mt-5 grid gap-4">
          <label className="text-xs font-semibold">
            Asset
            <select
              className="dash-input mt-2"
              value={asset?.id ?? ""}
              onChange={(event) => setAssetId(event.target.value)}
            >
              {assets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.symbol})
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold">
            Network
            <select
              className="dash-input mt-2"
              value={network?.id ?? ""}
              onChange={(event) => setNetworkId(event.target.value)}
            >
              {asset?.networks.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold">
            Destination address
            <input
              required
              name="destination"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              className="dash-input mt-2 font-mono"
              placeholder={`Enter the destination address on ${network?.name ?? "the selected network"}`}
            />
          </label>
          <label className="text-xs font-semibold">
            <span className="flex justify-between gap-3">
              <span>Amount</span>
              <span className="font-normal text-[var(--dash-muted)]">
                Available:{" "}
                {portfolio.loading
                  ? "Loading…"
                  : `${available.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${asset?.symbol ?? ""}`}
              </span>
            </span>
            <input
              required
              name="amount"
              inputMode="decimal"
              pattern="\d+(\.\d+)?"
              min="0"
              max={available || undefined}
              step={asset ? String(10 ** -Math.min(asset.decimals, 8)) : "any"}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="dash-input mt-2"
              placeholder="0.00"
            />
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-[#ffc400]"
              onClick={() => setAmount(String(available))}
              disabled={!available}
            >
              Use maximum
            </button>
          </label>
          <div className="rounded-xl border border-[#263038] p-4 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--dash-muted)]">
                Withdrawal amount
              </span>
              <b>
                {Number(amount || 0).toLocaleString(undefined, {
                  maximumFractionDigits: 8,
                })}{" "}
                {asset?.symbol}
              </b>
            </div>
            <div className="mt-3 flex justify-between">
              <span className="text-[var(--dash-muted)]">
                Platform/network fee
              </span>
              <b>0 {asset?.symbol}</b>
            </div>
            <div className="mt-3 flex justify-between border-t border-[#263038] pt-3">
              <span>You will receive</span>
              <b>
                {Number(amount || 0).toLocaleString(undefined, {
                  maximumFractionDigits: 8,
                })}{" "}
                {asset?.symbol}
              </b>
            </div>
          </div>
          <div className="rounded-xl border border-[#ffc40055] bg-[#ffc4000b] p-4 text-xs leading-5">
            <IconLock size={16} className="mb-2 text-[#ffc400]" />
            Submitting reserves the requested balance. Manual compliance and
            destination checks occur before administrator confirmation.
          </div>
          <button
            disabled={pending || portfolio.loading || !network || !available}
            className="gold-button disabled:opacity-50"
          >
            {pending ? "Submitting…" : "Submit withdrawal request"}
          </button>
        </form>
        {success ? (
          <Link href="/dashboard/transactions" className="dash-button mt-4">
            <IconCheck size={16} />
            View transactions
          </Link>
        ) : null}
      </Card>
    </>
  );
}
