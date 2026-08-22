"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, PageHeading, Status } from "./DashboardUI";
type Factor = {
  id: string;
  friendly_name?: string;
  status: string;
  created_at: string;
};
type Enrollment = { id: string; totp: { qr_code: string; secret: string } };
type SecurityEvent = { id: number; event_type: string; created_at: string };
export function AccountSecurityPage() {
  const [supabase] = useState(createClient);
  const router = useRouter();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const load = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) setMessage(error.message);
    else setFactors(data.totp as Factor[]);
    const response = await fetch("/api/security/events", { cache: "no-store" });
    if (response.ok) setEvents((await response.json()).events);
  }, [supabase]);
  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  async function enroll() {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Korvesta authenticator",
    });
    if (error) setMessage(error.message);
    else setEnrollment(data as Enrollment);
  }
  async function verify() {
    if (!enrollment) return;
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrollment.id,
      code,
    });
    if (error) setMessage(error.message);
    else {
      setEnrollment(null);
      setCode("");
      setMessage("Authenticator enabled.");
      await load();
    }
  }
  async function remove(id: string) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    setMessage(error?.message ?? "Authenticator removed.");
    await load();
  }
  async function signOut(scope: "others" | "global") {
    const { error } = await supabase.auth.signOut({ scope });
    if (error) setMessage(error.message);
    else if (scope === "global") {
      router.push("/sign-in");
      router.refresh();
    } else setMessage("Other sessions have been revoked.");
  }
  return (
    <>
      <PageHeading
        title="Account Security"
        subtitle="Manage authenticator MFA and active sessions."
      />
      {message && (
        <p className="mb-4 rounded-lg border border-[#ffc40055] p-3 text-sm">
          {message}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Authenticator app">
          {factors.length ? (
            factors.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between border-b border-[#253038] py-4"
              >
                <span>
                  <b className="text-sm">
                    {f.friendly_name || "Authenticator"}
                  </b>
                  <small className="block text-[#819099]">
                    Added {new Date(f.created_at).toLocaleDateString()}
                  </small>
                </span>
                <div className="flex items-center gap-2">
                  <Status>{f.status}</Status>
                  <button
                    className="dash-button min-h-8"
                    onClick={() => void remove(f.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-[#819099]">
              No authenticator is enrolled.
            </p>
          )}
          {!enrollment && (
            <button className="gold-button mt-5" onClick={() => void enroll()}>
              Set up authenticator
            </button>
          )}
          {enrollment && (
            <div className="mt-5 rounded-xl border border-[#253038] p-4">
              <p className="text-sm">
                Scan this QR code with Google Authenticator, Microsoft
                Authenticator, Authy, or another TOTP app.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={enrollment.totp.qr_code}
                alt="Authenticator enrollment QR code"
                className="my-4 size-48 bg-white p-2"
              />
              <code className="block break-all text-xs">
                {enrollment.totp.secret}
              </code>
              <input
                className="dash-input mt-4"
                inputMode="numeric"
                placeholder="6-digit code"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
              />
              <button
                className="gold-button mt-3"
                disabled={code.length !== 6}
                onClick={() => void verify()}
              >
                Verify and enable
              </button>
            </div>
          )}
        </Card>
        <Card title="Sessions">
          <p className="text-sm text-[#819099]">
            Supabase securely manages refresh tokens. Access tokens can remain
            valid until their short expiry after revocation.
          </p>
          <button
            className="dash-button mt-5 w-full"
            onClick={() => void signOut("others")}
          >
            Sign out all other devices
          </button>
          <button
            className="dash-button mt-3 w-full text-red-400"
            onClick={() => void signOut("global")}
          >
            Sign out everywhere
          </button>
        </Card>
      </div>
      <div className="mt-4">
        <Card title="Recent security activity">
          {events.length ? (
            events.map((event) => (
              <div
                key={event.id}
                className="flex justify-between border-b border-[#253038] py-3 text-xs"
              >
                <span className="capitalize">
                  {event.event_type.replaceAll("_", " ")}
                </span>
                <time className="text-[#819099]">
                  {new Date(event.created_at).toLocaleString()}
                </time>
              </div>
            ))
          ) : (
            <p className="text-sm text-[#819099]">
              No security events recorded yet.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
