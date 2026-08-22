import { AuthShell } from "@/components/AuthShell";
import { VerificationForm } from "@/components/AuthForms";
import { SecurityPanel } from "@/components/AuthPanels";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function VerifyPage() {
  const email = (await cookies()).get("korvesta_pending_verification")?.value;
  if (!email?.includes("@")) redirect("/register");
  return (
    <AuthShell>
      <main className="container-shell grid min-h-[calc(100vh-150px)] items-center gap-16 py-12 lg:grid-cols-[1fr_.9fr]">
        <VerificationForm email={email} />
        <SecurityPanel />
      </main>
    </AuthShell>
  );
}
