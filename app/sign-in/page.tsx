import { AuthShell } from "@/components/AuthShell";
import { SignInForm } from "@/components/AuthForms";
import { SignInMarketPanel } from "@/components/AuthPanels";

export default function SignInPage() {
  return <AuthShell><main className="container-shell grid min-h-[calc(100vh-150px)] items-center gap-14 py-12 lg:grid-cols-[1fr_.95fr]"><SignInForm /><SignInMarketPanel /></main></AuthShell>;
}
