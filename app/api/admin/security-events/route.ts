import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
  const { data, error } = await supabase
    .from("security_events")
    .select("id,user_id,event_type,ip_hash,metadata,created_at")
    .order("created_at", { ascending: false })
    .limit(250);
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json({ events: data ?? [] });
}
