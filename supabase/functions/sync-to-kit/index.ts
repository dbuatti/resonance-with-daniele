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
    if (!kitToken) throw new Error("KIT_API_SECRET not found.")

    const kitRequest = async (endpoint: string, options: any = {}) => {
      const url = `${KIT_API_BASE}${endpoint}`
      const headers: any = {
        "Accept": "application/json",
        "X-Kit-Api-Key": kitToken,
      }
      if (options.body) headers["Content-Type"] = "application/json"
      const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } })
      const resText = await res.text()
      if (!res.ok) throw new Error(`Kit Error ${res.status}: ${resText}`)
      return resText ? JSON.parse(resText) : {}
    }

    // 1. Get or create 'choir' tag
    const tagsData = await kitRequest("/tags")
    let choirTag = tagsData.tags?.find((t: any) => t.name.toLowerCase() === "choir")
    if (!choirTag) {
      const newTagData = await kitRequest("/tags", { method: "POST", body: JSON.stringify({ name: "choir" }) })
      choirTag = newTagData.tag
    }

    // 2. Fetch from both tables
    const { data: members } = await supabaseClient.from('profiles').select('email, first_name, last_name')
    const { data: interests } = await supabaseClient.from('interest_submissions').select('email, first_name, last_name')

    // 3. Combine and de-duplicate by email
    const allPeople = [...(members || []), ...(interests || [])]
    const uniquePeople = Array.from(new Map(allPeople.filter(p => p.email).map(p => [p.email.toLowerCase(), p])).values())

    console.log(`[Manual Sync] Found ${uniquePeople.length} unique emails to sync.`);

    let successCount = 0
    for (const person of uniquePeople) {
      const email = person.email?.trim()
      if (!email) continue
      try {
        await kitRequest("/subscribers", {
          method: "POST",
          body: JSON.stringify({
            email_address: email,
            first_name: (person.first_name || "").trim(),
            last_name: (person.last_name || "").trim()
          })
        })
        await kitRequest(`/tags/${choirTag.id}/subscribers`, {
          method: "POST",
          body: JSON.stringify({ email_address: email })
        })
        successCount++
      } catch (e) {
        console.error(`Failed for ${email}:`, e.message)
      }
    }

    return new Response(
      JSON.stringify({ success: true, synced: successCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error("[Manual Sync] Error:", error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})