import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rejectCrossSiteMutation } from "@/lib/security/request";
import { requireActiveCustomer } from "@/lib/security/account-status";

export async function POST(request: Request) {
  const crossSite = rejectCrossSiteMutation(request); if (crossSite) return crossSite;
  const supabase = await createClient(); if (!supabase) return NextResponse.json({error:"Trading storage is unavailable."},{status:503});
  const {data:{user}}=await supabase.auth.getUser(); if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
  const blocked=await requireActiveCustomer(request,supabase,user.id,"trading_transfer"); if(blocked)return blocked;
  const body=await request.json().catch(()=>null) as {direction?:string;amount?:number;idempotencyKey?:string}|null;
  const amount=Number(body?.amount); if(!body?.direction||!Number.isFinite(amount)||amount<=0)return NextResponse.json({error:"Direction and positive amount are required."},{status:400});
  const walletTransfer=["wallet_to_spot","spot_to_wallet"].includes(body.direction);
  const procedure=walletTransfer?"transfer_wallet_spot":"transfer_spot_futures";
  const parameters=walletTransfer?{requested_direction:body.direction,requested_amount:amount,request_key:body.idempotencyKey??crypto.randomUUID()}:{requested_direction:body.direction,requested_amount:amount};
  const {data,error}=await supabase.rpc(procedure,parameters); return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json({balance:data});
}
