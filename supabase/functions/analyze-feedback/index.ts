// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { eventId } = await req.json()
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Fetch all feedback for this event
    const { data: feedback, error: fError } = await supabaseClient
      .from('event_feedback')
      .select('*')
      .eq('event_id', eventId)

    if (fError || !feedback || feedback.length === 0) {
      throw new Error("No feedback found to analyze.")
    }

    // 2. Prepare the data for Gemini
    const feedbackSummary = feedback.map(f => ({
      feeling: f.overall_feeling,
      enjoyed: f.enjoyed_most,
      improvements: f.improvements,
      venue: f.venue_feedback,
      repertoire: f.repertoire_feedback,
      future: f.future_repertoire,
      score: f.recommend_score
    }))

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) throw new Error("GEMINI_API_KEY not set in Supabase secrets.")

    // 3. Call Gemini
    const prompt = `
      You are a strategic consultant for Daniele Buatti, a world-class vocal coach and choir director.
      Analyze the following feedback from a recent pop-up choir session.
      
      DATA: ${JSON.stringify(feedbackSummary)}

      Provide a JSON response with these keys:
      - "sentiment_score": (0-100)
      - "top_highlights": [3 strings of what people loved most]
      - "critical_friction": [2 strings of what needs immediate fixing]
      - "repertoire_demand": "Summary of what songs/artists they want next"
      - "strategic_advice": "A 2-sentence personal note to Daniele on how to make the next session even better based on this data."
      
      Keep the tone professional, encouraging, and human.
    `

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    })

    const result = await response.json()
    const aiResponse = JSON.parse(result.candidates[0].content.parts[0].text)

    // 4. Store the insights back in the event record (or a dedicated table, but we'll return it for now)
    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})