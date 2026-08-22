import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  enforceRateLimit,
  rejectCrossSiteMutation,
} from "@/lib/security/request";

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
  const [{ data: profile }, { data: submissions, error }] = await Promise.all([
    supabase.from("profiles").select("kyc_status").eq("id", user.id).single(),
    supabase
      .from("kyc_submissions")
      .select(
        "id,legal_name,date_of_birth,country,address,document_type,status,review_note,created_at,reviewed_at",
      )
      .order("created_at", { ascending: false }),
  ]);
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json({
        status: profile?.kyc_status ?? "unverified",
        submissions: submissions ?? [],
      });
}
export async function POST(request: Request) {
  const cross = rejectCrossSiteMutation(request);
  if (cross) return cross;
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
  const limited = await enforceRateLimit(
    request,
    "kyc-submit",
    3,
    86400,
    user.id,
  );
  if (limited) return limited;
  const form = await request.formData();
  const required = [
    "legalName",
    "dateOfBirth",
    "country",
    "address",
    "documentType",
  ] as const;
  if (required.some((key) => !String(form.get(key) ?? "").trim()))
    return NextResponse.json(
      { error: "Complete every identity field." },
      { status: 400 },
    );
  const front = form.get("documentFront"),
    back = form.get("documentBack"),
    selfie = form.get("selfie");
  if (!(front instanceof File) || !(selfie instanceof File))
    return NextResponse.json(
      { error: "Document front and selfie are required." },
      { status: 400 },
    );
  const files: Array<[string, File]> = [
    ["front", front],
    ["selfie", selfie],
  ];
  if (back instanceof File && back.size) files.splice(1, 0, ["back", back]);
  for (const [, file] of files)
    if (
      file.size > 10 * 1024 * 1024 ||
      !["image/png", "image/jpeg", "application/pdf"].includes(file.type)
    )
      return NextResponse.json(
        {
          error: "Documents must be PNG, JPG, or PDF and no larger than 10 MB.",
        },
        { status: 400 },
      );
  const submissionId = crypto.randomUUID();
  const paths: Record<string, string> = {};
  for (const [kind, file] of files) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${user.id}/${submissionId}/${kind}.${extension}`;
    const { error } = await supabase.storage
      .from("kyc-documents")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    paths[kind] = path;
  }
  const { error } = await supabase.from("kyc_submissions").insert({
    id: submissionId,
    user_id: user.id,
    legal_name: String(form.get("legalName")).trim(),
    date_of_birth: String(form.get("dateOfBirth")),
    country: String(form.get("country")).trim(),
    address: String(form.get("address")).trim(),
    document_type: String(form.get("documentType")),
    document_front_path: paths.front,
    document_back_path: paths.back ?? null,
    selfie_path: paths.selfie,
  });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  await supabase
    .from("profiles")
    .update({ kyc_status: "pending" })
    .eq("id", user.id);
  return NextResponse.json(
    { id: submissionId, status: "pending" },
    { status: 201 },
  );
}
