import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 403 },
    );
  const body = await request.json().catch(() => ({}));
  const { data, error } = await supabase
    .from("networks")
    .update({ enabled: Boolean(body.enabled) })
    .eq("id", (await params).id)
    .select("id,enabled")
    .single();
  return error
    ? NextResponse.json({ error: error.message }, { status: 400 })
    : NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 403 },
    );

  const id = (await params).id;
  const { data: method, error: lookupError } = await supabase
    .from("networks")
    .select("id,asset_id,qr_code_path")
    .eq("id", id)
    .single();
  if (lookupError || !method)
    return NextResponse.json(
      { error: lookupError?.message ?? "Deposit method was not found." },
      { status: 404 },
    );

  // Archive instead of physically deleting so historical deposits and
  // withdrawals keep their network references.
  const { error } = await supabase
    .from("networks")
    .update({
      enabled: false,
      deposit_address: null,
      deposit_address_encrypted: null,
      qr_code_path: null,
    })
    .eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  if (method.qr_code_path)
    await supabase.storage
      .from("deposit-qr-codes")
      .remove([method.qr_code_path]);

  const { count } = await supabase
    .from("networks")
    .select("id", { count: "exact", head: true })
    .eq("asset_id", method.asset_id)
    .eq("enabled", true)
    .not("deposit_address_encrypted", "is", null);
  if (!count)
    await supabase
      .from("assets")
      .update({ enabled: false })
      .eq("id", method.asset_id);

  return NextResponse.json({ data: { id, archived: true } });
}
