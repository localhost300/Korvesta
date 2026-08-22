import "server-only";
import { NextResponse } from "next/server";
import { recordSecurityEvent } from "./request";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function requireActiveCustomer(
  request: Request,
  supabase: SupabaseClient,
  userId: string,
  action: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role,account_status")
    .eq("id", userId)
    .single();
  if (error || data?.role !== "customer")
    return NextResponse.json(
      { error: "Customer account required." },
      { status: 403 },
    );
  if (data.account_status !== "active") {
    await recordSecurityEvent(request, "blocked_account_action", userId, {
      action,
      status: data.account_status,
    });
    return NextResponse.json(
      {
        error:
          data.account_status === "suspended"
            ? "Your account is suspended."
            : "Your account is restricted to read-only access.",
      },
      { status: 403 },
    );
  }
  return null;
}
