import { Hero } from "@/components/Hero";
import { FeatureCard } from "@/components/FeatureCard";
import { MoodCheckIn } from "@/components/MoodCheckIn";
import { SoulGarden } from "@/components/SoulGarden";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Heart, BookOpen, Wind, Music, Leaf, MessageCircle, BarChart3, Moon, Sparkles, ArrowRight, Shield, Lock } from "lucide-react";
const Index = () => {
  const {
    user
  } = useAuth();
  return <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />
      
      {/* Authentication CTA for non-authenticated users */}
      {!user && <section className="py-16 px-6 bg-primary/5">
          <div className="max-w-4xl mx-auto text-center">
            <div className="p-8 rounded-3xl bg-card/80 backdrop-blur-sm border border-primary/20 shadow-magical">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Shield className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-bold text-foreground">
                  Secure & Private
                </h2>
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Create your secure account to access all mindfulness features. Your data is encrypted 
                and protected with enterprise-grade security. Start your soul garden journey today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/auth">
                  <Button size="lg" className="gradient-forest hover:shadow-glow transition-gentle min-w-[200px]">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground">
                  ✓ End-to-end encryption ✓ Password policies ✓ Secure authentication
                </p>
              </div>
            </div>
          </div>
        </section>}
      
      {/* Features Overview */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Nurture Your Inner Peace
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover tools designed to help you reflect, breathe, and grow your soul garden
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard icon={Heart} title="Emotional Check-ins" description="Voice or text-based mood tracking with AI sentiment analysis and personalized suggestions." gradient="gradient-soul" />
            <FeatureCard icon={BookOpen} title="Guided Journaling" description="Beautiful daily prompts for gratitude, reflection, and inner growth with encrypted privacy." gradient="gradient-twilight" />
            <FeatureCard icon={Wind} title="Mindfulness & Breathing" description="Guided meditations and breathing exercises for stress, anxiety, sleep, and focus." gradient="gradient-calm" href="/mindfulness" />
            <FeatureCard icon={Music} title="Soothing Soundscapes" description="Calming music, nature sounds, and custom ambient blends based on your mood." gradient="gradient-forest" href="/sounds" />
            <FeatureCard icon={Leaf} title="Soul Garden Growth" description="Watch your virtual garden bloom as you complete mindful actions and reach milestones." gradient="gradient-soul" href="/garden" />
            <FeatureCard icon={MessageCircle} title="AI Reflection Buddy" description="Chat with Calmora Bot for gentle guidance, reflection prompts, and positive reframing." gradient="gradient-twilight" href="/chat" />
          </div>
        </div>
      </section>
      
      {/* Interactive Demo Section */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Try Calmora Today
            </h2>
            <p className="text-xl text-muted-foreground">
              Start your journey with a mood check-in and see your soul garden begin to grow
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <MoodCheckIn />
            <SoulGarden />
          </div>
        </div>
      </section>
      
      {/* Coming Soon Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-foreground">More Features

        </h2>
          <p className="text-lg text-muted-foreground mb-12">
            Your soul garden will continue to evolve with new mindfulness tools
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-card/50 rounded-2xl border border-border/30">
              <BarChart3 className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-sm text-muted-foreground">Deep insights into your mood patterns and growth</p>
            </div>
            <div className="p-6 bg-card/50 rounded-2xl border border-border/30">
              <Moon className="w-8 h-8 text-secondary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Sleep Sanctuary</h3>
              <p className="text-sm text-muted-foreground">Bedtime stories, meditations, and sleep tracking</p>
            </div>
            <FeatureCard icon={Sparkles} title="Daily Affirmations" description="Personalized positive affirmations and reminders to boost your confidence" gradient="gradient-soul" href="/affirmations" />
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="w-6 h-6 text-primary" />
            <span className="text-2xl font-bold text-gradient-soul">
              Calmora
            </span>
            <Leaf className="w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground mb-4">
            Your digital sanctuary for mental wellness and soul growth
          </p>
          <p className="text-sm text-muted-foreground">
            Built with ❤️ for your inner peace journey
          </p>
        </div>
      </footer>
    </div>;
};
export default Index;