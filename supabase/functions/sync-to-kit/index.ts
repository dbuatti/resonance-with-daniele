// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const KIT_API_BASE = "https://api.kit.com/v4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log(`[Sync] Request received: ${req.method}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Verify Admin Status using the user's JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error("[Sync] Missing Authorization header");
      throw new Error("Missing Authorization header");
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.error("[Sync] Auth error:", userError?.message || "User not found");
      throw new Error("Unauthorized");
    }

    console.log(`[Sync] Authenticated user: ${user.email}`);

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      console.error("[Sync] Forbidden: User is not an admin");
      throw new Error("Forbidden: Admin access required");
    }

    // 2. Fetch all members
    console.log("[Sync] Fetching member profiles...");
    const { data: members, error: membersError } = await supabaseClient
      .from('profiles')
      .select('email, first_name, last_name')
    
    if (membersError) {
      console.error("[Sync] Database error fetching members:", membersError.message);
      throw membersError;
    }

    console.log(`[Sync] Found ${members?.length || 0} members to sync.`);

    // 3. Kit API Logic
    const kitSecret = Deno.env.get('KIT_API_SECRET')
    if (!kitSecret) {
      console.error("[Sync] KIT_API_SECRET is missing from environment variables");
      throw new Error("KIT_API_SECRET not found in Edge Function environment");
    }

    const kitRequest = async (endpoint: string, options: any = {}) => {
      const res = await fetch(`${KIT_API_BASE}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${kitSecret}`,
          ...options.headers,
        },
      })
      if (!res.ok) {
        const errBody = await res.text();
        console.error(`[Sync] Kit API Error (${endpoint}):`, res.status, errBody);
        throw new Error(`Kit API Error: ${res.status}`);
      }
      return res.json()
    }

    // Get or Create 'choir' Tag
    console.log("[Sync] Checking for 'choir' tag in Kit...");
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

    console.log(`[Sync] Using Kit Tag ID: ${choirTag.id}`);

    // 4. Sync Members
    let successCount = 0;
    let failCount = 0;

    for (const member of members) {
      if (!member.email) continue;
      
      try {
        const res = await fetch(`${KIT_API_BASE}/tags/${choirTag.id}/subscribers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${kitSecret}`,
          },
          body: JSON.stringify({
            email: member.email,
            first_name: member.first_name || "",
            fields: { last_name: member.last_name || "" }
          })
        });

        if (res.ok) {
          successCount++;
        } else {
          const errText = await res.text();
          console.warn(`[Sync] Failed to sync member ${member.email}:`, errText);
          failCount++;
        }
      } catch (e) {
        console.error(`[Sync] Network error syncing ${member.email}:`, e.message);
        failCount++;
      }
    }

    console.log(`[Sync] Finished. Success: ${successCount}, Failed: ${failCount}`);

    return new Response(
      JSON.stringify({ success: true, synced: successCount, failed: failCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error("[Sync] Fatal error in Edge Function:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})