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
  const { error } = await supabase.rpc("reject_payment", {
    request_id: (await params).id,
    payment_type: body.type,
    note: body.note,
  });
  return error
    ? NextResponse.json({ error: error.message }, { status: 400 })
    : NextResponse.json({ ok: true });
}
