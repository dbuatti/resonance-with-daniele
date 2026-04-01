// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const KIT_API_BASE = "https://api.kit.com/v4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const kitToken = Deno.env.get('KIT_API_SECRET')?.trim()
    if (!kitToken) throw new Error("KIT_API_SECRET not found.")

    // Parse the Webhook payload from Supabase
    const payload = await req.json()
    const { record, type } = payload

    // We only care about new profiles or updates where we have an email
    if (!record || !record.email) {
      console.log("[Auto-Sync] No record or email found in payload. Skipping.");
      return new Response(JSON.stringify({ skipped: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    console.log(`[Auto-Sync] Processing ${type} for: ${record.email}`);

    const kitRequest = async (endpoint: string, options: any = {}) => {
      const url = `${KIT_API_BASE}${endpoint}`
      const headers: any = {
        "Accept": "application/json",
        "X-Kit-Api-Key": kitToken,
        "Content-Type": "application/json"
      }

      const res = await fetch(url, {
        ...options,
        headers: { ...headers, ...options.headers }
      })

      const resText = await res.text()
      if (!res.ok) throw new Error(`Kit Error ${res.status}: ${resText}`)
      return resText ? JSON.parse(resText) : {}
    }

    // 1. Get or create 'choir' tag
    const tagsData = await kitRequest("/tags")
    let choirTag = tagsData.tags?.find((t: any) => t.name.toLowerCase() === "choir")

    if (!choirTag) {
      const newTagData = await kitRequest("/tags", {
        method: "POST",
        body: JSON.stringify({ name: "choir" })
      })
      choirTag = newTagData.tag
    }

    // 2. Create/Update subscriber
    await kitRequest("/subscribers", {
      method: "POST",
      body: JSON.stringify({
        email_address: record.email,
        first_name: (record.first_name || "").trim(),
        last_name: (record.last_name || "").trim()
      })
    })

    // 3. Add the 'choir' tag
    await kitRequest(`/tags/${choirTag.id}/subscribers`, {
      method: "POST",
      body: JSON.stringify({
        email_address: record.email
      })
    })

    console.log(`[Auto-Sync] Successfully synced ${record.email} to Kit.`);

    return new Response(
      JSON.stringify({ success: true, email: record.email }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error("[Auto-Sync] Error:", error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})