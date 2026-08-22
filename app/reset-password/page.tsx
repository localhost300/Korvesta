import { AuthShell } from "@/components/AuthShell";
import { ResetPasswordForm } from "@/components/PasswordRecovery";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const recoveryStarted = (await cookies()).has("korvesta_password_recovery");
  if (!user || !recoveryStarted) redirect("/forgot-password");
  return (
    <AuthShell>
      <ResetPasswordForm />
    </AuthShell>
  );
}
