"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconArrowLeft,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconKey,
  IconMail,
  IconShield,
} from "@tabler/icons-react";
import { Logo } from "@/components/Logo";

export function AdminSignIn() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!email.includes("@") || password.length < 8) {
      setError(
        "Enter a valid administrator email and a password of at least eight characters.",
      );
      return;
    }
    setPending(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "admin", email, password }),
    }).catch(() => null);
    const result = response ? await response.json().catch(() => ({})) : {};
    setPending(false);
    if (!response?.ok) {
      setError(
        result.error ?? "Administrator sign-in is temporarily unavailable.",
      );
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="dashboard-shell admin-auth min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-[.85fr_1.15fr]">
        <section className="relative hidden border-r border-[var(--dash-line)] bg-[#060a0d] p-10 lg:flex lg:flex-col">
          <Logo />
          <div className="my-auto max-w-md">
            <span className="grid size-14 place-items-center rounded-2xl border border-[#ffc40035] bg-[#ffc40012] text-[#ffc400]">
              <IconShield size={28} />
            </span>
            <h1 className="mt-7 text-4xl font-semibold">
              Korvesta Operations Console
            </h1>
            <p className="mt-4 text-sm leading-7 text-[var(--dash-muted)]">
              Secure administration for customer accounts, balances,
              investments, KYC, payments and platform operations.
            </p>
            <div className="mt-8 grid gap-3">
              {[
                "Single administrator",
                "Password-protected access",
                "Audit-ready actions",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-xs">
                  <IconCheck size={16} className="text-[#00d084]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-[var(--dash-muted)]">
            Restricted system · Authorised administrator only
          </p>
        </section>
        <section className="flex items-center justify-center p-5 sm:p-10">
          <form
            onSubmit={submit}
            className="w-full max-w-[560px] rounded-2xl border border-[var(--dash-line)] bg-[var(--dash-card)] p-6 shadow-2xl sm:p-9"
          >
            <div className="mb-10 flex justify-between lg:hidden">
              <Logo />
              <Link
                href="/sign-in"
                className="text-xs text-[var(--dash-muted)]"
              >
                Customer sign in
              </Link>
            </div>
            <span className="grid size-14 place-items-center rounded-2xl border border-[#ffc40035] bg-[#ffc40015] text-[#ffc400]">
              <IconShield size={27} />
            </span>
            <h2 className="mt-6 text-3xl font-semibold">
              Administrator sign in
            </h2>
            <p className="mt-2 text-sm text-[var(--dash-muted)]">
              Sign in with the administrator email and password.
            </p>
            {error ? (
              <p
                role="alert"
                className="mt-5 rounded-lg border border-[#ef444450] bg-[#ef444410] px-4 py-3 text-xs text-[#ef4444]"
              >
                {error}
              </p>
            ) : null}
            <label className="mt-7 block text-xs font-semibold">
              Administrator email
              <span className="relative mt-2 block">
                <IconMail
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[var(--dash-muted)]"
                />
                <input
                  required
                  autoComplete="email"
                  type="email"
                  className="dash-input admin-auth-field h-14 text-sm"
                  placeholder="admin@yourdomain.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </span>
            </label>
            <label className="mt-5 block text-xs font-semibold">
              Password
              <span className="relative mt-2 block">
                <IconKey
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[var(--dash-muted)]"
                />
                <input
                  required
                  autoComplete="current-password"
                  minLength={8}
                  type={show ? "text" : "password"}
                  className="dash-input admin-auth-field admin-auth-password h-14 text-sm"
                  placeholder="Enter administrator password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-[var(--dash-muted)] hover:bg-[var(--dash-line-soft)] hover:text-[var(--dash-text)]"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <IconEyeOff size={17} /> : <IconEye size={17} />}
                </button>
              </span>
            </label>
            <button
              disabled={pending}
              className="gold-button mt-7 h-13 w-full disabled:opacity-60"
            >
              {pending ? "Signing in…" : "Open administrator console"}
            </button>
            <Link
              href="/sign-in"
              className="mt-8 inline-flex items-center gap-2 text-xs text-[var(--dash-muted)]"
            >
              <IconArrowLeft size={15} />
              Return to customer sign in
            </Link>
          </form>
        </section>
      </div>
    </main>
  );
}
