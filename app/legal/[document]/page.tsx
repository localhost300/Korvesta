import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";

const documents = {
  terms: { title: "Terms of Use", sections: [["Platform status", "Korvesta is currently a pre-launch market-information product. Trading, custody, deposits, withdrawals and investment actions shown in the interface are demonstrations and do not execute real transactions."], ["No financial advice", "Content is provided for general information and education. It is not investment, legal or tax advice, and no return is guaranteed."], ["Acceptable use", "You must not attempt unauthorised access, interfere with the service, misrepresent your identity or use the platform for unlawful activity."], ["Service availability", "Features may change or be withdrawn during development. Production financial services will require separate agreements and eligibility checks."]]},
  privacy: { title: "Privacy Policy", sections: [["Data we collect", "The pre-launch site may receive information you submit through forms, basic device information and security logs required to operate and protect the service."], ["How data is used", "Data is used to provide support, secure accounts, improve the product and meet legal obligations. Korvesta does not sell personal information."], ["Retention and security", "Information is retained only as necessary for its stated purpose and protected using appropriate technical and organisational controls."], ["Your choices", "You may request access, correction or deletion of eligible personal information by contacting support@korvesta.com."]]},
  cookies: { title: "Cookie Policy", sections: [["Essential storage", "Korvesta uses essential cookies for secure sessions and local browser storage to remember colour-theme preferences."], ["Analytics", "Non-essential analytics and advertising cookies are not enabled in this build. Consent will be requested before any such technology is introduced."], ["Controls", "You can clear cookies and local storage in your browser. Removing essential session cookies signs you out."]]},
} as const;

export async function generateMetadata({ params }: { params: Promise<{ document: string }> }): Promise<Metadata> {
  const item = documents[(await params).document as keyof typeof documents];
  return item ? { title: item.title, robots: { index: true, follow: true } } : {};
}

export default async function LegalPage({ params }: { params: Promise<{ document: string }> }) {
  const item = documents[(await params).document as keyof typeof documents];
  if (!item) notFound();
  return <PageShell><main className="container-shell py-16"><article className="surface mx-auto max-w-4xl p-7 sm:p-10"><p className="kicker">Legal</p><h1 className="mt-3 text-4xl font-semibold">{item.title}</h1><p className="mt-3 text-xs text-muted">Last updated 20 August 2026 · Pre-launch notice</p><div className="mt-10 grid gap-8">{item.sections.map(([title, copy]) => <section key={title}><h2 className="text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-7 text-muted">{copy}</p></section>)}</div><p className="mt-10 border-t pt-6 text-xs leading-6 text-muted" style={{ borderColor: "var(--border)" }}>These interim terms must be reviewed by qualified counsel for every jurisdiction in which Korvesta intends to operate before a production launch.</p></article></main></PageShell>;
}
