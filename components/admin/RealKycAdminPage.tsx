"use client";
import { useEffect, useState } from "react";
import { AdminCard, AdminHeading, AdminStatus, AdminTable } from "./AdminUI";
type Item = {
  id: string;
  legal_name: string;
  country: string;
  document_type: string;
  document_front_path: string;
  document_back_path: string | null;
  selfie_path: string;
  status: string;
  created_at: string;
};
export function RealKycAdminPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const load = () =>
    fetch("/api/admin/kyc", { cache: "no-store" })
      .then((r) =>
        r.json().then((b) => {
          if (!r.ok) throw new Error(b.error);
          setItems(b.data);
        }),
      )
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  async function decide(id: string, decision: string) {
    const response = await fetch(`/api/admin/kyc/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error);
      return;
    }
    setNote("");
    await load();
  }
  async function open(id: string, path: string) {
    const response = await fetch(
      `/api/admin/kyc/${id}?path=${encodeURIComponent(path)}`,
    );
    const body = await response.json();
    if (response.ok) window.open(body.url, "_blank", "noopener,noreferrer");
    else setError(body.error);
  }
  return (
    <>
      <AdminHeading
        title="KYC & Compliance"
        subtitle="Review real customer identity submissions and private documents."
      />
      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 p-3 text-xs text-red-300">
          {error}
        </p>
      )}
      <AdminCard title="Verification queue">
        <AdminTable
          headers={[
            "Applicant",
            "Country",
            "Document",
            "Submitted",
            "Status",
            "Review",
          ]}
          rows={items.map((item) => [
            <b key="name">{item.legal_name}</b>,
            item.country,
            item.document_type.replaceAll("_", " "),
            new Date(item.created_at).toLocaleString(),
            <AdminStatus
              key="status"
              tone={
                item.status === "approved"
                  ? "green"
                  : item.status === "rejected"
                    ? "red"
                    : "yellow"
              }
            >
              {item.status}
            </AdminStatus>,
            item.status === "pending" ? (
              <div key="actions" className="min-w-64">
                <div className="mb-2 flex flex-wrap gap-2">
                  <button
                    className="dash-button min-h-8"
                    onClick={() => void open(item.id, item.document_front_path)}
                  >
                    Front
                  </button>
                  {item.document_back_path && (
                    <button
                      className="dash-button min-h-8"
                      onClick={() =>
                        void open(item.id, item.document_back_path!)
                      }
                    >
                      Back
                    </button>
                  )}
                  <button
                    className="dash-button min-h-8"
                    onClick={() => void open(item.id, item.selfie_path)}
                  >
                    Selfie
                  </button>
                </div>
                <input
                  className="dash-input mb-2"
                  placeholder="Decision note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    className="gold-button min-h-8"
                    onClick={() => void decide(item.id, "approved")}
                  >
                    Approve
                  </button>
                  <button
                    className="dash-button min-h-8 text-red-400"
                    onClick={() => void decide(item.id, "rejected")}
                  >
                    Reject
                  </button>
                  <button
                    className="dash-button min-h-8"
                    onClick={() => void decide(item.id, "resubmission")}
                  >
                    Resubmit
                  </button>
                </div>
              </div>
            ) : (
              <span key="done">Reviewed</span>
            ),
          ])}
        />
      </AdminCard>
    </>
  );
}
