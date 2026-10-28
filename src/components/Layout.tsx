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
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import resonanceLogo from "@/assets/resonance-logo.png";

interface LayoutProps { children: React.ReactNode; }

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

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/60">
          <div className="mx-auto max-w-6xl w-full flex justify-between items-center px-4 md:px-6 py-3 md:py-4">
            <a href="/" className="flex items-center gap-2.5">
              <img src={resonanceLogo} alt="Resonance" className="h-9 w-9 rounded-lg" />
              <span className="text-lg md:text-xl font-black font-lora tracking-tight text-foreground">
                Resonance
              </span>
            </a>
            <nav className="flex items-center gap-2 md:gap-4">
              <ThemeToggle />
              <Button asChild variant="ghost" className="hidden md:inline-flex font-semibold">
                <a href="/learn-more">How it works</a>
              </Button>
              <Button asChild className="rounded-lg font-bold px-4 md:px-5">
                <a href="/next">Book Your Spot</a>
              </Button>
              <Button asChild variant="outline" className="hidden sm:inline-flex rounded-lg font-semibold">
                <a href="/login">Member Login</a>
              </Button>
            </nav>
          </div>
        </header>
        <main className="flex-grow w-full">{children}</main>
        <BackToTopButton />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Consistent Header for Trigger */}
          <header className="h-14 border-b border-border/50 flex items-center px-4 sticky top-0 bg-background/80 backdrop-blur-md z-40">
            <SidebarTrigger className="h-9 w-9 rounded-lg hover:bg-muted transition-colors" />
            <Link to="/" className="md:hidden flex items-center gap-3 ml-4">
              <img src={resonanceLogo} alt="Resonance" className="h-8 w-8 rounded-lg" />
              <span className="font-black font-lora text-lg tracking-tighter">Resonance</span>
            </Link>
          </header>

          <main className="flex-1 p-4 md:p-8 pt-4 md:pt-6 pb-24 md:pb-8">
            <div className="w-full animate-fade-in-up">
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