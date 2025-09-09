import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { gameSessionId, timeTaken, attempts, difficulty, category } = await req.json();

    // Get recent game sessions for analysis
    const { data: recentSessions, error: sessionsError } = await supabaseClient
      .from('game_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user's recent stress reports for context
    const { data: recentReports, error: reportsError } = await supabaseClient
      .from('stress_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
    }

    // Prepare data for AI analysis
    const gameData = {
      currentSession: { timeTaken, attempts, difficulty, category },
      recentSessions: recentSessions || [],
      recentReports: recentReports || [],
      sessionCount: recentSessions?.length || 0
    };

    // Calculate performance metrics
    const avgTime = recentSessions?.length ? 
      recentSessions.reduce((sum, session) => sum + (session.time_taken || 0), 0) / recentSessions.length : 0;
    
    const solvedSessions = recentSessions?.filter(s => s.solved) || [];
    const successRate = recentSessions?.length ? (solvedSessions.length / recentSessions.length) * 100 : 0;

    // Create prompt for Gemini AI
    const analysisPrompt = `
    Analyze this user's word puzzle game performance and generate a personalized mental wellness stress report:

    Current Session:
    - Time taken: ${timeTaken} seconds
    - Attempts: ${attempts}
    - Difficulty: ${difficulty}
    - Category: ${category}

    Recent Performance:
    - Average solving time: ${avgTime.toFixed(1)} seconds
    - Success rate: ${successRate.toFixed(1)}%
    - Sessions played: ${gameData.sessionCount}
    - Recent patterns: ${JSON.stringify(recentSessions?.slice(0, 5))}

    Based on this data, determine:
    1. Stress level (low/moderate/high) based on performance patterns, time pressure, and solving difficulty
    2. A personalized coping tip related to the stress level and game performance
    3. Brief encouraging analysis (2-3 sentences) about their mental wellness journey
    4. Which achievement badges they might have earned (first_solve, quick_thinker, mindful_solver, consistent_player, stress_manager)

    Consider factors:
    - Longer solving times or more attempts might indicate stress
    - Quick solving suggests good focus and low stress
    - Consistent play patterns show good engagement
    - Improvement over time indicates positive wellness trends

    Respond with a JSON object containing:
    {
      "stressLevel": "low|moderate|high",
      "copingTip": "specific actionable tip",
      "aiAnalysis": "encouraging analysis of their wellness journey",
      "suggestedBadges": ["badge_id1", "badge_id2"],
      "weeklyScore": number between 0-100
    }
    `;

    // Call Gemini AI API
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not found');
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: analysisPrompt }]
          }]
        })
      }
    );

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response:', geminiData);

    let aiResult;
    try {
      const aiText = geminiData.candidates[0].content.parts[0].text;
      // Extract JSON from the response
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback analysis
      aiResult = {
        stressLevel: timeTaken > 60 ? 'high' : timeTaken > 30 ? 'moderate' : 'low',
        copingTip: 'Take a deep breath and remember that every puzzle solved is progress toward better mental wellness.',
        aiAnalysis: 'You\'re making great progress on your mindfulness journey! Keep practicing and stay consistent.',
        suggestedBadges: attempts === 1 ? ['first_solve'] : ['mindful_solver'],
        weeklyScore: Math.max(20, Math.min(100, 100 - (timeTaken * 2) - (attempts * 10)))
      };
    }

    // Store the stress report in database
    const { data: stressReport, error: reportError } = await supabaseClient
      .from('stress_reports')
      .insert({
        user_id: user.id,
        stress_level: aiResult.stressLevel,
        weekly_score: aiResult.weeklyScore,
        coping_tip: aiResult.copingTip,
        ai_analysis: aiResult.aiAnalysis,
        badges: aiResult.suggestedBadges,
        game_session_id: gameSessionId
      })
      .select()
      .single();

    if (reportError) {
      console.error('Error saving stress report:', reportError);
    }

    // Update user game stats
    const { data: currentStats } = await supabaseClient
      .from('user_game_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (currentStats) {
      const newStreak = currentStats.last_played_date === new Date().toISOString().split('T')[0] 
        ? currentStats.current_streak 
        : currentStats.current_streak + 1;
      
      await supabaseClient
        .from('user_game_stats')
        .update({
          current_streak: newStreak,
          max_streak: Math.max(currentStats.max_streak, newStreak),
          total_puzzles_solved: currentStats.total_puzzles_solved + 1,
          average_solve_time: ((currentStats.average_solve_time * currentStats.total_puzzles_solved) + timeTaken) / (currentStats.total_puzzles_solved + 1),
          last_played_date: new Date().toISOString().split('T')[0]
        })
        .eq('user_id', user.id);
    }

    return new Response(JSON.stringify({
      success: true,
      report: stressReport,
      analysis: aiResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in puzzle-ai-analysis function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});