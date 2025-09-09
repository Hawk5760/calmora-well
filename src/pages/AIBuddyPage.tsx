import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, MessageCircle, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  mood?: string;
  timestamp: number;
}

const quickPrompts = [
  "I failed my exam and feel terrible",
  "I can't sleep, my mind is racing",
  "Feeling peaceful and grateful today",
  "I'm so angry after that argument",
  "I feel lonely even around people",
];

const useSEO = (title: string, description: string, canonicalPath = "/chat") => {
  useEffect(() => {
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", description);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = description;
      document.head.appendChild(m);
    }

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + canonicalPath;
  }, [title, description, canonicalPath]);
};

// Lightweight mood detection (aligned with MoodPage keywords)
const detectMood = (text: string): string => {
  const t = text.toLowerCase();
  const lists: Record<string, string[]> = {
    happy: [
      "happy","peaceful","joyful","excited","truly content","carefree","cheerful","relaxed","smiling from within","heart full","feeling blessed","chilled out","thankful","grateful","fulfilled","in love with life","warm inside","celebrating","family love","light-hearted","calm and content","soulful","energetic","inspired","positive","faithful","peace in the heart","proud of self","motivated","festival feeling","romantic","flirty fun","adventurous","colorful inside","full of hope","enjoying company","bubbly","singing mood","playful","connected","feeling loved","achieved","overflowing with love","sweetly emotional","spiritually light","mentally clear","inner glow","lively","in the moment","smile-worthy"
    ],
    sad: [
      "sad","low","tired emotionally","feeling left out","lonely","quietly hurting","downhearted","mentally drained","dull inside","feeling empty","missing someone","broken inside","helpless","disappointed","regretful","guilty","mentally weak","crying silently","numb feeling","quiet sadness","mentally foggy","isolated","shy and withdrawn","homesick","ashamed","disconnected","overthinking","silent tears","grieving","emotionally cold","unseen","missing home","hurt by someone","feel like quitting","rejected","let down","tired of life","feel like a burden","not enough","unheard","emotionally tired","alone in a crowd","burnt out","quiet inside","closed off","empty-hearted","feeling ignored","emotionally distant","wanting peace","no motivation","failed","exam","didn't pass","fail"
    ],
    angry: [
      "angry","irritated","frustrated","tense","short-tempered","mentally overloaded","snappy","mood swings","on edge","tired of explaining","disrespected","lost patience","pushed too far","dominated","want to shout","misunderstood","feeling insulted","boiling inside","exhausted and angry","judged","annoyed by people","criticized","resentful","jealous","hurt but angry","holding a grudge","emotionally blocked","can't express","rage inside","controlled anger","want to be left alone","passive-aggressive","blaming others","confused + angry","fed up","want to fight","backstabbed","family pressure","relationship stress","feeling trapped","disappointed in self","broken trust","revengeful","heavy heart + anger","taken for granted","shouting mood","emotionally unstable","criticism hurt me","head bursting"
    ],
    calm: [
      "calm","peaceful","emotionally still","mindful","just observing","reflective","blank","detached","balanced","mentally quiet","grounded","silent","in thought","resting mode","feeling empty (neutral)","spiritually centered","not feeling much","bored but fine","still like a lake","watching life","no strong emotion","settled","deep in thought","plain mood","low-key","feeling nothing","meh mood","accepting what is","inward focused","quietly existing","emotionally tired but stable","peacefully alone","thoughtful","daydreaming","calm yet alert","spacey","breathing slow","just being","easy-going","steady mind","no expectations","internal peace","inner silence","mild emotions","light-hearted neutrality","taking a break","relaxed body","safe and okay","mentally coasting","simply present"
    ]
  };
  const scores: Record<string, number> = { happy: 0, sad: 0, angry: 0, calm: 0 };
  Object.entries(lists).forEach(([mood, kws]) => {
    kws.forEach(k => { if (t.includes(k)) scores[mood] += k.split(" ").length >= 2 ? 2 : 1; });
  });
  const top = Object.entries(scores).sort((a,b)=>b[1]-a[1])[0];
  return top[1] > 0 ? top[0] : "calm";
};

const respondForMood = (mood: string, userText: string): string => {
  const map: Record<string, string[]> = {
    happy: [
      "Your joy is shining through! Keep savoring this beautiful energy.",
      "Love that! What made you feel this happy today?"
    ],
    sad: [
      "I'm here with you. Your feelings are valid—be gentle with yourself.",
      "That sounds heavy. Want a tiny step we can take right now to feel a bit better?"
    ],
    angry: [
      "I hear the intensity. Let's take one deep breath together—in 4, hold 4, out 6.",
      "It's okay to feel angry. Do you want to vent more or find a way to release it?"
    ],
    calm: [
      "Lovely grounded energy. Maybe try a mindful minute to deepen it?",
      "Staying present suits you. What would make this calm last a bit longer?"
    ]
  };
  const arr = map[mood] || map.calm;
  return arr[Math.floor(Math.random() * arr.length)];
};

const storageKey = "aiBuddyChat";

export const AIBuddyPage = () => {
  useSEO("AI Buddy | Calmora", "Chat with a gentle AI buddy for support, reflection, and mindfulness.");
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
      timestamp: Date.now(),
    };

    // Try Gemini-based mood detection first (uses your configured GEMINI_API_KEY)
    let mood = "calm";
    try {
      const { data: moodData, error: moodError } = await supabase.functions.invoke('mood-detection', {
        body: { text: trimmed, context: 'AI Buddy chat' }
      });
      if (moodError) {
        console.warn('mood-detection error:', moodError);
      }
      const apiMood = moodData?.mood ? String(moodData.mood).toLowerCase() : undefined;
      mood = apiMood || detectMood(trimmed);
    } catch (e) {
      console.warn('mood-detection invocation failed, falling back to local detection:', e);
      mood = detectMood(trimmed);
    }

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Call Gemini API through Supabase Edge Function with detected mood
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { message: trimmed, mood }
      });

      if (error) throw error;

      const aiResponse = data?.response || respondForMood(mood, trimmed);
      
      const reply: ChatMessage = {
        id: crypto.randomUUID(),
        role: "ai",
        text: aiResponse,
        mood,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, reply]);

      if (data?.fallback) {
        toast({
          title: "Using fallback response",
          description: "Gemini API unavailable, using local responses.",
          variant: "default",
        });
      }

    } catch (error) {
      console.error('AI chat error:', error);
      
      // Fallback to local response
      const reply: ChatMessage = {
        id: crypto.randomUUID(),
        role: "ai",
        text: respondForMood(mood, trimmed),
        mood,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, reply]);
      
      toast({
        title: "Connection issue",
        description: "Using local AI responses. Your chat continues!",
        variant: "default",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <main className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient-soul">AI Reflection Buddy</h1>
          <p className="text-muted-foreground mt-2">Gentle guidance, reflective prompts, and supportive chat</p>
        </header>

        <Card className="p-4 md:p-6 bg-card/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <span className="font-medium">Conversation</span>
              <Badge variant="secondary">{messages.length} msgs</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={clearChat}>
              <Trash2 className="w-4 h-4 mr-2" /> Clear
            </Button>
          </div>

          <div ref={listRef} className="h-[420px] overflow-y-auto pr-2 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-20">
                <Sparkles className="w-6 h-6 mx-auto mb-2" />
                Say hello or pick a quick prompt below to start.
              </div>
            )}

            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-soft ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/40'}`}>
                  {m.mood && m.role === 'ai' && (
                    <div className="mb-1 text-xs opacity-80">Detected mood: <strong>{m.mood}</strong></div>
                  )}
                  <div>{m.text}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-5 gap-2 mt-4">
            {quickPrompts.map(q => (
              <Button key={q} variant="outline" size="sm" onClick={() => send(q)} className="truncate">
                {q}
              </Button>
            ))}
          </div>

          <div className="mt-4 grid gap-2">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Share what's on your mind..."
            />
            <div className="flex justify-end">
              <Button onClick={() => send(input)} disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {isLoading ? "Thinking..." : "Send"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
};

export default AIBuddyPage;
