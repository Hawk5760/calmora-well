import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Heart, Star, Lightbulb, Sunset, Coffee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  prompt: string;
  tags: string[];
  timestamp: Date;
}

export const JournalPage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const { toast } = useToast();

  const journalPrompts = [
    {
      id: "gratitude",
      icon: Heart,
      title: "Gratitude Practice",
      prompt: "What are three things you're grateful for today, and why do they matter to you?",
      color: "text-pink-500"
    },
    {
      id: "reflection",
      icon: Star,
      title: "Daily Reflection",
      prompt: "What was the highlight of your day? What would you do differently?",
      color: "text-yellow-500"
    },
    {
      id: "growth",
      icon: Lightbulb,
      title: "Personal Growth",
      prompt: "What did you learn about yourself today? How did you grow as a person?",
      color: "text-blue-500"
    },
    {
      id: "dreams",
      icon: Sunset,
      title: "Dreams & Aspirations",
      prompt: "What dreams are calling to your heart? What steps can you take toward them?",
      color: "text-purple-500"
    },
    {
      id: "present",
      icon: Coffee,
      title: "Present Moment",
      prompt: "Describe this moment in detail. What do you see, hear, feel, and sense around you?",
      color: "text-green-500"
    }
  ];

  const predefinedTags = ["gratitude", "reflection", "growth", "healing", "joy", "anxiety", "love", "peace"];

  const handlePromptSelect = (prompt: any) => {
    setSelectedPrompt(prompt.id);
    setTitle(prompt.title + " - " + new Date().toLocaleDateString());
    setContent(`Prompt: ${prompt.prompt}\n\n`);
  };

  const addTag = (tag: string) => {
    if (tag && !customTags.includes(tag)) {
      setCustomTags([...customTags, tag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCustomTags(customTags.filter(tag => tag !== tagToRemove));
  };

  const handleSaveEntry = () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Please fill in all fields",
        description: "Add a title and some content to save your journal entry.",
        variant: "destructive",
      });
      return;
    }

    const entry: JournalEntry = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      prompt: selectedPrompt,
      tags: customTags,
      timestamp: new Date(),
    };

    // Save to localStorage
    const existingEntries = JSON.parse(localStorage.getItem("journalEntries") || "[]");
    existingEntries.unshift(entry);
    localStorage.setItem("journalEntries", JSON.stringify(existingEntries));

    // Update soul garden stats
    const existingStats = JSON.parse(localStorage.getItem("gardenStats") || "{}");
    const newStats = {
      ...existingStats,
      journalEntries: (existingStats.journalEntries || 0) + 1,
      totalActions: (existingStats.totalActions || 0) + 1,
    };
    localStorage.setItem("gardenStats", JSON.stringify(newStats));

    toast({
      title: "Journal entry saved! 📖",
      description: "Your thoughts are now part of your soul garden's growth.",
    });

    // Reset form
    setTitle("");
    setContent("");
    setSelectedPrompt("");
    setCustomTags([]);
  };

  const selectedPromptData = journalPrompts.find(p => p.id === selectedPrompt);

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-gradient-soul">
            Guided Journaling
          </h1>
          <p className="text-xl text-muted-foreground">
            Explore your inner world through mindful writing
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Journal Prompts */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50 shadow-soft">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Choose a Prompt
              </h3>
              
              <div className="space-y-3">
                {journalPrompts.map((prompt) => {
                  const Icon = prompt.icon;
                  const isSelected = selectedPrompt === prompt.id;
                  
                  return (
                    <button
                      key={prompt.id}
                      onClick={() => handlePromptSelect(prompt)}
                      className={`w-full text-left p-4 rounded-xl transition-gentle hover:scale-105 ${
                        isSelected
                          ? "bg-primary/20 shadow-glow border-2 border-primary/30"
                          : "bg-muted/50 hover:bg-muted border-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-1 ${prompt.color}`} />
                        <div>
                          <h4 className="font-medium text-foreground mb-1">
                            {prompt.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {prompt.prompt}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={() => {
                  setSelectedPrompt("");
                  setTitle("Free Writing - " + new Date().toLocaleDateString());
                  setContent("");
                }}
                variant="outline"
                className="w-full mt-4"
              >
                Free Writing
              </Button>
            </Card>
          </div>

          {/* Journal Editor */}
          <div className="lg:col-span-2">
            <Card className="p-8 bg-card/80 backdrop-blur-sm border-border/50 shadow-soft">
              {selectedPromptData && (
                <div className="mb-6 p-4 bg-primary/10 rounded-xl">
                  <Badge variant="secondary" className="mb-2">
                    Current prompt: {selectedPromptData.title}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {selectedPromptData.prompt}
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Entry Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your entry a meaningful title..."
                    className="bg-background/50 border-border/50 focus:border-primary"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Your Thoughts
                  </label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Let your thoughts flow freely..."
                    className="bg-background/50 border-border/50 focus:border-primary min-h-64"
                    rows={12}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tags
                  </label>
                  
                  {/* Predefined Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {predefinedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={customTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer transition-gentle hover:scale-105"
                        onClick={() => {
                          if (customTags.includes(tag)) {
                            removeTag(tag);
                          } else {
                            addTag(tag);
                          }
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Custom Tag Input */}
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add custom tag..."
                      className="bg-background/50 border-border/50 focus:border-primary"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag(newTag);
                        }
                      }}
                    />
                    <Button
                      onClick={() => addTag(newTag)}
                      variant="outline"
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>

                  {/* Selected Tags */}
                  {customTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {customTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <Button 
                  onClick={handleSaveEntry}
                  variant="soul" 
                  size="lg" 
                  className="w-full"
                >
                  Save Entry 📖
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};