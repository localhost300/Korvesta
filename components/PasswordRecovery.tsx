"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const b = await r.json();
    setMessage(b.message ?? b.error);
  }
  return (
    <main className="container-shell mx-auto max-w-lg py-20">
      <h1 className="text-3xl font-semibold">Reset your password</h1>
      <p className="mt-2 text-sm text-muted">
        We will email a secure recovery link.
      </p>
      <form onSubmit={submit} className="mt-8 grid gap-4">
        <input
          required
          type="email"
          className="dash-input"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="gold-button">Send reset link</button>
        {message && <p className="text-sm">{message}</p>}
        <Link href="/sign-in" className="text-sm text-[#ffc400]">
          Back to sign in
        </Link>
      </form>
    </main>
  );
}
export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }
    const r = await fetch("/api/auth/update-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const b = await r.json();
    setMessage(r.ok ? "Password updated. You can now sign in." : b.error);
  }
  return (
    <main className="container-shell mx-auto max-w-lg py-20">
      <h1 className="text-3xl font-semibold">Choose a new password</h1>
      <form onSubmit={submit} className="mt-8 grid gap-4">
        <input
          required
          type="password"
          minLength={12}
          className="dash-input"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          required
          type="password"
          minLength={12}
          className="dash-input"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <button className="gold-button">Update password</button>
        {message && <p className="text-sm">{message}</p>}
      </form>
    </main>
  );
}
