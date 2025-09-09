import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, context } = await req.json();

    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Create a specialized mood detection prompt
    const moodPrompt = `You are an expert mood detection system for a mindfulness app called Calmora. Analyze the following text and determine the primary emotional mood.

Text to analyze: "${text}"
Context: ${context || 'General mood check'}

Your task:
1. Analyze the emotional tone, word choice, and context
2. Determine the PRIMARY mood from these categories: happy, sad, angry, calm, anxious, excited, frustrated, peaceful, overwhelmed, grateful, lonely, confident, stressed, content, hopeful, disappointed, energetic, tired, worried, joyful
3. Provide a confidence score (0-100)
4. Give 2-3 word emotional descriptors
5. Suggest a brief supportive response (1-2 sentences)

Respond ONLY in this exact JSON format:
{
  "mood": "primary_mood_category",
  "confidence": 85,
  "descriptors": ["word1", "word2", "word3"],
  "supportive_message": "Brief supportive response here.",
  "secondary_emotions": ["emotion1", "emotion2"]
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: moodPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 512,
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Unexpected Gemini response structure:', data);
      throw new Error('Invalid response from Gemini API');
    }

    const rawResponse = data.candidates[0].content.parts[0].text;
    
    // Try to parse JSON response
    let moodData;
    try {
      // Clean the response to extract JSON
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        moodData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', rawResponse);
      // Fallback response
      moodData = {
        mood: "calm",
        confidence: 50,
        descriptors: ["neutral", "unclear"],
        supportive_message: "I'm here to support you. Feel free to share more about how you're feeling.",
        secondary_emotions: ["thoughtful"]
      };
    }

    return new Response(JSON.stringify(moodData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in mood-detection function:', error);
    
    // Fallback mood detection
    const fallbackMood = detectMoodFallback(text);
    
    return new Response(JSON.stringify({ 
      ...fallbackMood,
      fallback: true,
      error: error.message
    }), {
      status: 200, // Return 200 with fallback instead of error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Fallback mood detection function
function detectMoodFallback(text: string) {
  const lowerText = text.toLowerCase();
  
  const moodKeywords = {
    happy: ['happy', 'joy', 'excited', 'great', 'amazing', 'wonderful', 'fantastic', 'good', 'smile', 'laugh'],
    sad: ['sad', 'down', 'depressed', 'unhappy', 'disappointed', 'cry', 'tears', 'hurt', 'pain', 'loss'],
    angry: ['angry', 'mad', 'furious', 'annoyed', 'frustrated', 'irritated', 'rage', 'hate', 'upset'],
    anxious: ['anxious', 'worried', 'nervous', 'stress', 'panic', 'fear', 'scared', 'overwhelmed'],
    calm: ['calm', 'peaceful', 'relaxed', 'serene', 'quiet', 'still', 'tranquil', 'zen'],
    excited: ['excited', 'thrilled', 'pumped', 'energetic', 'enthusiastic', 'eager'],
    grateful: ['grateful', 'thankful', 'blessed', 'appreciate', 'lucky', 'fortunate']
  };
  
  let bestMatch = { mood: 'calm', score: 0 };
  
  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    const score = keywords.reduce((acc, keyword) => {
      return acc + (lowerText.includes(keyword) ? 1 : 0);
    }, 0);
    
    if (score > bestMatch.score) {
      bestMatch = { mood, score };
    }
  }
  
  return {
    mood: bestMatch.mood,
    confidence: Math.min(bestMatch.score * 20 + 40, 90),
    descriptors: [bestMatch.mood, "detected"],
    supportive_message: "I'm here to support you through whatever you're feeling.",
    secondary_emotions: [bestMatch.mood]
  };
}