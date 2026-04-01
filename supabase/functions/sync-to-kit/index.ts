// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Using v4 which is required for tokens starting with 'kit_'
const KIT_API_BASE = "https://api.convertkit.com/v4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Auth Check (Supabase)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error("Missing Authorization header");
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) throw new Error("Unauthorized");

    const { data: profile } = await supabaseClient.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) throw new Error("Forbidden: Admin access required");

    // 2. Get Kit Token
    const kitToken = Deno.env.get('KIT_API_SECRET')?.trim();
    if (!kitToken) {
      console.error("[Sync] KIT_API_SECRET (v4 Token) is missing from environment.");
      throw new Error("KIT_API_SECRET not found.");
    }

    console.log(`[Sync] Attempting v4 sync with token: ${kitToken.substring(0, 8)}...`);

    const kitRequest = async (endpoint: string, options: any = {}) => {
      const url = `${KIT_API_BASE}${endpoint}`;
      
      const res = await fetch(url, {
        ...options,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${kitToken}`,
          ...options.headers,
        },
      })
      
      const resText = await res.text();
      if (!res.ok) {
        console.error(`[Sync] Kit API Error (${endpoint}):`, res.status, resText);
        throw new Error(`Kit API Error: ${res.status} - ${resText}`);
      }
      return resText ? JSON.parse(resText) : {};
    }

    // 3. Get or Create 'choir' Tag
    console.log("[Sync] Fetching tags...");
    const tagsData = await kitRequest("/tags")
    let choirTag = tagsData.tags?.find((t: any) => t.name.toLowerCase() === "choir")
    
    if (!choirTag) {
      console.log("[Sync] 'choir' tag not found. Creating it...");
      const newTagData = await kitRequest("/tags", {
        method: "POST",
        body: JSON.stringify({ name: "choir" }),
      })
      choirTag = newTagData.tag
    }

    // 4. Fetch and Sync Members
    const { data: members } = await supabaseClient.from('profiles').select('email, first_name, last_name')
    
    let successCount = 0;
    let failCount = 0;

    for (const member of members) {
      if (!member.email) continue;
      
      try {
        // v4 endpoint for adding a subscriber to a tag
        await kitRequest(`/tags/${choirTag.id}/subscribers`, {
          method: "POST",
          body: JSON.stringify({
            email: member.email,
            first_name: member.first_name || "",
            last_name: member.last_name || ""
          })
        });
        successCount++;
      } catch (e) {
        console.error(`[Sync] Failed to sync ${member.email}:`, e.message);
        failCount++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, synced: successCount, failed: failCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})