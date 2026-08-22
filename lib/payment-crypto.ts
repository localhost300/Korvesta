import "server-only";

const PREFIX = "enc:v1:";

async function key() {
  const secret = process.env.PAYMENT_DATA_ENCRYPTION_KEY;
  if (!secret || secret.length < 32)
    throw new Error(
      "PAYMENT_DATA_ENCRYPTION_KEY must contain at least 32 characters.",
    );
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret),
  );
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptPaymentData(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await key(),
    new TextEncoder().encode(value),
  );
  return `${PREFIX}${Buffer.from(iv).toString("base64url")}.${Buffer.from(encrypted).toString("base64url")}`;
}

export async function decryptPaymentData(value: string | null | undefined) {
  if (!value) return null;
  if (!value.startsWith(PREFIX)) return value;
  const [ivValue, encryptedValue] = value.slice(PREFIX.length).split(".");
  if (!ivValue || !encryptedValue)
    throw new Error("Encrypted payment data is malformed.");
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: Buffer.from(ivValue, "base64url") },
    await key(),
    Buffer.from(encryptedValue, "base64url"),
  );
  return new TextDecoder().decode(decrypted);
}
