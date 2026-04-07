// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper for exponential backoff retries
async function fetchWithRetry(url, options, maxRetries = 3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 503 || response.status === 429) {
        const waitTime = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      return response;
    } catch (err) {
      lastError = err;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw lastError || new Error("Max retries reached");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { eventId } = await req.json()
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Fetch all events to get repertoire history
    const { data: allEvents } = await supabaseClient
      .from('events')
      .select('title, date, main_song')
      .order('date', { ascending: false });

    const repertoireHistory = allEvents
      ?.filter(e => e.main_song)
      .map(e => `${e.main_song} (${e.date})`)
      .join(', ') || "None recorded yet";

    // 2. Fetch feedback for analysis
    let query = supabaseClient.from('event_feedback').select('*')
    if (eventId !== "all") {
      query = query.eq('event_id', eventId)
    }

    const { data: feedback, error: fError } = await query

    if (fError || !feedback || feedback.length === 0) {
      throw new Error("No feedback found to analyze.")
    }

    const feedbackSummary = feedback.map(f => ({
      feeling: f.overall_feeling,
      enjoyed: f.enjoyed_most,
      improvements: f.improvements,
      repertoire: f.repertoire_feedback,
      future_repertoire: f.future_repertoire,
      future_ideas: f.future_ideas,
      score: f.recommend_score
    }))

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    const prompt = `
      Analyze this choir feedback data: ${JSON.stringify(feedbackSummary)}
      
      IMPORTANT CONTEXT:
      Songs already performed (DO NOT SUGGEST THESE): ${repertoireHistory}

      Provide a JSON response with:
      - "sentiment_score": (0-100)
      - "top_highlights": [3 strings]
      - "critical_friction": [2 strings]
      - "next_event_action": "ONE specific, high-impact, actionable task for the next session based on this feedback. Keep it under 15 words."
      - "repertoire_analysis": {
          "specific_requests": ["List of specific songs or artists identified from the feedback, corrected for spelling. EXCLUDE songs already performed."],
          "thematic_patterns": ["Broader patterns like 'More 80s pop', 'Simpler harmonies', etc."],
          "summary": "A 2-sentence overview of the community's musical appetite."
        },
      - "strategic_advice": "2-sentence note to the director focusing on retention and marketing based on the data"
    `

    const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const result = await response.json()
    const aiResponse = JSON.parse(result.candidates[0].content.parts[0].text);

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