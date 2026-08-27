import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rejectCrossSiteMutation } from "@/lib/security/request";
export async function POST(request:Request){const crossSite=rejectCrossSiteMutation(request);if(crossSite)return crossSite;const supabase=await createClient();const admin=createAdminClient();if(!supabase||!admin)return NextResponse.json({error:"Trading storage is unavailable."},{status:503});const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});return NextResponse.json({checked:0,updated:0,engine:"korvesta"})}
