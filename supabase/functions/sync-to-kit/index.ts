// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const KIT_API_BASE = "https://api.kit.com/v4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (userError || !user) throw new Error("Unauthorized");

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) throw new Error("Forbidden: Admin access required");

    // 2. Fetch all members
    const { data: members, error: membersError } = await supabaseClient
      .from('profiles')
      .select('email, first_name, last_name')
    
    if (membersError) throw membersError;

    // 3. Kit API Logic
    const kitSecret = Deno.env.get('KIT_API_SECRET')
    if (!kitSecret) throw new Error("KIT_API_SECRET not found in Edge Function environment");

    const kitRequest = async (endpoint: string, options: any = {}) => {
      const res = await fetch(`${KIT_API_BASE}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${kitSecret}`,
          ...options.headers,
        },
      })
      return res.json()
    }

    // Get or Create 'choir' Tag
    const tagsData = await kitRequest("/tags")
    let choirTag = tagsData.tags?.find((t: any) => t.name.toLowerCase() === "choir")
    
    if (!choirTag) {
      const newTagData = await kitRequest("/tags", {
        method: "POST",
        body: JSON.stringify({ name: "choir" }),
      })
      choirTag = newTagData.tag
    }

    // 4. Sync Members
    let successCount = 0;
    let failCount = 0;

    for (const member of members) {
      if (!member.email) continue;
      
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

      if (res.ok) successCount++;
      else failCount++;
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