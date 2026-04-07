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
      
      // If it's a 503 (Service Unavailable) or 429 (Rate Limit), retry
      if (response.status === 503 || response.status === 429) {
        console.log(`[analyze-feedback] Gemini API returned ${response.status}. Retry attempt ${i + 1}...`);
        const waitTime = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      return response;
    } catch (err) {
      lastError = err;
      console.error(`[analyze-feedback] Fetch error on attempt ${i + 1}:`, err.message);
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
    console.log("[analyze-feedback] Starting analysis for event:", eventId);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let query = supabaseClient.from('event_feedback').select('*')
    if (eventId !== "all") {
      query = query.eq('event_id', eventId)
    }

    const { data: feedback, error: fError } = await query

    if (fError || !feedback || feedback.length === 0) {
      console.error("[analyze-feedback] No feedback found", { fError });
      throw new Error("No feedback found to analyze.")
    }

    const feedbackSummary = feedback.map(f => ({
      feeling: f.overall_feeling,
      isFirstTime: f.is_first_time,
      howHeard: f.how_heard,
      enjoyed: f.enjoyed_most,
      improvements: f.improvements,
      venue: f.venue_feedback,
      repertoire: f.repertoire_feedback,
      future: f.future_ideas,
      score: f.recommend_score
    }))

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      console.error("[analyze-feedback] GEMINI_API_KEY missing from environment variables");
      throw new Error("GEMINI_API_KEY not set.")
    }

    const prompt = `
      Analyze this choir feedback data: ${JSON.stringify(feedbackSummary)}
      Provide a JSON response with:
      - "sentiment_score": (0-100)
      - "top_highlights": [3 strings]
      - "critical_friction": [2 strings]
      - "repertoire_demand": "string"
      - "strategic_advice": "2-sentence note to the director focusing on retention and marketing based on the data"
    `

    console.log("[analyze-feedback] Calling Gemini 2.5 Flash API with retry logic...");
    
    const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const result = await response.json()

    if (!result.candidates || result.candidates.length === 0) {
      console.error("[analyze-feedback] Gemini API returned no candidates. Full response:", JSON.stringify(result));
      if (result.error) throw new Error(`Gemini API Error: ${result.error.message}`);
      throw new Error("AI failed to generate a response.");
    }

    const aiResponseText = result.candidates[0].content.parts[0].text;
    const aiResponse = JSON.parse(aiResponseText);

    console.log("[analyze-feedback] Analysis complete");

    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    console.error("[analyze-feedback] Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})