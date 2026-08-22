import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import { AuthShell } from "@/components/AuthShell";
import { SuccessMark, SuccessPreview } from "@/components/AuthPanels";

export default function SuccessPage() {
  return <AuthShell light><main className="container-shell grid min-h-[calc(100vh-150px)] items-center gap-14 py-12 lg:grid-cols-[.62fr_1fr]"><section><SuccessMark /><h1 className="mt-8 max-w-md text-5xl font-semibold tracking-[-.05em]">Account created successfully!</h1><p className="mt-5 max-w-md leading-7 text-muted">Welcome to Korvesta. Your account is ready to explore real-time markets and insights.</p><div className="mt-8 grid max-w-sm gap-3"><Link href="/markets" className="gold-button justify-between">Go to Dashboard <IconArrowRight size={18} /></Link><Link href="/markets" className="ghost-button justify-between">Explore Markets <IconArrowRight size={18} /></Link></div></section><SuccessPreview /></main></AuthShell>;
}
