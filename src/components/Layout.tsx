"use client";

import React from "react";
import { Link } from "react-router-dom";
import { useSession } from "@/integrations/supabase/auth";
import AppSidebar from "./layout/AppSidebar";
import BottomNav from "./layout/BottomNav";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";
import ReportIssueButton from "./ReportIssueButton";
import UnreadIssueReportsNotice from "./UnreadIssueReportsNotice";
import BackToTopButton from "./BackToTopButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import resonanceLogo from "@/assets/resonance-logo.webp";

interface LayoutProps { children: React.ReactNode; }

const SkipLink = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:font-bold focus:text-primary-foreground focus:shadow-lg"
  >
    Skip to content
  </a>
);

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
        <SkipLink />
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/60">
          <div className="mx-auto max-w-6xl w-full flex justify-between items-center px-4 md:px-6 py-3 md:py-4">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={resonanceLogo} alt="Resonance" className="h-9 w-9 rounded-lg" />
              <span className="text-lg md:text-xl font-black font-lora tracking-tight text-foreground">
                Resonance
              </span>
            </Link>
            <nav aria-label="Main" className="flex items-center gap-2 md:gap-4">
              <ThemeToggle />
              <Button asChild variant="ghost" className="hidden md:inline-flex font-semibold">
                <Link to="/learn-more">How it works</Link>
              </Button>
              <Button asChild className="rounded-lg font-bold px-4 md:px-5">
                <a href="/next">Book Your Spot</a>
              </Button>
              <Button asChild variant="outline" className="hidden sm:inline-flex rounded-lg font-semibold">
                <Link to="/login">Member Login</Link>
              </Button>
            </nav>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="flex-grow w-full focus:outline-none">{children}</main>
        <BackToTopButton />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <SkipLink />
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

          <main id="main-content" tabIndex={-1} className="flex-1 p-4 md:p-8 pt-4 md:pt-6 pb-24 md:pb-8 focus:outline-none">
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