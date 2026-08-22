import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseClient();
  if (supabase) await supabase.auth.signOut();
  const response = NextResponse.redirect(new URL("/sign-in", request.url), 303);
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return response;
}
