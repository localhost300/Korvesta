"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export function MfaChallenge() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(e: FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const factors = await supabase.auth.mfa.listFactors();
    const factor = factors.data?.totp.find(
      (item) => item.status === "verified",
    );
    if (!factor) {
      setError("No verified authenticator was found.");
      return;
    }
    const result = await supabase.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code,
    });
    if (result.error) {
      setError("The authenticator code is invalid or expired.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }
  return (
    <main className="container-shell mx-auto max-w-md py-20">
      <h1 className="text-3xl font-semibold">Two-factor verification</h1>
      <p className="mt-2 text-sm text-muted">
        Enter the current code from your authenticator app.
      </p>
      <form onSubmit={submit} className="mt-8 grid gap-4">
        <input
          autoFocus
          required
          className="dash-input text-center text-xl tracking-[.4em]"
          inputMode="numeric"
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
        />
        <button disabled={code.length !== 6} className="gold-button">
          Verify
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>
    </main>
  );
}
