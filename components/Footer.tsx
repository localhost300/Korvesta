import Link from "next/link";
import { Logo } from "./Logo";

const groups = [
  { title: "Markets", links: [["Overview", "/markets"], ["Market tools", "/trade-tools"], ["Insights", "/insights"]] },
  { title: "Education", links: [["Learn", "/learn"], ["Analysis", "/insights"], ["Help centre", "/support"]] },
  { title: "Company", links: [["About us", "/company"], ["Contact", "/support"], ["Security help", "/support"]] },
  { title: "Legal", links: [["Terms", "/legal/terms"], ["Privacy", "/legal/privacy"], ["Cookies", "/legal/cookies"]] },
] as const;

export function Footer() {
  return <footer className="mt-12 border-t sm:mt-16" style={{ borderColor: "var(--border-soft)" }}><div className="container-shell grid gap-9 py-10 md:grid-cols-[1.25fr_4fr] md:py-12"><div><Logo/><p className="mt-4 max-w-[240px] text-sm leading-6 text-muted">Market data, education and tools for informed decision-making.</p></div><div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4 sm:gap-8">{groups.map((group) => <div key={group.title}><h3 className="mb-3 text-sm font-semibold">{group.title}</h3><div className="grid gap-2.5 text-xs text-muted">{group.links.map(([label, href]) => <Link key={label} href={href} className="hover:text-[var(--amber)]">{label}</Link>)}</div></div>)}</div></div><div className="container-shell flex flex-col gap-3 border-t py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border-soft)" }}><span>© 2026 Korvesta. All rights reserved.</span><div className="flex flex-wrap gap-x-5 gap-y-2 sm:gap-6"><Link href="/legal/privacy">Privacy Policy</Link><Link href="/legal/terms">Terms of Use</Link><Link href="/legal/cookies">Cookie Policy</Link></div></div></footer>;
}
