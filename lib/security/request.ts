import "server-only";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const developmentCounters = new Map<
  string,
  { count: number; expires: number }
>();

function clientAddress(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
async function digest(value: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Buffer.from(bytes).toString("hex");
}

export function rejectCrossSiteMutation(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site")
    return NextResponse.json(
      { error: "Cross-site request rejected." },
      { status: 403 },
    );
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const forwardedHost =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ||
    (process.env.NODE_ENV === "production" ? "https" : "http");
  if (!forwardedHost || origin !== `${forwardedProto}://${forwardedHost}`)
    return NextResponse.json(
      { error: "Request origin is not allowed." },
      { status: 403 },
    );
  return null;
}

export async function enforceRateLimit(
  request: Request,
  scope: string,
  maximumRequests: number,
  windowSeconds: number,
  identity?: string,
) {
  const keyHash = await digest(
    `${scope}:${identity ?? clientAddress(request)}`,
  );
  const admin = createAdminClient();
  if (admin) {
    const { data, error } = await admin.rpc("consume_rate_limit", {
      requested_scope: scope,
      requested_key_hash: keyHash,
      maximum_requests: maximumRequests,
      window_seconds: windowSeconds,
    });
    if (error)
      return NextResponse.json(
        { error: "Security rate limiter is unavailable." },
        { status: 503 },
      );
    if (!data)
      return NextResponse.json(
        { error: "Too many requests. Please wait and try again." },
        { status: 429, headers: { "Retry-After": String(windowSeconds) } },
      );
    return null;
  }
  if (process.env.NODE_ENV === "production")
    return NextResponse.json(
      { error: "Security rate limiter is not configured." },
      { status: 503 },
    );
  const now = Date.now();
  const current = developmentCounters.get(keyHash);
  const next =
    !current || current.expires <= now
      ? { count: 1, expires: now + windowSeconds * 1000 }
      : { count: current.count + 1, expires: current.expires };
  developmentCounters.set(keyHash, next);
  return next.count > maximumRequests
    ? NextResponse.json(
        { error: "Too many requests. Please wait and try again." },
        { status: 429 },
      )
    : null;
}

export async function recordSecurityEvent(
  request: Request,
  eventType: string,
  userId?: string | null,
  metadata: Record<string, unknown> = {},
) {
  const admin = createAdminClient();
  if (!admin) return;
  await admin
    .from("security_events")
    .insert({
      user_id: userId ?? null,
      event_type: eventType,
      ip_hash: await digest(clientAddress(request)),
      metadata,
    });
}
