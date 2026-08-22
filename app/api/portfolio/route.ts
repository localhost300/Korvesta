import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { coinGecko } from "@/lib/providers/coingecko";

type BalanceRow = {
  asset_id: string;
  symbol: string;
  coingecko_id: string | null;
  available_quantity: string;
  held_quantity: string;
  invested_quantity: string;
  total_quantity: string;
};
export async function GET() {
  const supabase = await createClient();
  if (!supabase)
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const { data, error } = await supabase.rpc("get_portfolio_balances");
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  const balances = (data ?? []) as unknown as BalanceRow[];
  try {
    const ids = [
      ...new Set(
        balances.flatMap((row) => (row.coingecko_id ? [row.coingecko_id] : [])),
      ),
    ];
    const market = ids.length ? await coinGecko.prices(ids) : {};
    const raw = balances.map((row) => {
      const price = row.coingecko_id
        ? (market[row.coingecko_id]?.price ?? 0)
        : 0;
      const availableValue = Number(row.available_quantity) * price;
      const heldValue = Number(row.held_quantity) * price;
      const investedValue = Number(row.invested_quantity) * price;
      return {
        assetId: row.asset_id,
        symbol: row.symbol,
        available: row.available_quantity,
        held: row.held_quantity,
        invested: row.invested_quantity,
        quantity: row.total_quantity,
        price: String(price),
        value: String(availableValue + heldValue + investedValue),
        availableValue,
        heldValue,
        investedValue,
      };
    });
    const totalValue = raw.reduce((sum, row) => sum + Number(row.value), 0);
    return NextResponse.json({
      positions: raw.map((row) => ({
        assetId: row.assetId,
        symbol: row.symbol,
        available: row.available,
        held: row.held,
        invested: row.invested,
        quantity: row.quantity,
        price: row.price,
        value: row.value,
        allocation: totalValue
          ? Number(((Number(row.value) / totalValue) * 100).toFixed(2))
          : 0,
      })),
      totalValue: String(totalValue),
      availableValue: String(
        raw.reduce((sum, row) => sum + row.availableValue, 0),
      ),
      heldValue: String(raw.reduce((sum, row) => sum + row.heldValue, 0)),
      investedValue: String(
        raw.reduce((sum, row) => sum + row.investedValue, 0),
      ),
      updatedAt: ids.length
        ? Math.min(...Object.values(market).map((item) => item.updatedAt))
        : null,
      provider: ids.length ? "coingecko" : "ledger",
    });
  } catch (cause) {
    return NextResponse.json(
      {
        error:
          cause instanceof Error
            ? cause.message
            : "Portfolio pricing unavailable.",
      },
      { status: 502 },
    );
  }
}
