import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Wind, Play, Pause, RotateCcw, Heart, Brain, Moon, Focus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BreathingSession {
  id: string;
  type: string;
  duration: number;
  timestamp: Date;
}

export const MindfulnessPage = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<"inhale" | "hold" | "exhale" | "pause">("inhale");
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessionDuration, setSessionDuration] = useState([5]);
  const [selectedPattern, setSelectedPattern] = useState("calm");
  const [completedMinutes, setCompletedMinutes] = useState(0);
  const { toast } = useToast();

  const breathingPatterns = [
    {
      id: "calm",
      name: "Calm Breathing",
      icon: Wind,
      description: "4-4-4-4 pattern for general relaxation",
      pattern: { inhale: 4, hold: 4, exhale: 4, pause: 4 },
      color: "text-blue-500"
    },
    {
      id: "stress",
      name: "Stress Relief",
      icon: Heart,
      description: "4-7-8 pattern to reduce anxiety",
      pattern: { inhale: 4, hold: 7, exhale: 8, pause: 2 },
      color: "text-green-500"
    },
    {
      id: "focus",
      name: "Focus Enhancement",
      icon: Brain,
      description: "6-2-6-2 pattern for concentration",
      pattern: { inhale: 6, hold: 2, exhale: 6, pause: 2 },
      color: "text-purple-500"
    },
    {
      id: "sleep",
      name: "Sleep Preparation",
      icon: Moon,
      description: "4-4-6-2 pattern for better sleep",
      pattern: { inhale: 4, hold: 4, exhale: 6, pause: 2 },
      color: "text-indigo-500"
    }
  ];

  const selectedPatternData = breathingPatterns.find(p => p.id === selectedPattern)!;

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
        
        // Update breathing phase based on pattern
        const pattern = selectedPatternData.pattern;
        const cycleTime = pattern.inhale + pattern.hold + pattern.exhale + pattern.pause;
        const currentCyclePosition = (sessionDuration[0] * 60 - timeLeft) % cycleTime;
        
        if (currentCyclePosition < pattern.inhale) {
          setCurrentPhase("inhale");
        } else if (currentCyclePosition < pattern.inhale + pattern.hold) {
          setCurrentPhase("hold");
        } else if (currentCyclePosition < pattern.inhale + pattern.hold + pattern.exhale) {
          setCurrentPhase("exhale");
        } else {
          setCurrentPhase("pause");
        }
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleSessionComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, selectedPatternData, sessionDuration]);

  const startSession = () => {
    setTimeLeft(sessionDuration[0] * 60);
    setIsActive(true);
    setCurrentPhase("inhale");
    setCompletedMinutes(0);
    
    toast({
      title: "Breathing session started",
      description: `${sessionDuration[0]} minutes of ${selectedPatternData.name}`,
    });
  };

  const pauseSession = () => {
    setIsActive(false);
  };

  const resumeSession = () => {
    setIsActive(true);
  };

  const stopSession = () => {
    setIsActive(false);
    setTimeLeft(0);
    setCurrentPhase("inhale");
  };

  const handleSessionComplete = () => {
    setIsActive(false);
    const minutes = sessionDuration[0];
    setCompletedMinutes(prev => prev + minutes);

    // Save session
    const session: BreathingSession = {
      id: Date.now().toString(),
      type: selectedPattern,
      duration: minutes,
      timestamp: new Date(),
    };

    const existingSessions = JSON.parse(localStorage.getItem("breathingSessions") || "[]");
    existingSessions.push(session);
    localStorage.setItem("breathingSessions", JSON.stringify(existingSessions));

    // Update soul garden stats
    const existingStats = JSON.parse(localStorage.getItem("gardenStats") || "{}");
    const newStats = {
      ...existingStats,
      mindfulMinutes: (existingStats.mindfulMinutes || 0) + minutes,
      totalActions: (existingStats.totalActions || 0) + 1,
    };
    localStorage.setItem("gardenStats", JSON.stringify(newStats));

    toast({
      title: "Session complete! 🧘‍♀️",
      description: `You've completed ${minutes} minutes of mindful breathing.`,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseInstruction = () => {
    const instructions = {
      inhale: "Breathe in slowly...",
      hold: "Hold your breath...",
      exhale: "Breathe out gently...",
      pause: "Rest and pause..."
    };
    return instructions[currentPhase];
  };

  const getBreathingCircleScale = () => {
    const scales = {
      inhale: "scale-110",
      hold: "scale-110",
      exhale: "scale-90",
      pause: "scale-90"
    };
    return scales[currentPhase];
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-gradient-soul">
            Mindfulness & Breathing
          </h1>
          <p className="text-xl text-muted-foreground">
            Find your center through guided breathing exercises
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Breathing Patterns */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50 shadow-soft">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Wind className="w-5 h-5" />
                Breathing Patterns
              </h3>
              
              <div className="space-y-3">
                {breathingPatterns.map((pattern) => {
                  const Icon = pattern.icon;
                  const isSelected = selectedPattern === pattern.id;
                  
                  return (
                    <button
                      key={pattern.id}
                      onClick={() => setSelectedPattern(pattern.id)}
                      disabled={isActive}
                      className={`w-full text-left p-4 rounded-xl transition-gentle hover:scale-105 ${
                        isSelected
                          ? "bg-primary/20 shadow-glow border-2 border-primary/30"
                          : "bg-muted/50 hover:bg-muted border-2 border-transparent"
                      } ${isActive ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-1 ${pattern.color}`} />
                        <div>
                          <h4 className="font-medium text-foreground mb-1">
                            {pattern.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {pattern.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Session Settings */}
            <Card className="p-6 mt-6 bg-card/80 backdrop-blur-sm border-border/50 shadow-soft">
              <h3 className="text-lg font-semibold mb-4">Session Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Duration: {sessionDuration[0]} minutes
                  </label>
                  <Slider
                    value={sessionDuration}
                    onValueChange={setSessionDuration}
                    max={30}
                    min={1}
                    step={1}
                    disabled={isActive}
                    className="w-full"
                  />
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Pattern: {selectedPatternData.pattern.inhale}-{selectedPatternData.pattern.hold}-{selectedPatternData.pattern.exhale}-{selectedPatternData.pattern.pause}
                </div>
              </div>
            </Card>
          </div>

          {/* Breathing Visualization */}
          <div className="lg:col-span-2">
            <Card className="p-8 bg-card/80 backdrop-blur-sm border-border/50 shadow-soft">
              <div className="text-center">
                {/* Breathing Circle */}
                <div className="flex justify-center mb-8">
                  <div className={`w-48 h-48 rounded-full bg-gradient-soul transition-transform duration-1000 ease-in-out flex items-center justify-center ${getBreathingCircleScale()}`}>
                    <div className="w-32 h-32 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
                      <Wind className="w-12 h-12 text-background" />
                    </div>
                  </div>
                </div>

                {/* Current Phase */}
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold text-foreground mb-2">
                    {getPhaseInstruction()}
                  </h3>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)}
                  </Badge>
                </div>

                {/* Time Display */}
                <div className="mb-8">
                  <div className="text-4xl font-bold text-gradient-soul mb-2">
                    {formatTime(timeLeft)}
                  </div>
                  <p className="text-muted-foreground">
                    {timeLeft > 0 ? "Time remaining" : "Ready to start"}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4">
                  {!isActive && timeLeft === 0 && (
                    <Button
                      onClick={startSession}
                      variant="soul"
                      size="lg"
                      className="flex items-center gap-2"
                    >
                      <Play className="w-5 h-5" />
                      Start Session
                    </Button>
                  )}
                  
                  {isActive && (
                    <Button
                      onClick={pauseSession}
                      variant="outline"
                      size="lg"
                      className="flex items-center gap-2"
                    >
                      <Pause className="w-5 h-5" />
                      Pause
                    </Button>
                  )}
                  
                  {!isActive && timeLeft > 0 && (
                    <Button
                      onClick={resumeSession}
                      variant="soul"
                      size="lg"
                      className="flex items-center gap-2"
                    >
                      <Play className="w-5 h-5" />
                      Resume
                    </Button>
                  )}
                  
                  {timeLeft > 0 && (
                    <Button
                      onClick={stopSession}
                      variant="destructive"
                      size="lg"
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Stop
                    </Button>
                  )}
                </div>

                {/* Session Stats */}
                {completedMinutes > 0 && (
                  <div className="mt-8 p-4 bg-primary/10 rounded-xl">
                    <p className="text-foreground">
                      Minutes completed today: <span className="font-semibold">{completedMinutes}</span>
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};