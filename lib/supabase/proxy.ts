import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseConfig } from "./config";

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!hasSupabaseConfig())
    return {
      response,
      user: null,
      role: null,
      accountStatus: null,
      currentLevel: null,
      nextLevel: null,
    };
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  const {
    data: { user },
  } = await client.auth.getUser();
  let role: string | null = null;
  let accountStatus: string | null = null;
  if (user) {
    const { data: profile } = await client
      .from("profiles")
      .select("role,account_status")
      .eq("id", user.id)
      .maybeSingle();
    role = profile?.role ?? null;
    accountStatus = profile?.account_status ?? null;
  }
  const { data: assurance } = user
    ? await client.auth.mfa.getAuthenticatorAssuranceLevel()
    : { data: null };
  return {
    response,
    user,
    role,
    accountStatus,
    currentLevel: assurance?.currentLevel ?? null,
    nextLevel: assurance?.nextLevel ?? null,
  };
}
