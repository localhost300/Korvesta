import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { coinGecko } from "@/lib/providers/coingecko";
import { rejectCrossSiteMutation } from "@/lib/security/request";
async function adminContext() {
  const supabase = await createClient();
  if (!supabase)
    return {
      error: NextResponse.json(
        { error: "Supabase is not configured." },
        { status: 503 },
      ),
    };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      error: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      ),
    };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return {
      error: NextResponse.json(
        { error: "Administrator access required." },
        { status: 403 },
      ),
    };
  return { supabase };
}
export async function GET() {
  const context = await adminContext();
  if (context.error) return context.error;
  const admin = createAdminClient();
  if (!admin)
    return NextResponse.json(
      { error: "Server administrator key is not configured." },
      { status: 503 },
    );
  const [profilesResult, accountsResult, usersResult] = await Promise.all([
    admin
      .from("profiles")
      .select("id,full_name,country,role,account_status,kyc_status,created_at")
      .eq("role", "customer")
      .order("created_at", { ascending: false }),
    admin
      .from("ledger_accounts")
      .select(
        "owner_id,purpose,assets(symbol,coingecko_id),ledger_entries(amount)",
      )
      .not("owner_id", "is", null)
      .in("purpose", [
        "customer_available",
        "customer_hold",
        "customer_investment",
      ]),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  const error =
    profilesResult.error ?? accountsResult.error ?? usersResult.error;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  const holdings = new Map<
    string,
    Array<{ symbol: string; coingeckoId: string | null; quantity: number }>
  >();
  for (const account of accountsResult.data ?? []) {
    if (!account.owner_id) continue;
    const asset = Array.isArray(account.assets)
      ? account.assets[0]
      : account.assets;
    const quantity = (account.ledger_entries ?? []).reduce(
      (sum: number, e: { amount: string }) => sum + Number(e.amount),
      0,
    );
    const current = holdings.get(account.owner_id) ?? [];
    const existing = current.find((item) => item.symbol === asset?.symbol);
    if (existing) existing.quantity += quantity;
    else if (asset)
      current.push({
        symbol: asset.symbol,
        coingeckoId: asset.coingecko_id,
        quantity,
      });
    holdings.set(account.owner_id, current);
  }
  const ids = [
    ...new Set(
      [...holdings.values()].flatMap((rows) =>
        rows.flatMap((row) => (row.coingeckoId ? [row.coingeckoId] : [])),
      ),
    ),
  ];
  let prices: Record<string, { price: number }> = {};
  try {
    prices = ids.length ? await coinGecko.prices(ids) : {};
  } catch {}
  const emails = new Map(
    usersResult.data.users.map((user) => [user.id, user.email ?? ""]),
  );
  return NextResponse.json({
    customers: (profilesResult.data ?? []).map((profile) => {
      const assets = holdings.get(profile.id) ?? [];
      return {
        ...profile,
        email: emails.get(profile.id) ?? "",
        assetCount: assets.filter((item) => item.quantity !== 0).length,
        portfolioValue: assets.reduce(
          (sum, item) =>
            sum +
            item.quantity *
              (item.coingeckoId ? (prices[item.coingeckoId]?.price ?? 0) : 0),
          0,
        ),
      };
    }),
  });
}
export async function PATCH(request: Request) {
  const cross = rejectCrossSiteMutation(request);
  if (cross) return cross;
  const context = await adminContext();
  if (context.error) return context.error;
  const body = await request.json().catch(() => null);
  if (body?.action === "adjust_balance") {
    const { error } = await context.supabase!.rpc("adjust_customer_balance", {
      customer_id: body?.customerId,
      requested_amount: body?.amount,
      adjustment_kind: body?.kind,
      note: body?.note,
    });
    return error
      ? NextResponse.json({ error: error.message }, { status: 400 })
      : NextResponse.json({ ok: true });
  }
  if (body?.action === "change_password") {
    const password = typeof body?.password === "string" ? body.password : "";
    if (password.length < 8)
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    const admin = createAdminClient();
    if (!admin)
      return NextResponse.json({ error: "Server administrator key is not configured." }, { status: 503 });
    const { error } = await admin.auth.admin.updateUserById(body?.customerId, { password });
    return error
      ? NextResponse.json({ error: error.message }, { status: 400 })
      : NextResponse.json({ ok: true });
  }
  if (body?.action === "update_profile") {
    const { error } = await context.supabase!.rpc("update_customer_profile", {
      customer_id: body?.customerId,
      requested_name: body?.fullName,
      requested_country: body?.country,
      note: body?.note,
    });
    return error
      ? NextResponse.json({ error: error.message }, { status: 400 })
      : NextResponse.json({ ok: true });
  }
  const { error } = await context.supabase!.rpc("set_customer_account_status", {
    customer_id: body?.customerId,
    next_status: body?.status,
    note: body?.note,
  });
  return error
    ? NextResponse.json({ error: error.message }, { status: 400 })
    : NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const cross = rejectCrossSiteMutation(request);
  if (cross) return cross;
  const context = await adminContext();
  if (context.error) return context.error;
  const body = await request.json().catch(() => null);
  if (!body?.customerId || body?.confirmation !== "DELETE")
    return NextResponse.json({ error: "Type DELETE to confirm account deletion." }, { status: 400 });
  const admin = createAdminClient();
  if (!admin)
    return NextResponse.json({ error: "Server administrator key is not configured." }, { status: 503 });
  const { data: profile } = await admin.from("profiles").select("role").eq("id", body.customerId).single();
  if (profile?.role !== "customer")
    return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  const { error } = await admin.auth.admin.deleteUser(body.customerId);
  return error
    ? NextResponse.json({ error: error.message }, { status: 400 })
    : NextResponse.json({ ok: true });
}
