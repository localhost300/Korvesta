import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptPaymentData, encryptPaymentData } from "@/lib/payment-crypto";

async function staffClient() {
  const supabase = await createClient();
  if (!supabase)
    return { error: "Supabase is not configured.", status: 503 } as const;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required.", status: 401 } as const;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return { error: "Administrator access required.", status: 403 } as const;
  return { supabase } as const;
}

export async function GET() {
  const auth = await staffClient();
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await auth.supabase
    .from("networks")
    .select(
      "id,name,chain_id,confirmation_target,deposit_address_encrypted,qr_code_path,enabled,assets(id,symbol,name,decimals,logo_color)",
    )
    .not("deposit_address_encrypted", "is", null)
    .order("name");
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  try {
    const methods = await Promise.all(
      (data ?? []).map(async (method) => ({
        ...method,
        deposit_address: await decryptPaymentData(
          method.deposit_address_encrypted,
        ),
        deposit_address_encrypted: undefined,
      })),
    );
    return NextResponse.json({ data: methods });
  } catch (cause) {
    return NextResponse.json(
      {
        error:
          cause instanceof Error
            ? cause.message
            : "Payment data could not be decrypted.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await staffClient();
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await request.formData().catch(() => null);
  const symbol = String(body?.get("symbol") ?? "")
    .trim()
    .toUpperCase();
  const assetName = String(body?.get("assetName") ?? "").trim();
  const networkName = String(body?.get("networkName") ?? "").trim();
  const address = String(body?.get("depositAddress") ?? "").trim();
  const confirmations = Number(body?.get("confirmationTarget") ?? 1);
  const qrCode = body?.get("qrCode");
  if (
    !/^[A-Z0-9]{2,12}$/.test(symbol) ||
    !assetName ||
    !networkName ||
    !address ||
    !Number.isInteger(confirmations) ||
    confirmations < 1
  )
    return NextResponse.json(
      { error: "Complete the asset, network, address and confirmations." },
      { status: 400 },
    );
  const { data: asset, error: assetError } = await auth.supabase
    .from("assets")
    .upsert(
      {
        symbol,
        name: assetName,
        decimals: Number(body?.get("decimals") ?? 8),
        logo_color: String(body?.get("logoColor") ?? "#64748b"),
        enabled: true,
      },
      { onConflict: "symbol" },
    )
    .select("id")
    .single();
  if (assetError || !asset)
    return NextResponse.json(
      { error: assetError?.message ?? "Asset could not be saved." },
      { status: 400 },
    );
  let encryptedAddress: string;
  try {
    encryptedAddress = await encryptPaymentData(address);
  } catch (cause) {
    return NextResponse.json(
      {
        error:
          cause instanceof Error ? cause.message : "Address encryption failed.",
      },
      { status: 500 },
    );
  }
  const { data, error } = await auth.supabase
    .from("networks")
    .upsert(
      {
        asset_id: asset.id,
        name: networkName,
        chain_id: String(body?.get("chainId") ?? "").trim() || null,
        confirmation_target: confirmations,
        deposit_address: null,
        deposit_address_encrypted: encryptedAddress,
        enabled: true,
      },
      { onConflict: "asset_id,name" },
    )
    .select("id,qr_code_path")
    .single();
  if (error || !data)
    return NextResponse.json(
      { error: error?.message ?? "Method could not be saved." },
      { status: 400 },
    );

  if (qrCode instanceof File && qrCode.size > 0) {
    if (
      qrCode.size > 2 * 1024 * 1024 ||
      !["image/png", "image/jpeg", "image/webp"].includes(qrCode.type)
    )
      return NextResponse.json(
        { error: "QR code must be a PNG, JPG or WebP image under 2 MB." },
        { status: 400 },
      );
    const extension =
      qrCode.type === "image/png"
        ? "png"
        : qrCode.type === "image/webp"
          ? "webp"
          : "jpg";
    const path = `${asset.id}/${data.id}-${Date.now()}.${extension}`;
    const upload = await auth.supabase.storage
      .from("deposit-qr-codes")
      .upload(path, qrCode, { contentType: qrCode.type, upsert: false });
    if (upload.error)
      return NextResponse.json(
        { error: upload.error.message },
        { status: 400 },
      );
    const update = await auth.supabase
      .from("networks")
      .update({ qr_code_path: path })
      .eq("id", data.id);
    if (update.error) {
      await auth.supabase.storage.from("deposit-qr-codes").remove([path]);
      return NextResponse.json(
        { error: update.error.message },
        { status: 400 },
      );
    }
  }
  return NextResponse.json({ data }, { status: 201 });
}
