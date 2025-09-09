import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Leaf, Flower, TreePine, Sparkles, Calendar, TrendingUp, Clock, BookOpen, Heart } from "lucide-react";

interface GardenStats {
  totalActions: number;
  moodEntries: number;
  journalEntries: number;
  mindfulMinutes: number;
  level: number;
}

interface HistoryEntry {
  date: string;
  type: 'mood' | 'journal' | 'mindfulness';
  title: string;
  description: string;
  icon: any;
}

export const SoulGarden = () => {
  const [stats, setStats] = useState<GardenStats>({
    totalActions: 0,
    moodEntries: 0,
    journalEntries: 0,
    mindfulMinutes: 0,
    level: 1,
  });
  const [growthHistory, setGrowthHistory] = useState<HistoryEntry[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    // Load stats from localStorage
    const moodEntries = JSON.parse(localStorage.getItem("moodEntries") || "[]");
    const journalEntries = JSON.parse(localStorage.getItem("journalEntries") || "[]");
    const mindfulMinutes = parseInt(localStorage.getItem("mindfulMinutes") || "0");
    
    const totalActions = moodEntries.length + journalEntries.length + Math.floor(mindfulMinutes / 5);
    const level = Math.floor(totalActions / 5) + 1;

    setStats({
      totalActions,
      moodEntries: moodEntries.length,
      journalEntries: journalEntries.length,
      mindfulMinutes,
      level,
    });

    // Build growth history
    const history: HistoryEntry[] = [];
    
    // Add mood entries to history
    moodEntries.forEach((entry: any) => {
      history.push({
        date: entry.timestamp || new Date().toISOString(),
        type: 'mood',
        title: `Mood Check-in: ${entry.mood}`,
        description: entry.note || entry.aiResponse || 'Checked in with your emotional state',
        icon: Heart
      });
    });

    // Add journal entries to history
    journalEntries.forEach((entry: any) => {
      history.push({
        date: entry.timestamp || new Date().toISOString(),
        type: 'journal',
        title: entry.title || 'Journal Entry',
        description: entry.content ? entry.content.substring(0, 100) + '...' : 'Reflected on your thoughts and experiences',
        icon: BookOpen
      });
    });

    // Add mindfulness sessions (simulate some entries)
    if (mindfulMinutes > 0) {
      const sessions = Math.floor(mindfulMinutes / 5);
      for (let i = 0; i < sessions; i++) {
        const sessionDate = new Date();
        sessionDate.setDate(sessionDate.getDate() - i);
        history.push({
          date: sessionDate.toISOString(),
          type: 'mindfulness',
          title: 'Mindfulness Session',
          description: `Completed a 5-minute breathing exercise`,
          icon: Clock
        });
      }
    }

    // Sort by date (newest first)
    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setGrowthHistory(history);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'mood': return 'bg-primary/10 text-primary';
      case 'journal': return 'bg-secondary/10 text-secondary';
      case 'mindfulness': return 'bg-accent/10 text-accent';
      default: return 'bg-muted/10 text-muted-foreground';
    }
  };

  const getGardenElements = () => {
    const elements = [];
    const { level, totalActions } = stats;

    // Base elements always present
    elements.push(
      <div key="base" className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="w-16 h-8 bg-primary/20 rounded-full" />
      </div>
    );

    // Level-based plants
    if (level >= 1) {
      elements.push(
        <Leaf key="leaf1" className="absolute bottom-12 left-1/3 w-6 h-6 text-primary animate-pulse" />
      );
    }
    
    if (level >= 2) {
      elements.push(
        <Flower key="flower1" className="absolute bottom-14 right-1/3 w-7 h-7 text-accent float" />
      );
    }
    
    if (level >= 3) {
      elements.push(
        <TreePine key="tree1" className="absolute bottom-16 left-1/4 w-8 h-8 text-primary grow" />
      );
    }
    
    if (level >= 5) {
      elements.push(
        <Sparkles key="sparkle1" className="absolute top-8 left-1/2 w-5 h-5 text-secondary animate-pulse" />
      );
    }

    // Action-based decorations
    if (totalActions >= 10) {
      elements.push(
        <div key="garden-path" className="absolute bottom-8 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      );
    }

    return elements;
  };

  return (
    <Card className="p-8 bg-card/80 backdrop-blur-sm border-border/50 shadow-soft">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-3 text-foreground">
          Your Soul Garden
        </h2>
        <p className="text-muted-foreground">
          Level {stats.level} • {stats.totalActions} mindful actions taken
        </p>
      </div>

      {/* Garden Visualization */}
      <div className="relative h-48 mb-8 bg-gradient-to-b from-sky-200/20 to-green-200/20 rounded-2xl overflow-hidden border border-border/30">
        {/* Sky background */}
        <div className="absolute inset-0 gradient-calm opacity-50" />
        
        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-green-300/30 to-transparent" />
        
        {/* Garden Elements */}
        {getGardenElements()}
        
        {/* Motivational message for empty garden */}
        {stats.totalActions === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Leaf className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                Your garden is waiting to bloom...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-primary/10 rounded-xl">
          <div className="text-2xl font-bold text-primary">{stats.moodEntries}</div>
          <div className="text-xs text-muted-foreground">Mood Check-ins</div>
        </div>
        <div className="text-center p-4 bg-secondary/10 rounded-xl">
          <div className="text-2xl font-bold text-secondary">{stats.journalEntries}</div>
          <div className="text-xs text-muted-foreground">Journal Entries</div>
        </div>
        <div className="text-center p-4 bg-accent/10 rounded-xl">
          <div className="text-2xl font-bold text-accent">{stats.mindfulMinutes}</div>
          <div className="text-xs text-muted-foreground">Mindful Minutes</div>
        </div>
        <div className="text-center p-4 bg-primary-glow/10 rounded-xl">
          <div className="text-2xl font-bold text-primary-glow">{stats.level}</div>
          <div className="text-xs text-muted-foreground">Garden Level</div>
        </div>
      </div>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="hover:bg-primary/10">
            <TrendingUp className="w-4 h-4 mr-2" />
            View Growth History
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Your Growth Journey
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-1 mt-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-primary/5 rounded-lg">
                <div className="text-lg font-semibold text-primary">{stats.totalActions}</div>
                <div className="text-xs text-muted-foreground">Total Actions</div>
              </div>
              <div className="text-center p-3 bg-secondary/5 rounded-lg">
                <div className="text-lg font-semibold text-secondary">{stats.level}</div>
                <div className="text-xs text-muted-foreground">Current Level</div>
              </div>
              <div className="text-center p-3 bg-accent/5 rounded-lg">
                <div className="text-lg font-semibold text-accent">{growthHistory.length}</div>
                <div className="text-xs text-muted-foreground">Activities</div>
              </div>
            </div>

            <Separator />

            {/* Growth History Timeline */}
            <div className="space-y-4 mt-6">
              {growthHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Leaf className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No growth history yet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Start your journey by checking your mood, writing in your journal, or practicing mindfulness!
                  </p>
                </div>
              ) : (
                growthHistory.map((entry, index) => {
                  const Icon = entry.icon;
                  return (
                    <div key={index} className="flex gap-4 p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors">
                      <div className={`p-2 rounded-full ${getTypeColor(entry.type)}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground text-sm">{entry.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {entry.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="secondary" className="text-xs capitalize">
                              {entry.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(entry.date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};