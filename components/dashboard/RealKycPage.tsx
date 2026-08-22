"use client";
import { FormEvent, useEffect, useState } from "react";
import { Card, PageHeading, Status } from "./DashboardUI";
type Submission = {
  id: string;
  status: string;
  review_note: string | null;
  created_at: string;
};
export function RealKycPage() {
  const [status, setStatus] = useState("loading");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const load = () =>
    fetch("/api/kyc", { cache: "no-store" })
      .then((r) =>
        r.json().then((b) => {
          if (!r.ok) throw new Error(b.error);
          setStatus(b.status);
          setSubmissions(b.submissions);
        }),
      )
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/kyc", {
      method: "POST",
      body: new FormData(event.currentTarget),
    });
    const body = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(body.error);
      return;
    }
    await load();
  }
  return (
    <>
      <PageHeading
        title="Identity Verification"
        subtitle="Submit your identity documents for private compliance review."
      />
      <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
        <Card title="KYC application">
          {error && (
            <p className="mb-4 rounded-lg border border-red-500/30 p-3 text-xs text-red-300">
              {error}
            </p>
          )}
          {status === "verified" ? (
            <p className="rounded-xl border border-[#00d08455] bg-[#00d08410] p-5 text-sm text-[#00d084]">
              Your identity is verified.
            </p>
          ) : status === "pending" ? (
            <p className="rounded-xl border border-[#ffc40055] bg-[#ffc40010] p-5 text-sm text-[#ffc400]">
              Your application is awaiting review.
            </p>
          ) : (
            <form onSubmit={submit} className="grid gap-4">
              <label className="text-xs">
                Legal name
                <input required name="legalName" className="dash-input mt-2" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs">
                  Date of birth
                  <input
                    required
                    type="date"
                    name="dateOfBirth"
                    className="dash-input mt-2"
                  />
                </label>
                <label className="text-xs">
                  Country
                  <input required name="country" className="dash-input mt-2" />
                </label>
              </div>
              <label className="text-xs">
                Residential address
                <textarea
                  required
                  name="address"
                  className="dash-input mt-2 min-h-20 py-3"
                />
              </label>
              <label className="text-xs">
                Document type
                <select name="documentType" className="dash-input mt-2">
                  <option value="passport">Passport</option>
                  <option value="national_id">National ID</option>
                  <option value="drivers_license">Driver&apos;s licence</option>
                </select>
              </label>
              {[
                ["documentFront", "Document front"],
                ["documentBack", "Document back (optional)"],
                ["selfie", "Selfie holding the document"],
              ].map(([name, label]) => (
                <label key={name} className="text-xs">
                  {label}
                  <input
                    required={name !== "documentBack"}
                    name={name}
                    type="file"
                    accept="image/png,image/jpeg,application/pdf"
                    className="dash-input mt-2 py-2"
                  />
                </label>
              ))}
              <button
                disabled={pending}
                className="gold-button disabled:opacity-50"
              >
                {pending ? "Submitting…" : "Submit for verification"}
              </button>
            </form>
          )}
        </Card>
        <Card title="Application history">
          {submissions.length ? (
            submissions.map((item) => (
              <div
                key={item.id}
                className="border-b border-[#253038] py-4 text-xs"
              >
                <div className="flex justify-between">
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                  <Status
                    tone={
                      item.status === "approved"
                        ? "green"
                        : item.status === "rejected"
                          ? "red"
                          : "yellow"
                    }
                  >
                    {item.status}
                  </Status>
                </div>
                {item.review_note && (
                  <p className="mt-2 text-[#819099]">{item.review_note}</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-[#819099]">No application submitted.</p>
          )}
        </Card>
      </div>
    </>
  );
}
