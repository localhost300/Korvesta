import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cancelBinanceOrder } from "@/lib/providers/binance";
import { rejectCrossSiteMutation } from "@/lib/security/request";
import { requireActiveCustomer } from "@/lib/security/account-status";
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const crossSite = rejectCrossSiteMutation(request);
  if (crossSite) return crossSite;
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
  const blocked = await requireActiveCustomer(
    request,
    supabase,
    user.id,
    "trading_order_cancel",
  );
  if (blocked) return blocked;
  const { id } = await params;
  const { data: order } = await supabase
    .from("trading_orders")
    .select("id,pair,provider,external_order_id,status")
    .eq("id", id)
    .single();
  if (!order || !["open", "partially_filled"].includes(order.status))
    return NextResponse.json(
      { error: "Open order not found." },
      { status: 404 },
    );
  if (order.provider === "binance") {
    if (!order.external_order_id)
      return NextResponse.json(
        {
          error: "Provider order ID is missing; reconcile before cancellation.",
        },
        { status: 409 },
      );
    try {
      await cancelBinanceOrder(
        order.pair.replace("/", ""),
        order.external_order_id,
      );
      const result = await supabase.rpc("set_live_order_cancelled", {
        order_id: id,
      });
      if (result.error) throw new Error(result.error.message);
      return NextResponse.json({ ok: true });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Cancellation failed.",
        },
        { status: 400 },
      );
    }
  }
  const { data, error } = await supabase.rpc("cancel_paper_order", {
    order_id: id,
  });
  return error
    ? NextResponse.json({ error: error.message }, { status: 400 })
    : NextResponse.json({ data });
}
