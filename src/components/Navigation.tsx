import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/hooks/useAuth";
import { Heart, BookOpen, Wind, Brain, Leaf, MessageCircle, BarChart3, Moon, Menu, Home, LogIn } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const {
    user
  } = useAuth();
  const {
    t
  } = useTranslation();
  const navItems = [{
    path: "/",
    icon: Home,
    label: t('navigation.home')
  }, {
    path: "/mood",
    icon: Heart,
    label: t('navigation.mood')
  }, {
    path: "/journal",
    icon: BookOpen,
    label: t('navigation.journal')
  }, {
    path: "/mindfulness",
    icon: Wind,
    label: t('navigation.mindfulness')
  }, {
    path: "/sounds",
    icon: Brain,
    label: t('navigation.wordpuzzle')
  }, {
    path: "/garden",
    icon: Leaf,
    label: t('navigation.garden')
  }, {
    path: "/chat",
    icon: MessageCircle,
    label: t('navigation.aibuddy')
  }, {
    path: "/dashboard",
    icon: BarChart3,
    label: t('navigation.dashboard')
  }, {
    path: "/sleep",
    icon: Moon,
    label: t('navigation.sleepzone')
  }];
  const isActive = (path: string) => location.pathname === path;
  return <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/lovable-uploads/ee0eb6bb-a68f-41e8-8f2a-26c1cf1eee0e.png" alt="Calmora Logo" className="w-8 h-8 rounded-full" />
            
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 flex-wrap">
            {navItems.map(item => {
            const Icon = item.icon;
            // Only show protected routes if user is authenticated
            if (item.path !== "/" && item.path !== "/auth" && !user) return null;
            return <Link key={item.path} to={item.path}>
                  <Button variant={isActive(item.path) ? "soul" : "ghost"} size="sm" className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Button>
                </Link>;
          })}
            
            {/* Auth Button or User Menu */}
            {user ? <div className="ml-4">
                <UserMenu />
              </div> : <Link to="/auth">
                <Button variant="soul" size="sm" className="flex items-center gap-2 ml-4">
                  <LogIn className="w-4 h-4" />
                  <span className="hidden lg:inline">{t('navigation.signIn')}</span>
                </Button>
              </Link>}
          </div>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col gap-4 mt-8">
                {navItems.map(item => {
                const Icon = item.icon;
                // Only show protected routes if user is authenticated
                if (item.path !== "/" && item.path !== "/auth" && !user) return null;
                return <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)}>
                      <Button variant={isActive(item.path) ? "soul" : "ghost"} size="lg" className="w-full justify-start gap-3">
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </Button>
                    </Link>;
              })}
                
                {/* Auth Button in Mobile Menu */}
                {!user && <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <Button variant="soul" size="lg" className="w-full justify-start gap-3 mt-4">
                      <LogIn className="w-5 h-5" />
                      {t('navigation.signIn')}
                    </Button>
                  </Link>}
                
                {/* User Menu in Mobile */}
                {user && <div className="mt-4 pt-4 border-t border-border">
                    <UserMenu />
                  </div>}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>;
};