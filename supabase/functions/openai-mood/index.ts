import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openaiKey = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openaiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const { text, context } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Invalid 'text' provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert mood detection system for a mindfulness app called Calmora. Analyze the user's text and return STRICT JSON only.

Categories: happy, sad, angry, calm, anxious, excited, frustrated, peaceful, overwhelmed, grateful, lonely, confident, stressed, content, hopeful, disappointed, energetic, tired, worried, joyful

Return only valid JSON with this exact shape and keys in this order:
{
  "mood": "one_of_categories",
  "confidence": 0,
  "descriptors": ["word1", "word2", "word3"],
  "supportive_message": "1-2 sentences",
  "secondary_emotions": ["emotion1", "emotion2"]
}

Rules:
- Output JSON only, no markdown, no extra text
- confidence is an integer 0-100
- descriptors are concise emotional adjectives
- supportive_message is warm, concise, and practical`;

    const userPrompt = `Text: "${text}"
Context: ${context || "General mood check"}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-2025-08-07",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_completion_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", errText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    let moodData: any;
    try {
      // Extract JSON block
      const match = content.match(/\{[\s\S]*\}/);
      moodData = match ? JSON.parse(match[0]) : JSON.parse(content);
    } catch (_e) {
      // Fallback minimal response
      moodData = {
        mood: "calm",
        confidence: 50,
        descriptors: ["neutral", "unclear"],
        supportive_message: "I'm here with you. Share more if you'd like.",
        secondary_emotions: ["thoughtful"],
        fallback: true,
      };
    }

    return new Response(JSON.stringify(moodData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in openai-mood function:", error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message,
        fallback: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
