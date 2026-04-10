"use client";

import React from "react";
import { useSession } from "@/integrations/supabase/auth";
import AppSidebar from "./layout/AppSidebar";
import BottomNav from "./layout/BottomNav";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";
import AdminViewToggle from "./AdminViewToggle";
import ReportIssueButton from "./ReportIssueButton";
import UnreadIssueReportsNotice from "./UnreadIssueReportsNotice";
import BackToTopButton from "./BackToTopButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, loading, isActualAdmin } = useSession();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-xl font-black font-lora text-primary animate-pulse">Finding the resonance...</p>
        </div>
      </div>
    );
  }

  // Public view (Landing Page)
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="glass-header p-4 md:p-6 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex justify-between items-center px-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary-foreground text-primary rounded-xl p-2">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-xl font-black font-lora text-primary-foreground tracking-tighter">
                Resonance
              </span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button asChild variant="outline" className="bg-primary-foreground text-primary border-none font-bold rounded-xl">
                <a href="/login">Member Login</a>
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-grow">{children}</main>
        <BackToTopButton />
      </div>
    );
  }

  // Authenticated view (App Shell)
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-border/50 flex items-center justify-between px-4 md:px-6 sticky top-0 bg-background/80 backdrop-blur-md z-40">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hidden md:flex" />
              <div className="md:hidden flex items-center gap-3">
                <div className="bg-primary rounded-lg p-1.5">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="font-black font-lora text-xl tracking-tighter">Resonance</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isActualAdmin && <AdminViewToggle />}
              <div className="h-6 w-px bg-border mx-1 hidden md:block" />
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
            <div className="max-w-6xl mx-auto animate-fade-in-up">
              {children}
            </div>
          </main>
        </div>
      </div>
      <BottomNav />
      <ReportIssueButton />
      {user?.is_admin && <UnreadIssueReportsNotice />}
      <BackToTopButton />
    </SidebarProvider>
  );
};

export default Layout;