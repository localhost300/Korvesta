import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rejectCrossSiteMutation } from "@/lib/security/request";

export async function POST(
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
  const body = await request.json().catch(() => ({}));
  const id = (await params).id;
  const rpc =
    body.type === "withdrawal" ? "approve_withdrawal" : "approve_deposit";
  const { data, error } = await supabase.rpc(rpc, {
    request_id: id,
    note: typeof body.note === "string" ? body.note : null,
  });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, state: data ?? "approved" });
}
