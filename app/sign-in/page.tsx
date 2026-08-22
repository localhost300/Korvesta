import { AuthShell } from "@/components/AuthShell";
import { SignInForm } from "@/components/AuthForms";
import { SignInMarketPanel } from "@/components/AuthPanels";

export default function SignInPage() {
  return <AuthShell><main className="container-shell grid min-h-[calc(100vh-150px)] min-w-0 items-center gap-14 py-8 sm:py-12 lg:grid-cols-[1fr_.95fr]"><SignInForm /><div className="hidden min-w-0 lg:block"><SignInMarketPanel /></div></main></AuthShell>;
}
