import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Heart, Star, Sun } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const affirmations = [
  {
    text: "I am worthy of love, happiness, and all good things in life.",
    category: "Self-Love",
    icon: Heart
  },
  {
    text: "I trust in my ability to overcome challenges and grow stronger.",
    category: "Resilience",
    icon: Star
  },
  {
    text: "Today is filled with possibilities and I embrace them with an open heart.",
    category: "Optimism",
    icon: Sun
  },
  {
    text: "I am calm, peaceful, and in control of my thoughts and emotions.",
    category: "Inner Peace",
    icon: Sparkles
  },
  {
    text: "Every breath I take fills me with confidence and clarity.",
    category: "Confidence",
    icon: Star
  },
  {
    text: "I choose to see the beauty and goodness in myself and others.",
    category: "Gratitude",
    icon: Heart
  },
  {
    text: "I am exactly where I need to be on my journey of growth.",
    category: "Acceptance",
    icon: Sun
  },
  {
    text: "My mind is clear, my heart is open, and my spirit is strong.",
    category: "Mindfulness",
    icon: Sparkles
  }
];

export const AffirmationsPage = () => {
  const [currentAffirmation, setCurrentAffirmation] = useState(affirmations[0]);
  const [savedAffirmations, setSavedAffirmations] = useState<typeof affirmations>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Set a random affirmation on page load
    const randomIndex = Math.floor(Math.random() * affirmations.length);
    setCurrentAffirmation(affirmations[randomIndex]);
    
    // Load saved affirmations from localStorage
    const saved = localStorage.getItem('savedAffirmations');
    if (saved) {
      setSavedAffirmations(JSON.parse(saved));
    }
  }, []);

  const getNewAffirmation = () => {
    const randomIndex = Math.floor(Math.random() * affirmations.length);
    setCurrentAffirmation(affirmations[randomIndex]);
  };

  const saveAffirmation = () => {
    const updated = [...savedAffirmations, currentAffirmation];
    setSavedAffirmations(updated);
    localStorage.setItem('savedAffirmations', JSON.stringify(updated));
    
    toast({
      title: "Affirmation saved!",
      description: "Added to your collection for later reflection.",
    });
  };

  const removeSavedAffirmation = (index: number) => {
    const updated = savedAffirmations.filter((_, i) => i !== index);
    setSavedAffirmations(updated);
    localStorage.setItem('savedAffirmations', JSON.stringify(updated));
  };

  const IconComponent = currentAffirmation.icon;

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-gradient-soul">
              Daily Affirmations
            </h1>
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <p className="text-lg text-muted-foreground">
            Start your day with positive thoughts and intentions
          </p>
        </div>

        {/* Current Affirmation Card */}
        <Card className="mb-8 gradient-twilight border-0 text-white shadow-magical">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <IconComponent className="w-8 h-8" />
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {currentAffirmation.category}
              </Badge>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold leading-relaxed">
              {currentAffirmation.text}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={getNewAffirmation}
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                New Affirmation
              </Button>
              <Button
                onClick={saveAffirmation}
                className="bg-white text-primary hover:bg-white/90"
                disabled={savedAffirmations.some(a => a.text === currentAffirmation.text)}
              >
                <Heart className="mr-2 h-4 w-4" />
                {savedAffirmations.some(a => a.text === currentAffirmation.text) ? 'Saved' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Saved Affirmations */}
        {savedAffirmations.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-foreground">
              Your Saved Affirmations
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {savedAffirmations.map((affirmation, index) => {
                const SavedIcon = affirmation.icon;
                return (
                  <Card key={index} className="hover:shadow-gentle transition-gentle">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <SavedIcon className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-2">{affirmation.text}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {affirmation.category}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSavedAffirmation(index)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Tips Section */}
        <Card className="mt-8 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-xl">✨ Affirmation Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium mb-2">🌅 Morning Practice</p>
                <p>Read your affirmations first thing in the morning to set a positive tone for your day.</p>
              </div>
              <div>
                <p className="font-medium mb-2">🔄 Repeat & Believe</p>
                <p>Say each affirmation 3-5 times, focusing on truly believing and feeling the words.</p>
              </div>
              <div>
                <p className="font-medium mb-2">📝 Personalize</p>
                <p>Feel free to modify affirmations to make them more personal and meaningful to you.</p>
              </div>
              <div>
                <p className="font-medium mb-2">💝 Share Positivity</p>
                <p>Share your favorite affirmations with loved ones to spread positive energy.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};