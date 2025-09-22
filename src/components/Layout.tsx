"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import BackToTopButton from "./BackToTopButton";
import FooterSection from "./landing/FooterSection";
import MobileNav from "./MobileNav";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "./ThemeToggle";
import { usePageLoading } from "@/contexts/PageLoadingContext"; // Import usePageLoading

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, loading: loadingSession } = useSession();
  const { pageLoading } = usePageLoading(); // Consume pageLoading state
  const location = useLocation();
  
  console.log("[Layout] User:", user ? user.id : 'null', "Loading Session:", loadingSession, "Page Loading:", pageLoading, "Path:", location.pathname);

  const handleLogout = async () => {
    console.log("[Layout] Attempting to log out user.");
    await supabase.auth.signOut();
    console.log("[Layout] User logged out.");
  };

  const displayName = user?.user_metadata?.first_name || user?.email || "Guest";

  const getNavLinkClass = (path: string) =>
    cn(
      "hover:text-primary-foreground/80",
      location.pathname === path ? "text-accent font-semibold" : "text-primary-foreground"
    );

  // Show global skeleton if session is loading OR if the current page component is still loading its data
  if (loadingSession || pageLoading) { 
    console.log("[Layout] Session or Page is loading, rendering full-page skeleton.");
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-primary text-primary-foreground p-4 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <Skeleton className="h-8 w-48 bg-primary-foreground/20" />
            <div className="hidden sm:flex gap-2">
              <Skeleton className="h-8 w-20 bg-primary-foreground/20" />
              <Skeleton className="h-8 w-20 bg-primary-foreground/20" />
              <Skeleton className="h-8 w-28 bg-primary-foreground/20" />
            </div>
            <Skeleton className="h-8 w-8 sm:hidden bg-primary-foreground/20 rounded-md" />
          </div>
        </header>
        <main className="flex-grow container mx-auto py-8 px-4">
          {/* Enhanced skeleton for the main content area */}
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-6 border rounded-lg shadow-sm space-y-4">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        </main>
        <FooterSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold whitespace-nowrap font-lora text-primary-foreground">
            Resonance with Daniele
          </Link>
          <nav className="hidden sm:flex flex-wrap justify-end gap-2 items-center">
            <Button variant="ghost" asChild>
              <Link to="/" className={getNavLinkClass("/")}><span>Home</span></Link>
            </Button>
            {user ? (
              <>
                {console.log("[Layout] User is logged in, rendering authenticated nav links.")}
                <Button variant="ghost" asChild>
                  <Link to="/resources" className={getNavLinkClass("/resources")}><span>Resources</span></Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/events" className={getNavLinkClass("/events")}><span>Events</span></Link>
                </Button>
                {user.is_admin && (
                  <>
                    {console.log("[Layout] User is admin, rendering Admin Zone link.")}
                    <Button variant="ghost" asChild>
                      <Link to="/admin" className={cn("flex items-center gap-2", getNavLinkClass("/admin"))}>
                        <Shield className="h-4 w-4" /> Admin Zone
                      </Link>
                    </Button>
                  </>
                )}
                <Button variant="ghost" asChild>
                  <Link to="/profile" className={cn("flex items-center gap-2", getNavLinkClass("/profile"))}>
                    <Avatar className="h-6 w-6">
                      {user.user_metadata?.avatar_url ? (
                        <AvatarImage src={user.user_metadata.avatar_url} alt={`${displayName}'s avatar`} className="object-cover" />
                      ) : (
                        <AvatarFallback className="bg-primary-foreground text-primary">
                          <UserIcon className="h-4 w-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    My Profile
                  </Link>
                </Button>
                <Button variant="ghost" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                {console.log("[Layout] User is NOT logged in, rendering public nav links.")}
                <Button variant="ghost" asChild>
                  <Link to="/events" className={getNavLinkClass("/events")}><span>Events</span></Link>
                </Button>
                <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
                  <Link to="/login"><span>Sign Up Now</span></Link>
                </Button>
              </>
            )}
            <ThemeToggle />
          </nav>
          <div className="flex items-center sm:hidden">
            <ThemeToggle />
            <MobileNav user={user} loading={loadingSession} handleLogout={handleLogout} />
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto py-8 px-4">
        {children}
      </main>
      <FooterSection />
      <BackToTopButton />
    </div>
  );
};

export default Layout;