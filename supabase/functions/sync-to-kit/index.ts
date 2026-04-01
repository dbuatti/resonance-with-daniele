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

    // Supabase Auth Check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error("Missing Authorization header")

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) throw new Error("Unauthorized")

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) throw new Error("Forbidden: Admin access required")

    const kitToken = Deno.env.get('KIT_API_SECRET')?.trim()
    if (!kitToken) throw new Error("KIT_API_SECRET not found in environment variables.")

    console.log(`[Sync] Verifying Kit v4 token (starts with: ${kitToken.substring(0, 8)}...)`)

    const kitRequest = async (endpoint: string, options: any = {}) => {
      const url = `${KIT_API_BASE}${endpoint}`

      const headers: any = {
        "Accept": "application/json",
        "X-Kit-Api-Key": kitToken,
      }

      if (options.body) headers["Content-Type"] = "application/json"

      const res = await fetch(url, {
        ...options,
        headers: { ...headers, ...options.headers }
      })

      const resText = await res.text()

      if (!res.ok) {
        console.error(`[Sync] Kit API Error (${endpoint}):`, res.status, resText)
        throw new Error(`Kit Error ${res.status}: ${resText}`)
      }

      return resText ? JSON.parse(resText) : {}
    }

    // Verify account
    console.log("[Sync] Verifying account access...")
    const account = await kitRequest("/account")
    console.log(`[Sync] Account verified! ID: ${account.id || 'N/A'}`)

    // Get or create 'choir' tag
    console.log("[Sync] Fetching tags...")
    const tagsData = await kitRequest("/tags")
    let choirTag = tagsData.tags?.find((t: any) => t.name.toLowerCase() === "choir")

    if (!choirTag) {
      console.log("[Sync] Creating 'choir' tag...")
      const newTagData = await kitRequest("/tags", {
        method: "POST",
        body: JSON.stringify({ name: "choir" })
      })
      choirTag = newTagData.tag
      console.log(`[Sync] Created 'choir' tag with ID: ${choirTag.id}`)
    } else {
      console.log(`[Sync] Using existing 'choir' tag ID: ${choirTag.id}`)
    }

    // Fetch members
    console.log("[Sync] Fetching members from Supabase...")
    const { data: members, error: membersError } = await supabaseClient
      .from('profiles')
      .select('email, first_name, last_name')

    if (membersError) throw new Error(`Failed to fetch members: ${membersError.message}`)

    let successCount = 0
    let failCount = 0

    console.log(`[Sync] Starting sync for ${members?.length || 0} members...`)

    for (const member of members || []) {
      const email = member.email?.trim()
      if (!email) continue

      try {
        // Step 1: Create/Update subscriber (upsert)
        await kitRequest("/subscribers", {
          method: "POST",
          body: JSON.stringify({
            email_address: email,
            first_name: (member.first_name || "").trim(),
            last_name: (member.last_name || "").trim()
          })
        })

        // Step 2: Add the 'choir' tag
        await kitRequest(`/tags/${choirTag.id}/subscribers`, {
          method: "POST",
          body: JSON.stringify({
            email_address: email
          })
        })

        successCount++
        console.log(`[Sync] ✓ Success: ${email}`)
      } catch (e: any) {
        console.error(`[Sync] Failed for ${email}:`, e.message)
        failCount++
      }
    }

    console.log(`[Sync] Completed → Success: ${successCount}, Failed: ${failCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        synced: successCount,
        failed: failCount,
        message: `Successfully synced ${successCount} members with the 'choir' tag.`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )

  } catch (error: any) {
    console.error("[Sync] Fatal error:", error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})