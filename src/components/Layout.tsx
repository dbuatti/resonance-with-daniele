"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSession } from "@/integrations/supabase/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BackToTopButton from "./BackToTopButton";
import FooterSection from "./landing/FooterSection";
import MobileNav from "./MobileNav";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "./ThemeToggle";
import ReportIssueButton from "./ReportIssueButton";
import UnreadIssueReportsNotice from "./UnreadIssueReportsNotice";
import AdminViewToggle from "./AdminViewToggle";
import DesktopNav from "./layout/DesktopNav";
import UserAccountDropdown from "./layout/UserAccountDropdown";

interface LayoutProps {
  children: React.ReactNode;
}

const fetchUnreadAnnouncementCount = async (): Promise<number> => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("announcements")
    .select("id", { count: "exact", head: true })
    .gte("created_at", oneDayAgo);

  if (error) return 0;
  return count || 0;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { 
    user, 
    profile, 
    loading, 
    isLoggingOut, 
    logout, 
    isActualAdmin, 
    incompleteTasksCount, 
    isProfileCompleted, 
    isSurveyCompleted 
  } = useSession();
  
  const { data: unreadAnnouncementCount } = useQuery<number, Error, number, ['unreadAnnouncementCount']>({
    queryKey: ['unreadAnnouncementCount'],
    queryFn: fetchUnreadAnnouncementCount,
    enabled: !!user,
    refetchInterval: 60 * 1000,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-primary text-primary-foreground p-4 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <Skeleton className="h-8 w-48 bg-primary-foreground/20" />
            <div className="hidden sm:flex gap-2">
              <Skeleton className="h-8 w-20 bg-primary-foreground/20" />
              <Skeleton className="h-8 w-20 bg-primary-foreground/20" />
            </div>
          </div>
        </header>
        <main className="flex-grow flex items-center justify-center bg-background">
          <p className="text-lg text-muted-foreground">Loading application...</p>
        </main>
        <FooterSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold whitespace-nowrap font-lora text-primary-foreground">
            Resonance with Daniele
          </Link>
          <nav className="hidden sm:flex items-center gap-2">
            {isActualAdmin && <AdminViewToggle />}
            <DesktopNav user={user} unreadAnnouncementCount={unreadAnnouncementCount} />
            {user && (
              <UserAccountDropdown 
                user={user}
                profile={profile}
                isLoggingOut={isLoggingOut}
                logout={logout}
                incompleteTasksCount={incompleteTasksCount}
                isProfileCompleted={isProfileCompleted}
                isSurveyCompleted={isSurveyCompleted}
              />
            )}
            <ThemeToggle />
          </nav>
          <div className="flex items-center sm:hidden">
            <ThemeToggle />
            <MobileNav />
          </div>
        </div>
      </header>
      <main className="flex-grow bg-background">
        {/* Container removed from here to allow full-width backgrounds in landing sections */}
        {children}
      </main>
      <FooterSection />
      <BackToTopButton />
      <ReportIssueButton />
      {user?.is_admin && <UnreadIssueReportsNotice />}
    </div>
  );
};

export default Layout;