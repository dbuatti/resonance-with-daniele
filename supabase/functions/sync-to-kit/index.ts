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

    // 1. Supabase Auth Check
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

    // 2. Get Kit Personal Access Token
    const kitToken = Deno.env.get('KIT_API_SECRET')?.trim()
    if (!kitToken) {
      throw new Error("KIT_API_SECRET not found in environment variables.")
    }

    console.log(`[Sync] Verifying Kit v4 token (starts with: ${kitToken.substring(0, 8)}...)`)

    // Correct Kit Request Helper for Personal Access Tokens
    const kitRequest = async (endpoint: string, options: any = {}) => {
      const url = `${KIT_API_BASE}${endpoint}`

      const headers: any = {
        "Accept": "application/json",
        "X-Kit-Api-Key": kitToken,     // ← This is the correct header
      }

      if (options.body) {
        headers["Content-Type"] = "application/json"
      }

      const res = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      })

      const resText = await res.text()

      if (!res.ok) {
        console.error(`[Sync] Kit API Error (${endpoint}):`, res.status, resText)

        if (res.status === 401) {
          throw new Error(
            `Kit Authentication Failed: The access token is invalid.\n` +
            `Make sure:\n` +
            `1. You are using a valid Personal Access Token (starts with kit_)\n` +
            `2. The token is copied exactly (no extra spaces)\n` +
            `3. The token has not been revoked in Kit settings`
          )
        }

        throw new Error(`Kit API Error: ${res.status} - ${resText}`)
      }

      return resText ? JSON.parse(resText) : {}
    }

    // 3. Verify Account Access
    console.log("[Sync] Verifying account access...")
    try {
      const account = await kitRequest("/account")
      console.log(`[Sync] Account verified successfully! Account ID: ${account.id || 'N/A'}`)
    } catch (e: any) {
      console.error("[Sync] Failed to verify account access:", e.message)
      throw e
    }

    // 4. Get or Create 'choir' Tag
    console.log("[Sync] Fetching tags...")
    const tagsData = await kitRequest("/tags")

    let choirTag = tagsData.tags?.find((t: any) => t.name.toLowerCase() === "choir")

    if (!choirTag) {
      console.log("[Sync] 'choir' tag not found. Creating it...")
      const newTagData = await kitRequest("/tags", {
        method: "POST",
        body: JSON.stringify({ name: "choir" }),
      })
      choirTag = newTagData.tag
      console.log(`[Sync] Created new 'choir' tag with ID: ${choirTag.id}`)
    } else {
      console.log(`[Sync] Found existing 'choir' tag with ID: ${choirTag.id}`)
    }

    // 5. Fetch members and sync to Kit
    console.log("[Sync] Fetching members from Supabase...")
    const { data: members, error: membersError } = await supabaseClient
      .from('profiles')
      .select('email, first_name, last_name')

    if (membersError) throw membersError

    let successCount = 0
    let failCount = 0

    for (const member of members || []) {
      if (!member.email) continue

      try {
        await kitRequest(`/tags/${choirTag.id}/subscribers`, {
          method: "POST",
          body: JSON.stringify({
            email: member.email,
            first_name: member.first_name || "",
            last_name: member.last_name || ""
          })
        })
        successCount++
      } catch (e: any) {
        console.error(`[Sync] Failed to sync ${member.email}:`, e.message)
        failCount++
      }
    }

    console.log(`[Sync] Sync completed - Success: ${successCount}, Failed: ${failCount}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: successCount, 
        failed: failCount,
        message: `Synced ${successCount} members to 'choir' tag.`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )

  } catch (error: any) {
    console.error("[Sync] Fatal error:", error.message)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    )
  }
})