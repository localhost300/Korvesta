"use client";
import { useCallback, useEffect, useState } from "react";
import { Card, DataTable, PageHeading, Status } from "./DashboardUI";
type Plan = {
  id: string;
  name: string;
  description: string;
  apy_bps: number;
  duration_days: number;
  minimum_amount: string;
  maximum_amount: string | null;
};
type Position = {
  id: string;
  principal: string;
  apy_bps: number;
  accrued_return: string;
  status: string;
  started_on: string;
  maturity_on: string;
  last_accrual_date: string;
  investment_plans: { name: string } | null;
};
export function FixedInvestmentPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const refresh = useCallback(async () => {
    const response = await fetch("/api/investments");
    const result = await response.json().catch(() => ({}));
    if (response.ok) {
      setPlans(result.plans ?? []);
      setPositions(result.positions ?? []);
    } else setMessage(result.error ?? "Investments unavailable.");
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [refresh]);
  async function subscribe(planId: string) {
    setPending(true);
    setMessage("");
    const response = await fetch("/api/investments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId,
        amount: Number(amounts[planId]),
        idempotencyKey: crypto.randomUUID(),
      }),
    });
    const result = await response.json().catch(() => ({}));
    setPending(false);
    setMessage(
      response.ok
        ? "Investment subscription created."
        : (result.error ?? "Subscription failed."),
    );
    if (response.ok) void refresh();
  }
  async function redeem(id: string) {
    setPending(true);
    const response = await fetch(`/api/investments/${id}/redeem`, {
      method: "POST",
    });
    const result = await response.json().catch(() => ({}));
    setPending(false);
    setMessage(
      response.ok
        ? "Principal and accrued ROI returned to your available balance."
        : (result.error ?? "Redemption failed."),
    );
    if (response.ok) void refresh();
  }
  const principal = positions
    .filter((p) => p.status !== "redeemed")
    .reduce((s, p) => s + Number(p.principal), 0);
  const roi = positions
    .filter((p) => p.status !== "redeemed")
    .reduce((s, p) => s + Number(p.accrued_return), 0);
  return (
    <>
      <PageHeading
        title="Investment Portfolio"
        subtitle="View available investment options and track investments created from your account."
      />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Card>
          <small className="text-[#849099]">Active Principal</small>
          <b className="mt-2 block text-2xl">${principal.toLocaleString()}</b>
        </Card>
        <Card>
          <small className="text-[#849099]">Accrued ROI</small>
          <b className="mt-2 block text-2xl text-[#00d084]">
            ${roi.toFixed(2)}
          </b>
        </Card>
        <Card>
          <small className="text-[#849099]">Active Positions</small>
          <b className="mt-2 block text-2xl">
            {positions.filter((p) => p.status === "active").length}
          </b>
        </Card>
      </div>
      {!plans.length ? (
        <Card className="mt-4">
          <div className="py-8 text-center">
            <h2 className="font-semibold">No investment options available</h2>
            <p className="mt-2 text-sm text-[#849099]">Investment options will appear here after an administrator creates and activates them.</p>
          </div>
        </Card>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id} title={plan.name}>
            <p className="text-sm text-[#849099]">{plan.description}</p>
            <div className="mt-4 flex justify-between">
              <span>
                <b className="text-3xl text-[#00d084]">
                  {(plan.apy_bps / 100).toFixed(2)}%
                </b>
                <small className="block text-[#849099]">fixed APY</small>
              </span>
              <span className="text-right text-sm">
                {plan.duration_days} days
                <small className="block text-[#849099]">
                  Minimum ${Number(plan.minimum_amount).toLocaleString()}
                </small>
              </span>
            </div>
            <input
              className="dash-input mt-5"
              inputMode="decimal"
              placeholder={`Amount (minimum ${plan.minimum_amount} USDT)`}
              value={amounts[plan.id] ?? ""}
              onChange={(e) =>
                setAmounts((x) => ({ ...x, [plan.id]: e.target.value }))
              }
            />
            <button
              disabled={pending}
              onClick={() => void subscribe(plan.id)}
              className="gold-button mt-3 w-full disabled:opacity-50"
            >
              Invest USDT
            </button>
          </Card>
        ))}
      </div>
      {message ? (
        <p
          role="status"
          className="mt-4 rounded-lg border border-[#40370f] p-3 text-xs text-[#ffc400]"
        >
          {message}
        </p>
      ) : null}
      <Card className="mt-4" title="My Investments">
        {positions.length ? <DataTable
          headers={[
            "Plan",
            "Principal",
            "APY",
            "Accrued ROI",
            "Started",
            "Maturity",
            "Status",
            "Action",
          ]}
          rows={positions.map((p) => [
            p.investment_plans?.name ?? "Plan",
            Number(p.principal).toFixed(2),
            `${(p.apy_bps / 100).toFixed(2)}%`,
            Number(p.accrued_return).toFixed(4),
            p.started_on,
            p.maturity_on,
            <Status
              key="status"
              tone={p.status === "matured" ? "green" : "yellow"}
            >
              {p.status}
            </Status>,
            p.status === "matured" ? (
              <button
                key="redeem"
                onClick={() => void redeem(p.id)}
                className="text-[#ffc400]"
              >
                Redeem
              </button>
            ) : (
              "—"
            ),
          ])}
        /> : <p className="py-8 text-center text-sm text-[#849099]">You have not made any investments yet.</p>}
      </Card>
      <Card className="mt-4">
        <p className="text-xs leading-6 text-[#849099]">
          Returns shown are contractual accrual calculations, not market gains.
          Production offering requires verified reserve funding, complete
          disclosures, and legal authorization in every supported jurisdiction.
          Early redemption is not enabled.
        </p>
      </Card>
    </>
  );
}
