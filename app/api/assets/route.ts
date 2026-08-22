import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptPaymentData } from "@/lib/payment-crypto";

export async function GET() {
  const supabase = await createClient();
  if (!supabase)
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const { data, error } = await supabase
    .from("assets")
    .select(
      "id,symbol,name,decimals,logo_color,networks(id,name,confirmation_target,deposit_address_encrypted,qr_code_path)",
    )
    .eq("enabled", true)
    .eq("networks.enabled", true)
    .order("symbol");
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  try {
    const assets = await Promise.all(
      (data ?? []).map(async (asset) => ({
        ...asset,
        networks: await Promise.all(
          (asset.networks ?? []).map(async (network) => {
            const signedQr = network.qr_code_path
              ? await supabase.storage
                  .from("deposit-qr-codes")
                  .createSignedUrl(network.qr_code_path, 3600)
              : null;
            return {
              id: network.id,
              name: network.name,
              confirmation_target: network.confirmation_target,
              deposit_address: await decryptPaymentData(
                network.deposit_address_encrypted,
              ),
              qr_code_url: signedQr?.data?.signedUrl ?? null,
            };
          }),
        ),
      })),
    );
    return NextResponse.json({
      data: assets.filter((asset) => asset.networks.length > 0),
    });
  } catch (cause) {
    return NextResponse.json(
      {
        error:
          cause instanceof Error
            ? cause.message
            : "Deposit methods could not be decrypted.",
      },
      { status: 500 },
    );
  }
}
