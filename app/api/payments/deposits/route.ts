import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  enforceRateLimit,
  rejectCrossSiteMutation,
} from "@/lib/security/request";
import { requireActiveCustomer } from "@/lib/security/account-status";
import { sendTransactionalEmail } from "@/lib/email";

export async function POST(request: Request) {
  const crossSite = rejectCrossSiteMutation(request);
  if (crossSite) return crossSite;
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
  const blocked = await requireActiveCustomer(
    request,
    supabase,
    user.id,
    "deposit_create",
  );
  if (blocked) return blocked;
  const limited = await enforceRateLimit(
    request,
    "deposit-create",
    10,
    3600,
    user.id,
  );
  if (limited) return limited;
  const form = await request.formData();
  const symbol = String(form.get("asset") ?? "");
  const networkName = String(form.get("network") ?? "");
  const amount = String(form.get("amount") ?? "");
  const transactionHash = String(form.get("transactionHash") ?? "").trim();
  const proof = form.get("proof");
  if (
    !symbol ||
    !networkName ||
    !/^\d+(\.\d+)?$/.test(amount) ||
    Number(amount) <= 0 ||
    !transactionHash ||
    !(proof instanceof File) ||
    proof.size > 10 * 1024 * 1024
  )
    return NextResponse.json(
      {
        error:
          "Asset, network, positive amount, transaction hash and valid proof are required.",
      },
      { status: 400 },
    );
  const { data: asset } = await supabase
    .from("assets")
    .select("id")
    .eq("symbol", symbol)
    .eq("enabled", true)
    .single();
  if (!asset)
    return NextResponse.json({ error: "Unsupported asset." }, { status: 400 });
  const { data: network } = await supabase
    .from("networks")
    .select("id,deposit_address_encrypted")
    .eq("asset_id", asset.id)
    .eq("name", networkName)
    .eq("enabled", true)
    .single();
  if (!network?.deposit_address_encrypted)
    return NextResponse.json(
      { error: "This deposit method is unavailable." },
      { status: 400 },
    );
  const extension = proof.name.split(".").pop()?.toLowerCase() ?? "";
  const contentTypes: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    pdf: "application/pdf",
  };
  const contentType = contentTypes[extension];
  if (!contentType)
    return NextResponse.json(
      { error: "Proof must be a PNG, JPG, JPEG or PDF file." },
      { status: 400 },
    );
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const upload = await supabase.storage
    .from("payment-proofs")
    .upload(path, proof, { contentType, upsert: false });
  if (upload.error)
    return NextResponse.json(
      { error: `Proof upload failed: ${upload.error.message}` },
      { status: 400 },
    );
  const { data, error } = await supabase
    .from("deposit_requests")
    .insert({
      user_id: user.id,
      asset_id: asset.id,
      network_id: network.id,
      amount,
      transaction_hash: transactionHash,
      proof_path: path,
    })
    .select("id,status")
    .single();
  if (error) {
    await supabase.storage.from("payment-proofs").remove([path]);
    return NextResponse.json(
      {
        error:
          error.code === "23505"
            ? "This transaction hash was already submitted."
            : error.message,
      },
      { status: 400 },
    );
  }
  if (user.email) {
    await sendTransactionalEmail({
      to: user.email,
      subject: "Your deposit is being reviewed",
      heading: "Deposit submitted",
      message:
        "We received your deposit proof. Your balance will update after the payment is verified.",
      details: [
        ["Asset", symbol],
        ["Amount", amount],
        ["Network", networkName],
        ["Status", "Pending review"],
      ],
      actionLabel: "View transactions",
      actionPath: "/dashboard/transactions",
      idempotencyKey: `deposit-submitted-${data.id}`,
    });
  }
  return NextResponse.json({ data }, { status: 201 });
}
