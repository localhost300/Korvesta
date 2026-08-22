import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, type SessionRole } from "./auth";
import { createClient } from "./supabase/server";

export async function getCurrentRole(): Promise<SessionRole | null> {
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    return ["admin", "finance", "compliance", "support"].includes(data?.role ?? "customer") ? "admin" : "customer";
  }
  return (await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value))?.role ?? null;
}
