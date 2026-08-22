"use client";
import { useEffect, useState } from "react";
import {
  AdminCard,
  AdminHeading,
  AdminMetric,
  AdminStatus,
  AdminTable,
} from "./AdminUI";
import {
  IconAlertTriangle,
  IconLock,
  IconShieldCheck,
} from "@tabler/icons-react";
type Event = {
  id: number;
  user_id: string | null;
  event_type: string;
  ip_hash: string | null;
  created_at: string;
};
export function SecurityMonitoringPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/security-events", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((r) =>
        r.json().then((b) => {
          if (!r.ok) throw new Error(b.error);
          setEvents(b.events);
        }),
      )
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, []);
  const failures = events.filter((e) => e.event_type === "login_failed");
  return (
    <>
      <AdminHeading
        title="Security Monitoring"
        subtitle="Review real authentication, account, KYC, and withdrawal security events."
      />
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <AdminMetric
          label="Recent events"
          value={String(events.length)}
          icon={IconShieldCheck}
        />
        <AdminMetric
          label="Failed logins"
          value={String(failures.length)}
          icon={IconAlertTriangle}
          colour="#ef4444"
        />
        <AdminMetric
          label="Account changes"
          value={String(
            events.filter(
              (e) =>
                e.event_type.includes("password") ||
                e.event_type.includes("mfa"),
            ).length,
          )}
          icon={IconLock}
          colour="#8b5cf6"
        />
      </div>
      <AdminCard className="mt-4" title="Security event stream">
        <AdminTable
          headers={["Event", "User", "IP fingerprint", "Time", "Severity"]}
          rows={events.map((event) => [
            <b key="event" className="capitalize">
              {event.event_type.replaceAll("_", " ")}
            </b>,
            event.user_id ?? "Anonymous",
            event.ip_hash ? `${event.ip_hash.slice(0, 12)}…` : "—",
            new Date(event.created_at).toLocaleString(),
            <AdminStatus
              key="severity"
              tone={event.event_type.includes("failed") ? "red" : "green"}
            >
              {event.event_type.includes("failed") ? "Review" : "Normal"}
            </AdminStatus>,
          ])}
        />
      </AdminCard>
    </>
  );
}
