import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Brain, TrendingUp, Award, Shuffle, Lightbulb, Clock, Target } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface WordPuzzle {
  word: string;
  scrambled: string;
  hint: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

interface StressReport {
  stress_level: string;
  weekly_score: number;
  coping_tip: string;
  ai_analysis: string;
  badges: string[];
}

interface GameStats {
  current_streak: number;
  max_streak: number;
  total_puzzles_solved: number;
  average_solve_time: number;
}

const puzzleWords: WordPuzzle[] = [
  { word: "CALM", scrambled: "MALC", hint: "Peaceful state of mind", difficulty: 'easy', category: "mindfulness" },
  { word: "PEACE", scrambled: "EACEP", hint: "Inner tranquility", difficulty: 'easy', category: "mindfulness" },
  { word: "SMILE", scrambled: "ESMIL", hint: "Expression of joy", difficulty: 'easy', category: "positivity" },
  { word: "PAUSE", scrambled: "ESAUP", hint: "Take a moment to stop", difficulty: 'easy', category: "mindfulness" },
  { word: "RELAX", scrambled: "XALER", hint: "To unwind and rest", difficulty: 'medium', category: "wellness" },
  { word: "BREATHE", scrambled: "HTEEARB", hint: "Essential for mindfulness", difficulty: 'medium', category: "mindfulness" },
  { word: "FOCUS", scrambled: "SUCOF", hint: "Concentrate attention", difficulty: 'medium', category: "mindfulness" },
  { word: "BALANCE", scrambled: "ECNALAB", hint: "Harmony in life", difficulty: 'medium', category: "wellness" },
  { word: "GRATITUDE", scrambled: "TUDITEGAR", hint: "Thankful appreciation", difficulty: 'hard', category: "positivity" },
  { word: "MEDITATION", scrambled: "NOITATIDEM", hint: "Mindful practice", difficulty: 'hard', category: "mindfulness" },
  { word: "SERENITY", scrambled: "YTINERES", hint: "Peaceful calmness", difficulty: 'hard', category: "wellness" },
  { word: "MINDFULNESS", scrambled: "SSENLUFDNIM", hint: "Present moment awareness", difficulty: 'hard', category: "mindfulness" }
];

const achievements = [
  { id: 'first_solve', name: 'First Puzzle', description: 'Solved your first puzzle', icon: '🎯' },
  { id: 'quick_thinker', name: 'Quick Thinker', description: 'Solved puzzle in under 30 seconds', icon: '⚡' },
  { id: 'mindful_solver', name: 'Mindful Solver', description: 'Completed mindfulness category', icon: '🧘' },
  { id: 'consistent_player', name: 'Consistent Player', description: '7-day streak achieved', icon: '📅' },
  { id: 'stress_manager', name: 'Stress Manager', description: 'Maintained low stress levels', icon: '🌟' }
];

export const WordPuzzleGame = () => {
  const { user } = useAuth();
  const [currentPuzzle, setCurrentPuzzle] = useState<WordPuzzle | null>(null);
  const [userInput, setUserInput] = useState("");
  const [gameStats, setGameStats] = useState<GameStats>({ current_streak: 0, max_streak: 0, total_puzzles_solved: 0, average_solve_time: 0 });
  const [showReport, setShowReport] = useState(false);
  const [stressReport, setStressReport] = useState<StressReport | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [attempts, setAttempts] = useState(0);
  const [gameSessionId, setGameSessionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && gameStarted) {
      loadGameStats();
      generateNewPuzzle();
    }
  }, [user, gameStarted]);

  const loadGameStats = async () => {
    if (!user) return;

    try {
      // Get or create user game stats
      let { data: stats, error } = await supabase
        .from('user_game_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Create stats if they don't exist
        const { data: newStats, error: createError } = await supabase
          .from('user_game_stats')
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (!createError && newStats) {
          stats = newStats;
        }
      }

      if (stats) {
        setGameStats(stats);
      }
    } catch (error) {
      console.error('Error loading game stats:', error);
    }
  };

  const generateNewPuzzle = () => {
    // Adaptive difficulty based on performance
    const availablePuzzles = puzzleWords.filter(p => {
      if (gameStats.total_puzzles_solved < 3) return p.difficulty === 'easy';
      if (gameStats.total_puzzles_solved < 8) return p.difficulty !== 'hard';
      return true;
    });
    
    const randomPuzzle = availablePuzzles[Math.floor(Math.random() * availablePuzzles.length)];
    setCurrentPuzzle(randomPuzzle);
    setUserInput("");
    setAttempts(0);
    setStartTime(Date.now());
  };

  const scrambleWord = (word: string) => {
    const letters = word.split('');
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters.join('');
  };

  const checkAnswer = async () => {
    if (!currentPuzzle || !user) return;
    
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    
    if (userInput.toUpperCase() === currentPuzzle.word) {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      
      try {
        setIsLoading(true);
        
        // Create game session record
        const { data: session, error: sessionError } = await supabase
          .from('game_sessions')
          .insert({
            user_id: user.id,
            puzzle_word: currentPuzzle.word,
            difficulty: currentPuzzle.difficulty,
            category: currentPuzzle.category,
            time_taken: timeTaken,
            attempts: newAttempts,
            solved: true
          })
          .select()
          .single();

        if (sessionError) {
          console.error('Error creating session:', sessionError);
        } else if (session) {
          setGameSessionId(session.id);
        }

        // Call AI analysis function
        const { data, error } = await supabase.functions.invoke('puzzle-ai-analysis', {
          body: {
            gameSessionId: session?.id,
            timeTaken,
            attempts: newAttempts,
            difficulty: currentPuzzle.difficulty,
            category: currentPuzzle.category
          }
        });

        if (error) {
          console.error('AI analysis error:', error);
          toast.error("Analysis failed, but puzzle solved!");
        } else if (data?.report) {
          setStressReport(data.report);
          
          // Check for new achievements
          if (data.analysis?.suggestedBadges) {
            await checkAndUnlockAchievements(data.analysis.suggestedBadges, timeTaken, newAttempts);
          }
          
          toast.success("Puzzle Solved!", {
            description: `Great job! The word was "${currentPuzzle.word}"`
          });
          
          // Show progress report after a delay
          setTimeout(() => {
            setShowReport(true);
          }, 1500);
        }

        // Reload stats
        await loadGameStats();
        
      } catch (error) {
        console.error('Error processing answer:', error);
        toast.error("Something went wrong, please try again");
      } finally {
        setIsLoading(false);
      }
      
    } else {
      toast.error("Not quite right", {
        description: "Try again! Check the hint for guidance."
      });
    }
  };

  const checkAndUnlockAchievements = async (suggestedBadges: string[], timeTaken: number, attempts: number) => {
    if (!user) return;

    const newAchievements = [];
    
    // Check for specific achievements
    if (gameStats.total_puzzles_solved === 0) {
      newAchievements.push(achievements.find(a => a.id === 'first_solve'));
    }
    
    if (timeTaken < 30 && attempts === 1) {
      newAchievements.push(achievements.find(a => a.id === 'quick_thinker'));
    }
    
    if (gameStats.current_streak >= 7) {
      newAchievements.push(achievements.find(a => a.id === 'consistent_player'));
    }

    for (const achievement of newAchievements.filter(Boolean)) {
      try {
        await supabase
          .from('user_achievements')
          .insert({
            user_id: user.id,
            achievement_id: achievement!.id,
            achievement_name: achievement!.name,
            achievement_description: achievement!.description,
            achievement_icon: achievement!.icon
          });
        
        toast.success("Achievement Unlocked!", {
          description: `${achievement!.icon} ${achievement!.name}`
        });
      } catch (error) {
        // Achievement might already exist
        console.log('Achievement already unlocked:', achievement!.id);
      }
    }
  };

  const continueGame = () => {
    setShowReport(false);
    generateNewPuzzle();
  };

  const startGame = () => {
    setGameStarted(true);
  };

  const resetGame = () => {
    setGameStarted(false);
    setCurrentPuzzle(null);
    setShowReport(false);
    setUserInput("");
    setStressReport(null);
  };

  const getStressColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-gradient-soul">
              Calmora Mind Puzzle
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Solve word puzzles to unlock personalized mental wellness insights
            </p>
            
            <Card className="mb-8 bg-gradient-to-br from-primary/5 to-soul/5">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <Brain className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <h3 className="font-semibold mb-2">Mental Wellness Words</h3>
                    <p className="text-sm text-muted-foreground">Puzzles featuring mindfulness, positivity, and coping skills</p>
                  </div>
                  <div>
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-soul" />
                    <h3 className="font-semibold mb-2">AI-Powered Analysis</h3>
                    <p className="text-sm text-muted-foreground">Get personalized stress reports and wellness insights</p>
                  </div>
                  <div>
                    <Award className="w-12 h-12 mx-auto mb-4 text-accent" />
                    <h3 className="font-semibold mb-2">Achievement System</h3>
                    <p className="text-sm text-muted-foreground">Earn badges and celebrate your progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {gameStats.total_puzzles_solved > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{gameStats.total_puzzles_solved}</div>
                  <div className="text-sm text-muted-foreground">Solved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-soul">{gameStats.current_streak}</div>
                  <div className="text-sm text-muted-foreground">Current Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{gameStats.max_streak}</div>
                  <div className="text-sm text-muted-foreground">Best Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{Math.round(gameStats.average_solve_time)}s</div>
                  <div className="text-sm text-muted-foreground">Avg Time</div>
                </div>
              </div>
            )}
            
            <Button onClick={startGame} size="lg" className="text-lg px-8">
              <Brain className="w-5 h-5 mr-2" />
              {gameStats.total_puzzles_solved > 0 ? 'Continue Playing' : 'Start Playing'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showReport && stressReport) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h1 className="text-3xl font-bold mb-4">Puzzle Complete!</h1>
            <p className="text-muted-foreground">Here's your personalized wellness report</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Stress Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className={`text-4xl font-bold ${getStressColor(stressReport.stress_level)}`}>
                    {stressReport.stress_level.toUpperCase()}
                  </div>
                  <Progress 
                    value={stressReport.stress_level === 'low' ? 25 : stressReport.stress_level === 'moderate' ? 60 : 85} 
                    className="mt-4" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Weekly Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold">{stressReport.weekly_score}%</div>
                  <p className="text-sm text-muted-foreground">Wellness score this week</p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Streak: {gameStats.current_streak} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Personalized Coping Tip
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg mb-4">{stressReport.coping_tip}</p>
              {stressReport.ai_analysis && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground font-medium mb-2">AI Wellness Insight:</p>
                  <p className="text-sm">{stressReport.ai_analysis}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {stressReport.badges && stressReport.badges.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Achievement Solver
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {stressReport.badges.map(badgeId => {
                    const achievement = achievements.find(a => a.id === badgeId);
                    return achievement ? (
                      <Badge key={badgeId} variant="secondary" className="text-sm">
                        {achievement.icon} {achievement.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-center space-x-4">
            <Button onClick={continueGame} size="lg" disabled={isLoading}>
              Continue Playing
            </Button>
            <Button onClick={resetGame} variant="outline" size="lg">
              New Game
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{gameStats.total_puzzles_solved}</div>
              <div className="text-sm text-muted-foreground">Solved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-soul">{gameStats.current_streak}</div>
              <div className="text-sm text-muted-foreground">Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{attempts}</div>
              <div className="text-sm text-muted-foreground">Attempts</div>
            </div>
          </div>
        </div>

        <Card className="mb-8 bg-gradient-to-br from-primary/5 to-soul/5">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Unscramble the Word
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {currentPuzzle && (
              <>
                <div className="mb-6">
                  <Badge variant="secondary" className="mb-4">
                    {currentPuzzle.category} • {currentPuzzle.difficulty}
                  </Badge>
                  <div className="text-4xl font-mono font-bold tracking-widest mb-4 text-primary">
                    {currentPuzzle.scrambled}
                  </div>
                  <p className="text-lg text-muted-foreground">
                    💡 {currentPuzzle.hint}
                  </p>
                </div>

                <div className="max-w-md mx-auto space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value.toUpperCase())}
                      placeholder="Your answer..."
                      className="flex-1 px-4 py-2 border rounded-lg text-center text-lg font-semibold tracking-wide"
                      onKeyPress={(e) => e.key === 'Enter' && !isLoading && checkAnswer()}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={checkAnswer} size="lg" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Target className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        'Submit Answer'
                      )}
                    </Button>
                    <Button
                      onClick={() => setCurrentPuzzle(prev => prev ? {...prev, scrambled: scrambleWord(prev.word)} : null)}
                      variant="outline"
                      size="lg"
                      disabled={isLoading}
                    >
                      <Shuffle className="w-4 h-4 mr-2" />
                      Reshuffle
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button onClick={resetGame} variant="ghost" disabled={isLoading}>
            End Game
          </Button>
        </div>
      </div>
    </div>
  );
};