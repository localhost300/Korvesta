import { AuthShell } from "@/components/AuthShell";
import { VerificationForm } from "@/components/AuthForms";
import { SecurityPanel } from "@/components/AuthPanels";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email = "" } = await searchParams;
  return (
    <AuthShell>
      <main className="container-shell grid min-h-[calc(100vh-150px)] items-center gap-16 py-12 lg:grid-cols-[1fr_.9fr]">
        <VerificationForm email={email} />
        <SecurityPanel />
      </main>
    </AuthShell>
  );
}
