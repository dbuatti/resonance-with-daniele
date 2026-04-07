// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const kitToken = Deno.env.get('KIT_API_SECRET')?.trim()
    if (!kitToken) throw new Error("KIT_API_SECRET not found.")

    const payload = await req.json()
    const { record, type } = payload

    if (!record || !record.email) {
      console.log("[auto-kit-sync] No record or email found. Skipping.");
      return new Response(JSON.stringify({ skipped: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    console.log(`[auto-kit-sync] Processing ${type} for: ${record.email}`);

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

    const tagsData = await kitRequest("/tags")
    let choirTag = tagsData.tags?.find((t: any) => t.name.toLowerCase() === "choir")

    if (!choirTag) {
      const newTagData = await kitRequest("/tags", {
        method: "POST",
        body: JSON.stringify({ name: "choir" })
      })
      choirTag = newTagData.tag
    }

    await kitRequest("/subscribers", {
      method: "POST",
      body: JSON.stringify({
        email_address: record.email,
        first_name: (record.first_name || "").trim(),
        last_name: (record.last_name || "").trim()
      })
    })

    await kitRequest(`/tags/${choirTag.id}/subscribers`, {
      method: "POST",
      body: JSON.stringify({
        email_address: record.email
      })
    })

    console.log(`[auto-kit-sync] Successfully synced ${record.email} to Kit.`);

    return new Response(
      JSON.stringify({ success: true, email: record.email }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error("[auto-kit-sync] Error:", error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})