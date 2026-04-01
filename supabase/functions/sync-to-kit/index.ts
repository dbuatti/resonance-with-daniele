// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const KIT_API_BASE = "https://api.kit.com/v4";

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

    // 1. Auth Check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error("Missing Authorization header");
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) throw new Error("Unauthorized");

    const { data: profile } = await supabaseClient.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) throw new Error("Forbidden: Admin access required");

    // 2. Get Kit Secret
    const kitSecret = Deno.env.get('KIT_API_SECRET')
    if (!kitSecret) throw new Error("KIT_API_SECRET not found in environment");

    console.log(`[Sync] Using token starting with: ${kitSecret.substring(0, 4)}...`);

    const kitRequest = async (endpoint: string, options: any = {}) => {
      const res = await fetch(`${KIT_API_BASE}${endpoint}`, {
        ...options,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${kitSecret}`,
          ...options.headers,
        },
      })
      
      if (!res.ok) {
        const errBody = await res.text();
        console.error(`[Sync] Kit API Error (${endpoint}):`, res.status, errBody);
        
        if (res.status === 401) {
          throw new Error("Kit API Key is invalid or account access is disabled. Check the warning at the top of your Kit settings page.");
        }
        throw new Error(`Kit API Error: ${res.status}`);
      }
      return res.json()
    }

    // 3. Get or Create 'choir' Tag
    console.log("[Sync] Fetching tags...");
    const tagsData = await kitRequest("/tags")
    let choirTag = tagsData.tags?.find((t: any) => t.name.toLowerCase() === "choir")
    
    if (!choirTag) {
      console.log("[Sync] Creating 'choir' tag...");
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
        // Kit V4 Subscriber Schema
        const res = await fetch(`${KIT_API_BASE}/tags/${choirTag.id}/subscribers`, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${kitSecret}`,
          },
          body: JSON.stringify({
            email: member.email,
            first_name: member.first_name || "",
            last_name: member.last_name || ""
          })
        });

        if (res.ok) successCount++;
        else {
          const err = await res.text();
          console.warn(`[Sync] Failed for ${member.email}:`, err);
          failCount++;
        }
      } catch (e) {
        failCount++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, synced: successCount, failed: failCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error("[Sync] Fatal:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})