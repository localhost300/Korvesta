import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rejectCrossSiteMutation } from "@/lib/security/request";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const cross = rejectCrossSiteMutation(request);
  if (cross) return cross;
  const supabase = await createClient();
  if (!supabase)
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  const body = await request.json().catch(() => null);
  const { error } = await supabase.rpc("decide_kyc", {
    submission_id: (await params).id,
    decision: body?.decision,
    note: body?.note ?? null,
  });
  return error
    ? NextResponse.json({ error: error.message }, { status: 400 })
    : NextResponse.json({ ok: true });
}
export async function GET(
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
  const path = new URL(request.url).searchParams.get("path");
  const id = (await params).id;
  if (!path || !path.includes(`/${id}/`) || path.includes(".."))
    return NextResponse.json(
      { error: "Invalid document path." },
      { status: 400 },
    );
  const { data, error } = await supabase.storage
    .from("kyc-documents")
    .createSignedUrl(path, 60);
  return error
    ? NextResponse.json({ error: error.message }, { status: 400 })
    : NextResponse.json({ url: data.signedUrl });
}
