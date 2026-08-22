import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
export async function POST(request: Request) {
  const secret = process.env.INVESTMENT_CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const admin = createAdminClient();
  if (!admin)
    return NextResponse.json(
      { error: "Service role is not configured." },
      { status: 503 },
    );
  const { data, error } = await admin.rpc("accrue_fixed_investments", {
    run_date: new Date().toISOString().slice(0, 10),
  });
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json({ data });
}
