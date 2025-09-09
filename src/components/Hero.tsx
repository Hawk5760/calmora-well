import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import heroImage from "@/assets/soul-garden-hero.jpg";
import { Sparkles, Heart, Leaf } from "lucide-react";

export const Hero = () => {
  const { t } = useTranslation();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Soul Garden Sanctuary" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/80" />
      </div>
      
      {/* Floating Elements */}
      <div className="absolute inset-0 z-10">
        <Sparkles className="absolute top-20 left-20 w-6 h-6 text-primary-glow animate-pulse" />
        <Heart className="absolute top-32 right-32 w-5 h-5 text-accent animate-pulse delay-300" />
        <Leaf className="absolute bottom-40 left-16 w-7 h-7 text-primary animate-pulse delay-700" />
        <Sparkles className="absolute bottom-60 right-20 w-4 h-4 text-secondary animate-pulse delay-1000" />
      </div>
      
      {/* Main Content */}
      <div className="relative z-20 text-center px-6 max-w-4xl mx-auto">
        <div className="mb-8 grow">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-gradient-soul">
              {t('app.name')}
            </span>
          </h1>
          <p className="text-2xl md:text-3xl font-light mb-4 text-foreground/90">
            {t('app.tagline')}
          </p>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A calming digital sanctuary for your mental wellness journey. 
            Reflect, breathe, and grow your inner garden with every mindful step.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button variant="soul" size="hero" className="bloom" asChild>
            <a href="/mood">
              Begin Your Journey
              <Sparkles className="w-5 h-5 ml-2" />
            </a>
          </Button>
          <Button variant="calm" size="hero" className="bloom delay-200" asChild>
            <a href="#features">
              Learn More
              <Heart className="w-5 h-5 ml-2" />
            </a>
          </Button>
        </div>
        
        <div className="mt-16 text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <Leaf className="w-4 h-4 text-primary" />
            Your journey to inner peace begins here
            <Leaf className="w-4 h-4 text-primary" />
          </p>
        </div>
      </div>
    </section>
  );
};