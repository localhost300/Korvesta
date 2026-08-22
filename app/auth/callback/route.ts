import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const next = requestedNext === "/reset-password" ? requestedNext : "/dashboard";
  if (!code)
    return NextResponse.redirect(new URL("/sign-in?error=invalid-link", url));
  const supabase = await createClient();
  if (!supabase)
    return NextResponse.redirect(
      new URL("/sign-in?error=not-configured", url),
    );
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error)
    return NextResponse.redirect(new URL("/sign-in?error=expired-link", url));
  const response = NextResponse.redirect(new URL(next, url));
  if (next === "/reset-password") {
    response.cookies.set("korvesta_password_recovery", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 10 * 60,
      path: "/",
      priority: "high",
    });
  }
  return response;
}
