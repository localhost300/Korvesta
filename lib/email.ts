import "server-only";

type TransactionalEmail = {
  to: string;
  subject: string;
  heading: string;
  message: string;
  details?: Array<[string, string]>;
  actionLabel?: string;
  actionPath?: string;
  idempotencyKey: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export async function sendTransactionalEmail(email: TransactionalEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return { sent: false, reason: "not_configured" } as const;

  const rows = (email.details ?? [])
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;color:#7b8790">${escapeHtml(label)}</td><td style="padding:8px 12px;text-align:right;font-weight:600">${escapeHtml(value)}</td></tr>`,
    )
    .join("");
  const actionUrl = email.actionPath
    ? `${siteUrl()}${email.actionPath.startsWith("/") ? email.actionPath : `/${email.actionPath}`}`
    : null;
  const html = `<!doctype html><html><body style="margin:0;background:#080d10;color:#eef2f4;font-family:Arial,sans-serif"><div style="max-width:600px;margin:auto;padding:32px 20px"><div style="color:#ffc400;font-size:21px;font-weight:800;margin-bottom:28px">KORVESTA</div><div style="background:#10171b;border:1px solid #263139;border-radius:14px;padding:28px"><h1 style="font-size:22px;margin:0 0 14px">${escapeHtml(email.heading)}</h1><p style="color:#a7b0b6;line-height:1.65;margin:0 0 20px">${escapeHtml(email.message)}</p>${rows ? `<table style="width:100%;border-collapse:collapse;background:#0b1114;border-radius:10px;margin:20px 0">${rows}</table>` : ""}${actionUrl ? `<a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#ffc400;color:#141000;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px">${escapeHtml(email.actionLabel ?? "Open Korvesta")}</a>` : ""}</div><p style="color:#68747b;font-size:12px;line-height:1.5;margin-top:18px">This is an automated account notification. Never share your password or one-time verification code.</p></div></body></html>`;
  const text = [
    email.heading,
    email.message,
    ...(email.details ?? []).map(([label, value]) => `${label}: ${value}`),
    ...(actionUrl ? [`${email.actionLabel ?? "Open Korvesta"}: ${actionUrl}`] : []),
  ].join("\n\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": email.idempotencyKey.slice(0, 256),
        "User-Agent": "Korvesta/1.0",
      },
      body: JSON.stringify({
        from,
        to: [email.to],
        subject: email.subject,
        html,
        text,
        reply_to: process.env.EMAIL_REPLY_TO || undefined,
      }),
    });
    if (!response.ok) {
      console.error("Transactional email delivery failed", response.status);
      return { sent: false, reason: "provider_error" } as const;
    }
    return { sent: true } as const;
  } catch {
    console.error("Transactional email delivery failed due to a network error");
    return { sent: false, reason: "network_error" } as const;
  }
}
