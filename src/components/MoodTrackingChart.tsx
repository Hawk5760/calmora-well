import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";

interface MoodEntry {
  mood: string;
  note: string;
  timestamp: Date;
}

interface MoodTrackingChartProps {
  moodEntries: MoodEntry[];
}

export const MoodTrackingChart = ({ moodEntries }: MoodTrackingChartProps) => {
  const chartData = useMemo(() => {
    // Convert mood entries to chart data
    const moodValues: { [key: string]: number } = {
      happy: 5,
      joyful: 5,
      peaceful: 4,
      calm: 4,
      content: 4,
      motivated: 4,
      okay: 3,
      neutral: 3,
      sad: 2,
      anxious: 2,
      angry: 1,
      frustrated: 1,
      overwhelmed: 1
    };

    // Group entries by date
    const groupedByDate = moodEntries.reduce((acc, entry) => {
      const date = entry.timestamp.toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(entry);
      return acc;
    }, {} as Record<string, MoodEntry[]>);

    // Calculate average mood per day
    const chartData = Object.entries(groupedByDate)
      .map(([date, entries]) => {
        const avgMood = entries.reduce((sum, entry) => {
          return sum + (moodValues[entry.mood.toLowerCase()] || 3);
        }, 0) / entries.length;
        
        return {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          mood: Math.round(avgMood * 10) / 10, // Round to 1 decimal
          entries: entries.length,
          fullDate: date
        };
      })
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
      .slice(-7); // Last 7 days

    return chartData;
  }, [moodEntries]);

  const moodDistribution = useMemo(() => {
    const distribution = moodEntries.reduce((acc, entry) => {
      const mood = entry.mood.toLowerCase();
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution)
      .map(([mood, count]) => ({
        mood: mood.charAt(0).toUpperCase() + mood.slice(1),
        count,
        percentage: Math.round((count / moodEntries.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }, [moodEntries]);

  const getMoodTrend = () => {
    if (chartData.length < 2) return 'stable';
    
    const recent = chartData.slice(-3);
    const avgRecent = recent.reduce((sum, day) => sum + day.mood, 0) / recent.length;
    
    if (avgRecent > 3.5) return 'improving';
    if (avgRecent < 2.5) return 'declining';
    return 'stable';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const trend = getMoodTrend();

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`Date: ${label}`}</p>
          <p className="text-primary">
            {`Mood: ${payload[0].value}/5.0`}
          </p>
        </div>
      );
    }
    return null;
  };

  const customBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-primary">
            {`${data.count} entries (${data.percentage}%)`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Mood Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Mood Trend (Last 7 Days)
          </CardTitle>
          <CardDescription>
            Track your emotional well-being over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <>
              <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Trend:</span>
                  <div className={`flex items-center gap-2 font-medium ${getTrendColor(trend)}`}>
                    <span>{getTrendIcon(trend)}</span>
                    <span className="capitalize">{trend}</span>
                  </div>
                </div>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      domain={[1, 5]} 
                      className="text-xs" 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={customTooltip} />
                    <Line 
                      type="monotone" 
                      dataKey="mood" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No mood data yet</p>
                <p className="text-sm">Start tracking your mood to see trends</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mood Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Mood Distribution
          </CardTitle>
          <CardDescription>
            Breakdown of your emotional states
          </CardDescription>
        </CardHeader>
        <CardContent>
          {moodDistribution.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moodDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="mood" 
                    className="text-xs" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-xs" 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={customBarTooltip} />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No mood data yet</p>
                <p className="text-sm">Track your mood to see distribution</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};