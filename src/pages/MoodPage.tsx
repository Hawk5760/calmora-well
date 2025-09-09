import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Music, Heart, Sparkles, Send, Mic, MicOff, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
interface MoodEntry {
  mood: string;
  note: string;
  timestamp: Date;
  aiResponse?: string;
  songSuggestions?: Song[];
}
interface Song {
  title: string;
  artist: string;
  mood: string;
  genre: string;
  youtubeUrl: string;
}
export const MoodPage = () => {
  const [userInput, setUserInput] = useState("");
  const [detectedMood, setDetectedMood] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string>("");
  const [songSuggestions, setSongSuggestions] = useState<Song[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [moodConfidence, setMoodConfidence] = useState<number>(0);
  const [isUsingAI, setIsUsingAI] = useState(false);
  const {
    toast
  } = useToast();
  const {
    isRecording: voiceIsRecording,
    startRecording,
    stopRecording,
    transcript
  } = useVoiceRecognition(transcribedText => {
    setUserInput(prev => prev + (prev ? ' ' : '') + transcribedText);
    toast({
      title: "Voice captured! 🎤",
      description: "Your voice has been converted to text."
    });
  });

  // Function to get mood-appropriate songs that help lift spirits
  const getMoodBasedSongs = (detectedMood: string): Song[] => {
    // Always suggest uplifting songs regardless of current mood
    // The goal is to help the person feel better
    const upliftingSongs: Song[] = [
    // Happy Bollywood hits that are widely available
    {
      title: "Kuch Kuch Hota Hai",
      artist: "Udit Narayan & Alka Yagnik",
      mood: "happy",
      genre: "Bollywood",
      youtubeUrl: "https://www.youtube.com/results?search_query=Kuch+Kuch+Hota+Hai+song"
    }, {
      title: "Dil To Pagal Hai",
      artist: "Lata Mangeshkar & Udit Narayan",
      mood: "happy",
      genre: "Bollywood",
      youtubeUrl: "https://www.youtube.com/results?search_query=Dil+To+Pagal+Hai+title+song"
    }, {
      title: "Om Shanti Om",
      artist: "Shreya Ghoshal",
      mood: "happy",
      genre: "Bollywood",
      youtubeUrl: "https://www.youtube.com/results?search_query=Om+Shanti+Om+main+agar+kahoon"
    }, {
      title: "I Want It That Way",
      artist: "Backstreet Boys",
      mood: "happy",
      genre: "Pop",
      youtubeUrl: "https://www.youtube.com/results?search_query=Backstreet+Boys+I+Want+It+That+Way"
    }, {
      title: "Can't Stop the Feeling",
      artist: "Justin Timberlake",
      mood: "happy",
      genre: "Pop",
      youtubeUrl: "https://www.youtube.com/results?search_query=Justin+Timberlake+Can%27t+Stop+the+Feeling"
    },
    // Calming and peaceful songs
    {
      title: "Raghupati Raghav Raja Ram",
      artist: "Various Artists",
      mood: "calm",
      genre: "Devotional",
      youtubeUrl: "https://www.youtube.com/results?search_query=Raghupati+Raghav+Raja+Ram"
    }, {
      title: "Vaishnav Jan To",
      artist: "Various Artists",
      mood: "calm",
      genre: "Devotional",
      youtubeUrl: "https://www.youtube.com/results?search_query=Vaishnav+Jan+To+Tene+Kahiye"
    }, {
      title: "Perfect",
      artist: "Ed Sheeran",
      mood: "calm",
      genre: "Pop",
      youtubeUrl: "https://www.youtube.com/results?search_query=Ed+Sheeran+Perfect"
    }, {
      title: "Someone You Loved",
      artist: "Lewis Capaldi",
      mood: "calm",
      genre: "Pop",
      youtubeUrl: "https://www.youtube.com/results?search_query=Lewis+Capaldi+Someone+You+Loved"
    },
    // Motivational and energetic songs
    {
      title: "Dangal",
      artist: "Daler Mehndi",
      mood: "motivated",
      genre: "Bollywood",
      youtubeUrl: "https://www.youtube.com/results?search_query=Dangal+title+song+Daler+Mehndi"
    }, {
      title: "Bhaag Milkha Bhaag",
      artist: "Divya Kumar",
      mood: "motivated",
      genre: "Bollywood",
      youtubeUrl: "https://www.youtube.com/results?search_query=Bhaag+Milkha+Bhaag+title+song"
    }, {
      title: "Stronger",
      artist: "Kelly Clarkson",
      mood: "motivated",
      genre: "Pop",
      youtubeUrl: "https://www.youtube.com/results?search_query=Kelly+Clarkson+Stronger"
    }, {
      title: "Roar",
      artist: "Katy Perry",
      mood: "motivated",
      genre: "Pop",
      youtubeUrl: "https://www.youtube.com/results?search_query=Katy+Perry+Roar"
    }];

    // Return songs based on what would help the person feel better
    if (detectedMood === 'sad' || detectedMood === 'angry' || detectedMood === 'anxious') {
      // For negative moods, suggest a mix of calming and then uplifting songs
      return [...upliftingSongs.filter(song => song.mood === 'calm').slice(0, 2), ...upliftingSongs.filter(song => song.mood === 'happy').slice(0, 3), ...upliftingSongs.filter(song => song.mood === 'motivated').slice(0, 1)];
    } else if (detectedMood === 'calm') {
      // For calm mood, suggest gentle uplifting songs
      return [...upliftingSongs.filter(song => song.mood === 'calm').slice(0, 2), ...upliftingSongs.filter(song => song.mood === 'happy').slice(0, 3)];
    } else if (detectedMood === 'motivated') {
      // For motivated mood, suggest energetic songs
      return [...upliftingSongs.filter(song => song.mood === 'motivated'), ...upliftingSongs.filter(song => song.mood === 'happy').slice(0, 2)];
    } else {
      // Default to happy songs
      return upliftingSongs.filter(song => song.mood === 'happy');
    }
  };
  const detectMood = (text: string): string => {
    const lowerText = text.toLowerCase();

    // Handle negations first
    const negationWords = ['not', 'never', 'no', "don't", "can't", "won't", "isn't", "aren't", "wasn't", "weren't", "haven't", "hasn't", "hadn't"];
    const hasNegation = negationWords.some(neg => lowerText.includes(neg));

    // Enhanced mood detection with your comprehensive keyword lists
    const moodPatterns = {
      happy: {
        positive: [
        // Your happy keywords
        'happy', 'peaceful', 'joyful', 'excited', 'truly content', 'carefree', 'cheerful', 'relaxed', 'smiling from within', 'heart full', 'feeling blessed', 'chilled out', 'thankful', 'grateful', 'fulfilled', 'in love with life', 'warm inside', 'celebrating something', 'family love', 'light-hearted', 'calm and content', 'soulful', 'energetic', 'inspired', 'positive', 'faithful', 'peace in the heart', 'proud of self', 'motivated', 'festival feeling', 'romantic', 'flirty fun', 'adventurous', 'colorful inside', 'full of hope', 'enjoying company', 'bubbly', 'singing mood', 'playful', 'connected', 'feeling loved', 'achieved something', 'overflowing with love', 'sweetly emotional', 'spiritually light', 'mentally clear', 'inner glow', 'lively', 'in the moment', 'smile-worthy',
        // Additional happy words
        'joy', 'amazing', 'great', 'wonderful', 'fantastic', 'awesome', 'good', 'delighted', 'thrilled', 'ecstatic', 'elated', 'blissful', 'euphoric', 'overjoyed', 'upbeat', 'bright', 'sunny', 'radiant', 'beaming'],
        phrases: ['feeling great', 'having a blast', 'so happy', 'really good', 'amazing day', 'perfect day', 'love life', 'everything is good', 'going well', 'best feeling', 'so excited', 'can\'t stop smiling', 'heart full', 'feeling blessed', 'in love with life', 'overflowing with love', 'achieved something']
      },
      sad: {
        positive: [
        // Your sad keywords
        'sad', 'low', 'tired emotionally', 'feeling left out', 'lonely', 'quietly hurting', 'downhearted', 'mentally drained', 'dull inside', 'feeling empty', 'missing someone', 'broken inside', 'helpless', 'disappointed', 'regretful', 'guilty', 'mentally weak', 'crying silently', 'numb feeling', 'quiet sadness', 'mentally foggy', 'isolated', 'shy and withdrawn', 'homesick', 'ashamed', 'disconnected', 'overthinking', 'silent tears', 'grieving', 'emotionally cold', 'unseen', 'missing home', 'hurt by someone', 'feel like quitting', 'rejected', 'let down', 'tired of life', 'feel like a burden', 'not enough', 'unheard', 'emotionally tired', 'alone in a crowd', 'burnt out', 'quiet inside', 'closed off', 'empty-hearted', 'feeling ignored', 'emotionally distant', 'wanting peace', 'no motivation',
        // Additional sad words
        'depressed', 'down', 'blue', 'upset', 'crying', 'tears', 'heartbroken', 'miserable', 'gloomy', 'devastated', 'crushed', 'broken', 'empty', 'hollow', 'hopeless', 'despair', 'grief', 'sorrow', 'melancholy', 'abandoned', 'hurt', 'pain', 'ache', 'heavy heart', 'dark', 'darkness', 'failed', 'fail', 'failure', 'failing', 'flunked', 'bombed', 'screwed up', 'messed up', 'ruined', 'disaster', 'terrible', 'awful', 'horrible', 'worst', 'disappointing', 'defeated', 'lost', 'losing', 'loser', 'worthless', 'useless', 'stupid', 'idiot', 'shame', 'embarrassed', 'humiliated', 'pathetic', 'regret', 'sorry'],
        phrases: ['feeling down', 'really sad', 'want to cry', 'breaking down', 'can\'t stop crying', 'feel empty', 'everything sucks', 'nothing matters', 'lost hope', 'feel alone', 'nobody cares', 'giving up', 'failed the exam', 'failed my test', 'didn\'t pass', 'got rejected', 'screwed everything up', 'feel like a failure', 'let everyone down', 'so disappointed', 'such a disaster', 'everything went wrong', 'feel terrible', 'feel awful', 'worst day ever', 'hate myself', 'so embarrassed', 'feel stupid', 'tired emotionally', 'feeling left out', 'quietly hurting', 'mentally drained', 'feeling empty', 'missing someone', 'broken inside', 'crying silently', 'feel like quitting', 'feel like a burden']
      },
      angry: {
        positive: [
        // Your angry keywords  
        'angry', 'irritated', 'frustrated', 'tense', 'short-tempered', 'mentally overloaded', 'burnt out', 'snappy', 'mood swings', 'on edge', 'tired of explaining', 'disrespected', 'lost patience', 'pushed too far', 'dominated', 'want to shout', 'misunderstood', 'feeling insulted', 'boiling inside', 'exhausted and angry', 'judged', 'annoyed by people', 'criticized', 'resentful', 'jealous', 'hurt but angry', 'holding a grudge', 'emotionally blocked', 'can\'t express', 'rage inside', 'controlled anger', 'want to be left alone', 'passive-aggressive', 'blaming others', 'confused + angry', 'fed up', 'want to fight', 'backstabbed', 'family pressure', 'relationship stress', 'feeling trapped', 'disappointed in self', 'broken trust', 'revengeful', 'heavy heart + anger', 'taken for granted', 'shouting mood', 'emotionally unstable', 'criticism hurt me', 'head bursting',
        // Additional angry words
        'mad', 'furious', 'rage', 'pissed', 'livid', 'hate', 'disgusted', 'outraged', 'enraged', 'irate', 'seething', 'boiling', 'fuming', 'bitter', 'hostile', 'aggressive', 'sick of', 'done with', 'can\'t stand', 'drives me crazy', 'makes me mad', 'infuriating'],
        phrases: ['so angry', 'really mad', 'pissed off', 'fed up', 'had enough', 'driving me crazy', 'can\'t take it', 'makes me furious', 'want to scream', 'losing my mind', 'done with this', 'tired of explaining', 'lost patience', 'pushed too far', 'want to shout', 'boiling inside', 'annoyed by people', 'want to be left alone', 'want to fight', 'taken for granted', 'head bursting', 'emotionally unstable']
      },
      calm: {
        positive: [
        // Your calm keywords
        'calm', 'peaceful', 'emotionally still', 'mindful', 'just observing', 'reflective', 'blank', 'detached', 'balanced', 'mentally quiet', 'grounded', 'silent', 'in thought', 'resting mode', 'feeling empty (neutral)', 'spiritually centered', 'not feeling much', 'bored but fine', 'still like a lake', 'watching life', 'no strong emotion', 'settled', 'deep in thought', 'plain mood', 'low-key', 'feeling nothing', 'meh mood', 'accepting what is', 'inward focused', 'quietly existing', 'emotionally tired but stable', 'peacefully alone', 'thoughtful', 'daydreaming', 'calm yet alert', 'spacey', 'breathing slow', 'just being', 'easy-going', 'steady mind', 'no expectations', 'internal peace', 'inner silence', 'mild emotions', 'light-hearted neutrality', 'taking a break', 'relaxed body', 'safe and okay', 'mentally coasting', 'simply present',
        // Additional calm words
        'relaxed', 'serene', 'tranquil', 'zen', 'content', 'mellow', 'centered', 'still', 'quiet', 'gentle', 'soft', 'smooth', 'easy', 'stable', 'composed', 'collected'],
        phrases: ['feeling calm', 'at peace', 'really relaxed', 'everything is okay', 'feeling balanced', 'in a good place', 'taking it easy', 'going with flow', 'feeling centered', 'inner peace', 'emotionally still', 'just observing', 'mentally quiet', 'resting mode', 'spiritually centered', 'still like a lake', 'accepting what is', 'quietly existing', 'peacefully alone', 'just being', 'simply present']
      },
      motivated: {
        positive: ['motivated', 'determined', 'focused', 'driven', 'ambitious', 'energetic', 'pumped', 'ready', 'confident', 'inspired', 'empowered', 'strong', 'capable', 'unstoppable', 'fierce', 'bold', 'brave', 'courageous'],
        phrases: ['let\'s do this', 'ready to go', 'feeling strong', 'can do anything', 'bring it on', 'no stopping me', 'full of energy', 'ready for challenge', 'feeling powerful', 'going to succeed']
      }
    };
    let moodScores: {
      [key: string]: number;
    } = {};

    // Calculate scores for each mood
    Object.entries(moodPatterns).forEach(([mood, patterns]) => {
      let score = 0;

      // Check individual words
      patterns.positive.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          score += 1;
        }
      });

      // Check phrases (higher weight)
      patterns.phrases.forEach(phrase => {
        if (lowerText.includes(phrase)) {
          score += 3;
        }
      });

      // Handle negations - if there's a negation near mood words, reduce score significantly
      if (hasNegation && score > 0) {
        // Check if negation is near the mood words
        patterns.positive.forEach(keyword => {
          if (lowerText.includes(keyword)) {
            negationWords.forEach(neg => {
              const keywordIndex = lowerText.indexOf(keyword);
              const negIndex = lowerText.indexOf(neg);
              // If negation is within 10 characters of the mood word, it's likely negated
              if (Math.abs(keywordIndex - negIndex) < 15) {
                score -= 2; // Reduce score for negated mood
              }
            });
          }
        });
      }
      moodScores[mood] = Math.max(0, score); // Ensure score doesn't go negative
    });

    // Special context analysis
    const contextAnalysis = analyzeContext(lowerText);
    if (contextAnalysis) {
      moodScores[contextAnalysis] = (moodScores[contextAnalysis] || 0) + 2;
    }

    // Find the mood with the highest score
    const sortedMoods = Object.entries(moodScores).sort((a, b) => b[1] - a[1]);
    const topMood = sortedMoods[0];

    // If no clear mood detected or score is too low, default to calm
    return topMood[1] > 0 ? topMood[0] : 'calm';
  };
  const analyzeContext = (text: string): string | null => {
    // Analyze context clues and situations
    const contexts = {
      work: ['work', 'job', 'boss', 'colleague', 'office', 'meeting', 'deadline', 'project', 'career'],
      relationship: ['boyfriend', 'girlfriend', 'husband', 'wife', 'partner', 'relationship', 'love', 'breakup', 'dating'],
      family: ['family', 'mom', 'dad', 'mother', 'father', 'parents', 'siblings', 'kids', 'children'],
      health: ['sick', 'illness', 'doctor', 'hospital', 'pain', 'hurt', 'injury', 'medicine', 'therapy'],
      achievement: ['passed', 'won', 'succeeded', 'achieved', 'graduated', 'promoted', 'accomplished', 'victory'],
      loss: ['died', 'death', 'funeral', 'lost', 'goodbye', 'miss', 'gone', 'passed away'],
      // Add academic context
      academic: ['exam', 'test', 'quiz', 'assignment', 'homework', 'school', 'college', 'university', 'grade', 'marks', 'score', 'result', 'semester', 'class', 'course', 'study', 'studying'],
      failure: ['failed', 'fail', 'failure', 'flunked', 'bombed', 'rejected', 'denied', 'didn\'t get', 'lost', 'unsuccessful']
    };

    // If someone talks about academic failure, likely sad/disappointed
    if (contexts.academic.some(word => text.includes(word)) && contexts.failure.some(word => text.includes(word)) || text.includes('failed exam') || text.includes('failed test') || text.includes('didn\'t pass')) {
      return 'sad';
    }

    // If someone talks about loss/death, likely sad
    if (contexts.loss.some(word => text.includes(word))) {
      return 'sad';
    }

    // If someone talks about achievements, likely happy/motivated
    if (contexts.achievement.some(word => text.includes(word))) {
      return 'happy';
    }

    // If someone mentions work stress
    if (contexts.work.some(word => text.includes(word)) && (text.includes('stress') || text.includes('pressure') || text.includes('deadline'))) {
      return 'anxious';
    }

    // If someone mentions academic stress/pressure
    if (contexts.academic.some(word => text.includes(word)) && (text.includes('stress') || text.includes('pressure') || text.includes('worried') || text.includes('nervous'))) {
      return 'anxious';
    }
    return null;
  };
  const generateAIResponse = (mood: string, userText: string): string => {
    const responses = {
      happy: ["I can feel your positive energy radiating through your words! 😊 It's wonderful to see you feeling so upbeat. Your happiness is contagious!", "That's amazing! I love hearing about good moments like this. Your joy is absolutely beautiful - keep shining! ✨", "Your happiness makes my day brighter! It sounds like you're in such a wonderful headspace right now. Embrace this beautiful feeling!", "I'm so happy for you! 🌟 Whatever brought this joy into your life, you deserve every bit of it. Soak up this beautiful energy!"],
      sad: ["I hear you, and I want you to know that your feelings are completely valid. 💙 It's okay to feel sad sometimes - you're being so brave by sharing this with me.", "Thank you for trusting me with your feelings. Remember, even the darkest nights eventually give way to dawn. You're stronger than you know. 🌙", "I'm here with you in this moment. Sadness is part of being human, and it shows how deeply you can feel. Be gentle with yourself today. 💝", "Your pain is real, and it matters. 🫂 I wish I could give you a big hug right now. Remember that this feeling will pass, and brighter days are ahead."],
      anxious: ["I can sense the weight you're carrying, and I want you to know you're not alone. 🫂 Let's take this one breath at a time together.", "Your mind might be racing, but you're safe right here, right now. I believe in your strength to get through this. 💪", "Anxiety can feel overwhelming, but you've gotten through difficult moments before, and you'll get through this too. I'm here for you. 🌸", "I understand how exhausting it can be when your thoughts won't slow down. 💭 You're doing amazingly well just by reaching out and sharing this with me."],
      angry: ["I can feel the intensity of your emotions, and that's completely okay. 🔥 Your feelings are valid, and it's important to acknowledge them.", "Sometimes we need to feel our anger fully before we can move through it. I'm here to listen without judgment. 💜", "Your frustration makes sense given what you're going through. Let's channel this energy in a way that serves you better. 🌊", "It's okay to be angry - it shows you care deeply about things. 💙 I'm here to help you work through these intense feelings."],
      calm: ["There's something beautiful about the peace in your words. 🕊️ It sounds like you're in a really centered place right now.", "I love the tranquil energy you're sharing. These moments of calm are so precious - soak them in. 🌿", "Your sense of balance is really coming through. It's wonderful when we can find these pockets of serenity in our lives. ☯️", "The calmness in your message is so refreshing. 🌊 It's beautiful when we can find inner peace even in the midst of life's chaos."],
      motivated: ["I can feel your determination and drive! 🚀 This energy is incredible - you're ready to take on the world!", "Your motivation is inspiring! When we're fired up like this, amazing things can happen. Channel this power! ⚡", "I love this ambitious energy you're bringing! You've got that spark that can light up any challenge ahead. 🔥", "This drive you have is absolutely infectious! 💪 I believe you can accomplish anything you set your mind to right now."]
    };
    const moodResponses = responses[mood as keyof typeof responses] || responses.calm;
    const selectedResponse = moodResponses[Math.floor(Math.random() * moodResponses.length)];

    // Add personalized touch based on user's text
    let personalizedAddition = "";

    // Add context-aware personalization
    if (userText.toLowerCase().includes('work') || userText.toLowerCase().includes('job')) {
      personalizedAddition = mood === 'anxious' ? " Work stress can be really tough - remember to take breaks when you can. 💼" : mood === 'happy' ? " It's wonderful when work brings us joy! 💼✨" : mood === 'angry' ? " Work frustrations are so valid - your feelings about this situation make complete sense. 💼" : "";
    } else if (userText.toLowerCase().includes('family') || userText.toLowerCase().includes('friend')) {
      personalizedAddition = mood === 'sad' ? " Relationships can be complex and sometimes painful. Your feelings are so understandable. 👥💙" : mood === 'happy' ? " There's nothing quite like the joy that comes from our loved ones! 👥💕" : "";
    } else if ((userText.toLowerCase().includes('exam') || userText.toLowerCase().includes('test')) && (userText.toLowerCase().includes('failed') || userText.toLowerCase().includes('fail'))) {
      personalizedAddition = mood === 'sad' ? " Failing an exam is so tough and your disappointment is completely understandable. This doesn't define your worth or potential. 📚💙" : mood === 'anxious' ? " Academic setbacks can feel overwhelming, but remember this is just one moment in your journey. You've got this! 📚✨" : "";
    } else if (userText.toLowerCase().includes('exam') || userText.toLowerCase().includes('test') || userText.toLowerCase().includes('school')) {
      personalizedAddition = mood === 'anxious' ? " Academic pressure can feel intense - remember to breathe and take it one step at a time. 📚🌱" : mood === 'happy' ? " It's wonderful when our studies bring us joy and fulfillment! 📚✨" : "";
    }
    return selectedResponse + personalizedAddition;
  };
  const getSongSuggestions = (mood: string): Song[] => {
    // Use the new mood-based song function that helps lift spirits
    return getMoodBasedSongs(mood);
  };
  const handleVoiceToggle = () => {
    if (voiceIsRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  const handleAnalyzeInput = async () => {
    if (!userInput.trim()) {
      toast({
        title: "Please share something",
        description: "Tell me what's on your mind so I can understand how you're feeling.",
        variant: "destructive"
      });
      return;
    }
    setIsAnalyzing(true);
    setShowResponse(false);
    setIsUsingAI(false);
    try {
      // Try Gemini AI mood detection first
      const {
        data,
        error
      } = await supabase.functions.invoke('mood-detection', {
        body: {
          text: userInput,
          context: 'mood check-in'
        }
      });
      if (!error && data && !data.fallback) {
        // AI detection successful
        setDetectedMood(data.mood);
        setMoodConfidence(data.confidence || 85);
        setAiResponse(data.supportive_message || generateAIResponse(data.mood, userInput));
        setIsUsingAI(true);
        toast({
          title: "AI mood detection complete! 🧠",
          description: `I'm ${data.confidence}% confident you're feeling ${data.mood}`
        });
      } else {
        throw new Error('AI detection failed');
      }
    } catch (error) {
      console.error('AI mood detection error:', error);

      // Fallback to local detection
      const mood = detectMood(userInput);
      const response = generateAIResponse(mood, userInput);
      setDetectedMood(mood);
      setAiResponse(response);
      setMoodConfidence(70);
      setIsUsingAI(false);
      toast({
        title: "Mood detected locally! 🌱",
        description: `I sense you're feeling ${mood}. Using backup detection.`
      });
    }
    const songs = getSongSuggestions(detectedMood);
    setSongSuggestions(songs);
    const moodEntry: MoodEntry = {
      mood: detectedMood,
      note: userInput,
      timestamp: new Date(),
      aiResponse: aiResponse,
      songSuggestions: songs
    };

    // Store mood entry
    const existingEntries = JSON.parse(localStorage.getItem("moodEntries") || "[]");
    existingEntries.push(moodEntry);
    localStorage.setItem("moodEntries", JSON.stringify(existingEntries));

    // Update soul garden stats
    const existingStats = JSON.parse(localStorage.getItem("gardenStats") || "{}");
    const newStats = {
      ...existingStats,
      moodEntries: (existingStats.moodEntries || 0) + 1,
      totalActions: (existingStats.totalActions || 0) + 1
    };
    localStorage.setItem("gardenStats", JSON.stringify(newStats));
    setIsAnalyzing(false);
    setShowResponse(true);
  };
  const handleNewEntry = () => {
    setUserInput("");
    setDetectedMood("");
    setAiResponse("");
    setSongSuggestions([]);
    setShowResponse(false);
    setMoodConfidence(0);
    setIsUsingAI(false);
  };
  return <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-gradient-soul">Mood detector </h1>
          <p className="text-xl text-muted-foreground">
            Share your thoughts and I'll understand how you're feeling, then we can chat like friends 💝
          </p>
        </div>

        {!showResponse ?
      // Input Phase
      <Card className="p-8 bg-card/80 backdrop-blur-sm border-border/50 shadow-soft">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <label className="text-lg font-semibold text-foreground">
                  What's happening in your world today?
                </label>
                <Button onClick={handleVoiceToggle} variant={voiceIsRecording ? "destructive" : "outline"} size="sm" className="flex items-center gap-2">
                  {voiceIsRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {voiceIsRecording ? "Stop Recording" : "Voice Note"}
                </Button>
              </div>
              
              <Textarea value={userInput} onChange={e => setUserInput(e.target.value)} placeholder="Tell me anything that's on your mind... your day, your feelings, your thoughts, your dreams, your worries... I'm here to listen and understand 💙" className="bg-background/50 border-border/50 focus:border-primary transition-gentle min-h-40" rows={8} />
              
              {voiceIsRecording && <div className="mt-4 flex items-center justify-center gap-2 text-primary">
                  <div className="animate-pulse w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Recording... I'm listening to your voice</span>
                </div>}
            </div>

            <Button onClick={handleAnalyzeInput} variant="soul" size="lg" className="w-full" disabled={isAnalyzing}>
              {isAnalyzing ? <>
                  <div className="animate-spin w-4 h-4 border-2 border-background border-t-transparent rounded-full mr-2"></div>
                  Understanding your feelings...
                </> : <>
                  <Send className="w-5 h-5 mr-2" />
                  Share with Calmora 💝
                </>}
            </Button>
          </Card> :
      // Response Phase
      <div className="space-y-6">
            {/* Detected Mood Badge */}
            <Card className="p-6 bg-primary/10 border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {isUsingAI ? <Brain className="w-5 h-5 text-primary" /> : <Sparkles className="w-5 h-5 text-primary" />}
                  <span className="font-semibold text-foreground">I sense you're feeling:</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {isUsingAI ? `🧠 AI Detection (${moodConfidence}% confident)` : `🌿 Local Detection (${moodConfidence}% confident)`}
                </div>
              </div>
              <Badge variant="secondary" className="text-lg py-2 px-4 capitalize">
                {detectedMood}
              </Badge>
            </Card>

            {/* AI Response */}
            <Card className="p-8 bg-card/80 backdrop-blur-sm border-border/50 shadow-soft">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-soul flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-3">Calmora says:</h3>
                  <p className="text-foreground leading-relaxed text-lg">
                    {aiResponse}
                  </p>
                </div>
              </div>
            </Card>

            {/* Song Suggestions */}
            {songSuggestions.length > 0 && <Card className="p-8 bg-card/80 backdrop-blur-sm border-border/50 shadow-soft">
                <div className="flex items-center gap-3 mb-6">
                  <Music className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">Songs I think you'll love right now:</h3>
                </div>
                
                <div className="grid gap-4">
                  {songSuggestions.map((song, index) => <div key={index} onClick={() => window.open(song.youtubeUrl, '_blank')} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 hover:scale-[1.02] transition-all duration-300 cursor-pointer group border border-transparent hover:border-primary/30">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center group-hover:from-red-400 group-hover:to-red-500 transition-all">
                           <Music className="w-6 h-6 text-white" />
                         </div>
                         <div>
                           <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                             {song.title}
                           </h4>
                           <p className="text-muted-foreground text-sm">{song.artist}</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-3">
                         <Badge variant="outline" className="text-xs">
                           {song.genre}
                         </Badge>
                         <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                           ▶️ Play on YouTube
                         </div>
                       </div>
                     </div>)}
                </div>
              </Card>}

            {/* New Entry Button */}
            <div className="text-center">
              <Button onClick={handleNewEntry} variant="outline" size="lg" className="min-w-48">
                Share Something New 💭
              </Button>
            </div>
          </div>}
      </div>
    </div>;
};