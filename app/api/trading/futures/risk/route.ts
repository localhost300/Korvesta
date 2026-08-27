import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rejectCrossSiteMutation } from "@/lib/security/request";

export async function PATCH(request:Request){
 const crossSite=rejectCrossSiteMutation(request);if(crossSite)return crossSite;const supabase=await createClient();if(!supabase)return NextResponse.json({error:"Trading storage is unavailable."},{status:503});
 const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const body=await request.json().catch(()=>null) as {assetId?:string;stopLoss?:number|null;takeProfit?:number|null}|null;if(!body?.assetId)return NextResponse.json({error:"Asset is required."},{status:400});
 const {data,error}=await supabase.rpc("set_futures_risk",{asset:body.assetId,requested_stop:body.stopLoss??null,requested_take:body.takeProfit??null});return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json({data});
}
