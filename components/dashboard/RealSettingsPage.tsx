"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Card, PageHeading, Status } from "./DashboardUI";
type Profile = {
  id: string;
  full_name: string;
  email: string;
  country: string | null;
  role: string;
  account_status: string;
  kyc_status: string;
  created_at: string;
  mfaEnabled: boolean;
};
export function RealSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = () =>
    fetch("/api/profile", { cache: "no-store" })
      .then((r) =>
        r.json().then((b) => {
          if (!r.ok) throw new Error(b.error);
          setProfile(b.profile);
        }),
      )
      .catch((e) => setError(e.message));
  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.get("fullName"),
        country: form.get("country"),
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error);
      return;
    }
    setMessage("Profile updated.");
    await load();
  }
  return (
    <>
      <PageHeading
        title="Account Settings"
        subtitle="Manage your real account profile and security status."
      />
      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 p-3 text-sm text-red-400">
          {error}
        </p>
      )}
      {message && (
        <p className="mb-4 rounded-lg border border-[#00d08455] p-3 text-sm text-[#00d084]">
          {message}
        </p>
      )}
      {profile ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <Card title="Profile">
            <form onSubmit={save} className="grid gap-4">
              <label className="text-xs">
                Full name
                <input
                  required
                  name="fullName"
                  className="dash-input mt-2"
                  defaultValue={profile.full_name}
                />
              </label>
              <label className="text-xs">
                Email
                <input
                  disabled
                  className="dash-input mt-2 opacity-70"
                  value={profile.email}
                />
              </label>
              <label className="text-xs">
                Country
                <input
                  required
                  name="country"
                  className="dash-input mt-2"
                  defaultValue={profile.country ?? ""}
                />
              </label>
              <label className="text-xs">
                Account ID
                <input
                  disabled
                  className="dash-input mt-2 font-mono opacity-70"
                  value={profile.id}
                />
              </label>
              <button className="gold-button">Save profile</button>
            </form>
          </Card>
          <div className="space-y-4">
            <Card title="Account status">
              {[
                ["Access", profile.account_status],
                ["Identity", profile.kyc_status],
                [
                  "Authenticator",
                  profile.mfaEnabled ? "enabled" : "not enabled",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between border-b border-[#253038] py-4 text-xs"
                >
                  <span>{label}</span>
                  <Status
                    tone={
                      value === "active" ||
                      value === "verified" ||
                      value === "enabled"
                        ? "green"
                        : "yellow"
                    }
                  >
                    {value}
                  </Status>
                </div>
              ))}
              <p className="mt-4 text-xs text-[#819099]">
                Member since {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </Card>
            <Card title="Security actions">
              <Link href="/dashboard/security" className="dash-button w-full">
                Manage MFA and sessions
              </Link>
              <Link href="/dashboard/kyc" className="dash-button mt-3 w-full">
                Manage identity verification
              </Link>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <p className="text-sm text-[#819099]">Loading profile…</p>
        </Card>
      )}
    </>
  );
}
