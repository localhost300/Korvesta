import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "@/components/AuthForms";
import { BenefitsPanel } from "@/components/AuthPanels";

export default function RegisterPage() {
  return (
    <AuthShell>
      <main className="container-shell grid min-h-[calc(100vh-150px)] items-center gap-16 py-12 lg:grid-cols-[1fr_.8fr]">
        <RegisterForm />
        <BenefitsPanel />
      </main>
    </AuthShell>
  );
}
