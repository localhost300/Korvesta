import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "@/components/AuthForms";
import { BenefitsPanel } from "@/components/AuthPanels";

export default function RegisterPage() {
  return (
    <AuthShell>
      <main className="container-shell grid min-h-[calc(100vh-150px)] min-w-0 items-center gap-16 py-8 sm:py-12 lg:grid-cols-[1fr_.8fr]">
        <RegisterForm />
        <div className="hidden min-w-0 lg:block"><BenefitsPanel /></div>
      </main>
    </AuthShell>
  );
}
