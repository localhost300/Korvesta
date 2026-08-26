import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBinanceOrder } from "@/lib/providers/binance";

const statuses: Record<string, string> = {
  NEW: "open",
  PENDING_NEW: "open",
  PARTIALLY_FILLED: "partially_filled",
  FILLED: "filled",
  CANCELED: "cancelled",
  REJECTED: "rejected",
  EXPIRED: "rejected",
  EXPIRED_IN_MATCH: "rejected",
};
export async function POST(request: Request) {
  const secret = process.env.TRADING_CRON_SECRET ?? process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const admin = createAdminClient();
  if (!admin)
    return NextResponse.json(
      { error: "Service role is not configured." },
      { status: 503 },
    );
  const { data: orders, error } = await admin
    .from("trading_orders")
    .select("id,pair,external_order_id")
    .eq("provider", "binance")
    .in("status", ["open", "partially_filled"])
    .not("external_order_id", "is", null)
    .limit(200);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  let updated = 0;
  const failures: string[] = [];
  for (const order of orders ?? []) {
    try {
      const remote = await getBinanceOrder(
        order.pair.replace("/", ""),
        order.external_order_id!,
      );
      const status = statuses[String(remote.status)] ?? "open";
      const executed = Number(remote.executedQty ?? 0);
      const quote = Number(remote.cummulativeQuoteQty ?? 0);
      const fill = executed > 0 ? quote / executed : null;
      const result = await admin
        .from("trading_orders")
        .update({
          status,
          executed_quantity: executed,
          fill_price: fill,
          provider_updated_at: new Date().toISOString(),
          filled_at: status === "filled" ? new Date().toISOString() : null,
          cancelled_at:
            status === "cancelled" ? new Date().toISOString() : null,
        })
        .eq("id", order.id);
      if (result.error) throw result.error;
      updated++;
    } catch (error) {
      failures.push(
        `${order.id}: ${error instanceof Error ? error.message : "failed"}`,
      );
    }
  }
  return NextResponse.json({ checked: orders?.length ?? 0, updated, failures });
}
export { POST as GET };
