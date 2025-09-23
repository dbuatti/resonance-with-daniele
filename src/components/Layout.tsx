"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Shield, Music, Loader2 } from "lucide-react"; // Import Music and Loader2 icon
import { cn } from "@/lib/utils";
import BackToTopButton from "./BackToTopButton";
import FooterSection from "./landing/FooterSection";
import MobileNav from "./MobileNav";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "./ThemeToggle";
import { showError } from "@/utils/toast";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, profile, loading, isLoggingOut, setIsLoggingOut } = useSession(); // Get isLoggingOut and setIsLoggingOut
  const location = useLocation();
  console.log("[Layout] User:", user ? user.id : 'null', "Profile:", profile ? 'present' : 'null', "Loading:", loading, "Path:", location.pathname);

  const handleLogout = async () => {
    setIsLoggingOut(true); // Set logging out state
    console.log("[Layout] Attempting to log out user.");
    try {
      if (user) { // Only attempt to sign out if a user (and thus a session) is present
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("[Layout] Error during logout:", error);
          showError("Failed to log out: " + error.message);
        } else {
          showSuccess("Logged out successfully!");
          console.log("[Layout] User logged out.");
        }
      } else {
        console.log("[Layout] No active user session found, no server-side logout needed.");
        showSuccess("Logged out successfully!"); // Just confirm local state is cleared
      }
    } catch (error: any) {
      console.error("[Layout] Unexpected error during logout:", error);
      showError("An unexpected error occurred during logout: " + error.message);
    } finally {
      setIsLoggingOut(false); // Reset logging out state
    }
  };

  const displayName = profile?.first_name || user?.email?.split('@')[0] || "Guest";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  const getNavLinkClass = (path: string) =>
    cn(
      "hover:text-primary-foreground/80",
      location.pathname === path ? "text-accent font-semibold" : "text-primary-foreground"
    );

  if (loading) {
    console.log("[Layout] Session is loading, rendering full-page skeleton.");
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
        <main className="flex-grow flex items-center justify-center bg-background">
          <p className="text-lg text-muted-foreground">Loading application...</p>
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
            <Button variant="ghost" asChild className="dark:hover:bg-primary/20 dark:hover:text-primary-foreground">
              <Link to="/" className={getNavLinkClass("/")}><span>Home</span></Link>
            </Button>
            <Button variant="ghost" asChild className="dark:hover:bg-primary/20 dark:hover:text-primary-foreground">
              <Link to="/learn-more" className={getNavLinkClass("/learn-more")}><span>Learn More</span></Link>
            </Button>
            <Button variant="ghost" asChild className="dark:hover:bg-primary/20 dark:hover:text-primary-foreground">
              <Link to="/current-event" className={cn(getNavLinkClass("/current-event"), "text-accent font-bold")}><span>COMING UP!</span></Link>
            </Button>
            {user ? (
              <>
                {console.log("[Layout] User is logged in, rendering authenticated nav links.")}
                <Button variant="ghost" asChild className="dark:hover:bg-primary/20 dark:hover:text-primary-foreground">
                  <Link to="/resources" className={getNavLinkClass("/resources")}><span>Resources</span></Link>
                </Button>
                <Button variant="ghost" asChild className="dark:hover:bg-primary/20 dark:hover:text-primary-foreground">
                  <Link to="/events" className={getNavLinkClass("/events")}><span>Events</span></Link>
                </Button>
                <Button variant="ghost" asChild className="dark:hover:bg-primary/20 dark:hover:text-primary-foreground">
                  <Link to="/song-suggestions" className={cn("flex items-center gap-2", getNavLinkClass("/song-suggestions"))}>
                    <Music className="h-4 w-4" /> Song Suggestions
                  </Link>
                </Button>
                {user.is_admin && (
                  <>
                    {console.log("[Layout] User is admin, rendering Admin Zone link.")}
                    <Button variant="ghost" asChild className="dark:hover:bg-primary/20 dark:hover:text-primary-foreground">
                      <Link to="/admin" className={cn("flex items-center gap-2", getNavLinkClass("/admin"))}>
                        <Shield className="h-4 w-4" /> Admin Zone
                      </Link>
                    </Button>
                  </>
                )}
                <Button variant="ghost" asChild className="dark:hover:bg-primary/20 dark:hover:text-primary-foreground">
                  <Link to="/profile" className={cn("flex items-center gap-2", getNavLinkClass("/profile"))}>
                    <Avatar className="h-6 w-6">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt={`${displayName}'s avatar`} className="object-cover" />
                      ) : (
                        <AvatarFallback className="bg-primary-foreground text-primary">
                          <UserIcon className="h-4 w-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    My Profile
                  </Link>
                </Button>
                <Button variant="ghost" onClick={handleLogout} className="dark:hover:bg-primary/20 dark:hover:text-primary-foreground" disabled={isLoggingOut}>
                  {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Logout
                </Button>
              </>
            ) : (
              <>
                {console.log("[Layout] User is NOT logged in, rendering public nav links.")}
                <Button variant="ghost" asChild className="dark:hover:bg-primary/20 dark:hover:text-primary-foreground">
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
            <MobileNav user={user} loading={loading} handleLogout={handleLogout} profile={profile} isLoggingOut={isLoggingOut} /> {/* Pass isLoggingOut */}
          </div>
        </div>
      </header>
      <main className="flex-grow bg-background">
        <div className="container mx-auto"> {/* Centralized container for all page content */}
          {children}
        </div>
      </main>
      <FooterSection />
      <BackToTopButton />
    </div>
  );
};

export default Layout;