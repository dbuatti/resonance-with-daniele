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
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton for loading state
import { ThemeToggle } from "./ThemeToggle"; // Import ThemeToggle

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, loading } = useSession();
  const location = useLocation();
  console.log("[Layout] User:", user ? user.id : 'null', "Loading:", loading, "Path:", location.pathname);

  const handleLogout = async () => {
    console.log("[Layout] Attempting to log out user.");
    await supabase.auth.signOut();
    console.log("[Layout] User logged out.");
  };

  const displayName = user?.user_metadata?.first_name || user?.email || "Guest";

  const getNavLinkClass = (path: string) =>
    cn(
      "hover:text-primary-foreground/80", // Default hover for links on primary background
      location.pathname === path ? "text-accent font-semibold" : "text-primary-foreground" // Active link uses accent, others use primary-foreground
    );

  if (loading) {
    console.log("[Layout] Session is loading, rendering full-page skeleton.");
    return (
      <div className="min-h-screen flex flex-col"> {/* Removed bg-background text-foreground */}
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
        <main className="flex-grow container mx-auto py-8 px-4 flex items-center justify-center">
          <p className="text-lg text-muted-foreground">Loading application...</p>
        </main>
        <FooterSection /> {/* Footer can render while loading */}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col"> {/* Removed bg-background text-foreground */}
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
            <ThemeToggle /> {/* Add ThemeToggle here */}
          </nav>
          <div className="flex items-center sm:hidden"> {/* Wrap MobileNav and ThemeToggle for mobile */}
            <ThemeToggle /> {/* Add ThemeToggle here for mobile */}
            <MobileNav user={user} loading={loading} handleLogout={handleLogout} />
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