import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
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
  const path = new URL(request.url).searchParams.get("path")?.trim();
  if (!path || path.includes(".."))
    return NextResponse.json({ error: "Invalid proof path." }, { status: 400 });
  const { data, error } = await supabase.storage
    .from("payment-proofs")
    .createSignedUrl(path, 60);
  return error
    ? NextResponse.json({ error: error.message }, { status: 400 })
    : NextResponse.json({ url: data.signedUrl });
}
