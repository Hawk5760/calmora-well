import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import { AuthPage } from "./pages/AuthPage";
import { MoodPage } from "./pages/MoodPage";
import { JournalPage } from "./pages/JournalPage";
import { MindfulnessPage } from "./pages/MindfulnessPage";
import { DashboardPage } from "./pages/DashboardPage";
import { WordPuzzleGame } from "./pages/WordPuzzleGame";
import { GardenPage } from "./pages/GardenPage";
import { SettingsPage } from "./pages/SettingsPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { ProfilePage } from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import AIBuddyPage from "./pages/AIBuddyPage";
import SleepZonePage from "./pages/SleepZonePage";
import { AffirmationsPage } from "./pages/AffirmationsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <BrowserRouter>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Navigation />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/mood" element={<ProtectedRoute><MoodPage /></ProtectedRoute>} />
              <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
              <Route path="/mindfulness" element={<ProtectedRoute><MindfulnessPage /></ProtectedRoute>} />
              <Route path="/sounds" element={<ProtectedRoute><WordPuzzleGame /></ProtectedRoute>} />
              <Route path="/garden" element={<ProtectedRoute><GardenPage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><AIBuddyPage /></ProtectedRoute>} />
              <Route path="/sleep" element={<ProtectedRoute><SleepZonePage /></ProtectedRoute>} />
              <Route path="/affirmations" element={<ProtectedRoute><AffirmationsPage /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/privacy" element={<ProtectedRoute><PrivacyPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
