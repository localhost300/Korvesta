import "server-only";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "./admin";

export async function ensureCustomerProfile(user: User) {
  const admin = createAdminClient();
  if (!admin) return false;
  const { data: existing, error: lookupError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (lookupError || existing) return Boolean(existing);

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";
  const country =
    typeof user.user_metadata?.country === "string"
      ? user.user_metadata.country.trim()
      : null;
  const { error } = await admin.from("profiles").insert({
    id: user.id,
    full_name: fullName,
    country,
  });
  return !error || error.code === "23505";
}
