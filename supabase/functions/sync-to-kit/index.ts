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

      const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } })
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

    // Get 'choir' tag
    console.log("[Sync] Fetching tags...")
    const tagsData = await kitRequest("/tags")
    let choirTag = tagsData.tags?.find((t: any) => t.name.toLowerCase() === "choir")

    if (!choirTag) {
      console.log("[Sync] Creating 'choir' tag...")
      const newTag = await kitRequest("/tags", {
        method: "POST",
        body: JSON.stringify({ name: "choir" })
      })
      choirTag = newTag.tag
      console.log(`[Sync] Created tag ID: ${choirTag.id}`)
    } else {
      console.log(`[Sync] Using existing 'choir' tag ID: ${choirTag.id}`)
    }

    // Fetch members
    console.log("[Sync] Fetching members from Supabase...")
    const { data: members, error: membersError } = await supabaseClient
      .from('profiles')
      .select('email, first_name, last_name')

    if (membersError) throw membersError

    let successCount = 0
    let failCount = 0

    console.log(`[Sync] Starting sync for ${members?.length || 0} members...`)

    for (const member of members || []) {
      const email = member.email?.trim()
      if (!email) continue

      try {
        // Primary method: Tag by email address (best for your case)
        await kitRequest(`/tags/${choirTag.id}/subscribers`, {
          method: "POST",
          body: JSON.stringify({
            email_address: email,
            first_name: (member.first_name || "").trim(),
            last_name: (member.last_name || "").trim()
          })
        })

        successCount++
        console.log(`[Sync] ✓ Tagged: ${email}`)
      } catch (e: any) {
        // If 404, try creating subscriber first (fallback)
        if (e.message.includes("404") || e.message.includes("Not Found")) {
          try {
            // Create subscriber (this will also allow tagging)
            await kitRequest("/subscribers", {
              method: "POST",
              body: JSON.stringify({
                email_address: email,
                first_name: (member.first_name || "").trim(),
                last_name: (member.last_name || "").trim()
              })
            })

            // Then tag them
            await kitRequest(`/tags/${choirTag.id}/subscribers`, {
              method: "POST",
              body: JSON.stringify({ email_address: email })
            })

            successCount++
            console.log(`[Sync] ✓ Created + tagged new subscriber: ${email}`)
          } catch (createError: any) {
            console.error(`[Sync] Failed to create/tag ${email}:`, createError.message)
            failCount++
          }
        } else {
          console.error(`[Sync] Failed to sync ${email}:`, e.message)
          failCount++
        }
      }
    }

    console.log(`[Sync] Finished → Success: ${successCount}, Failed: ${failCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        synced: successCount,
        failed: failCount,
        message: `Successfully processed ${successCount} members with 'choir' tag.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error("[Sync] Fatal error:", error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})