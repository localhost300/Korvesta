export type SessionRole = "customer" | "admin";

export type SessionPayload = {
  role: SessionRole;
  email: string;
  expiresAt: number;
};

export const SESSION_COOKIE = "korvesta_session";
const encoder = new TextEncoder();

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function decodeBase64Url(value: string) {
  const normalised = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(
    normalised.padEnd(Math.ceil(normalised.length / 4) * 4, "="),
  );
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function signingKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export function authIsConfigured(role: SessionRole) {
  const prefix = role === "admin" ? "KORVESTA_ADMIN" : "KORVESTA_CUSTOMER";
  return Boolean(
    process.env.KORVESTA_SESSION_SECRET &&
    process.env[`${prefix}_EMAIL`] &&
    process.env[`${prefix}_PASSWORD`],
  );
}

export async function createSessionToken(role: SessionRole, email: string) {
  const secret = process.env.KORVESTA_SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error(
      "KORVESTA_SESSION_SECRET must contain at least 32 characters.",
    );
  const payload: SessionPayload = {
    role,
    email,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  };
  const encodedPayload = base64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await signingKey(secret),
    encoder.encode(encodedPayload),
  );
  return `${encodedPayload}.${base64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(
  token?: string,
): Promise<SessionPayload | null> {
  const secret = process.env.KORVESTA_SESSION_SECRET;
  if (!secret || !token) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await signingKey(secret),
      decodeBase64Url(signature),
      encoder.encode(payload),
    );
    if (!valid) return null;
    const parsed = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(payload)),
    ) as SessionPayload;
    if (
      !parsed.email ||
      !["customer", "admin"].includes(parsed.role) ||
      parsed.expiresAt <= Date.now()
    )
      return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function credentialsMatch(
  actualEmail: string,
  actualPassword: string,
  role: SessionRole,
) {
  const prefix = role === "admin" ? "KORVESTA_ADMIN" : "KORVESTA_CUSTOMER";
  const expectedEmail = process.env[`${prefix}_EMAIL`];
  const expectedPassword = process.env[`${prefix}_PASSWORD`];
  if (!expectedEmail || !expectedPassword) return false;
  const input = encoder.encode(
    `${actualEmail.trim().toLowerCase()}\0${actualPassword}`,
  );
  const expected = encoder.encode(
    `${expectedEmail.trim().toLowerCase()}\0${expectedPassword}`,
  );
  const [left, right] = await Promise.all([
    crypto.subtle.digest("SHA-256", input),
    crypto.subtle.digest("SHA-256", expected),
  ]);
  const leftBytes = new Uint8Array(left);
  const rightBytes = new Uint8Array(right);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1)
    difference |= leftBytes[index] ^ rightBytes[index];
  return difference === 0;
}
