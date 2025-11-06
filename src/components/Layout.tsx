"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSession } from "@/integrations/supabase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  Info,
  FileText,
  CalendarDays,
  Music,
  Shield,
  User as UserIcon,
  LogOut,
  Loader2,
  Settings, // Added for profile dropdown item
} from "lucide-react";
import { cn } from "@/lib/utils";
import BackToTopButton from "./BackToTopButton";
import FooterSection from "./landing/FooterSection";
import MobileNav from "./MobileNav";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReportIssueButton from "./ReportIssueButton";
import UnreadIssueReportsNotice from "./UnreadIssueReportsNotice";
import AdminViewToggle from "./AdminViewToggle"; // Import the new component

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, profile, loading, isLoggingOut, logout, isActualAdmin } = useSession(); // Use isActualAdmin
  const location = useLocation();
  console.log("[Layout] User:", user ? user.id : 'null', "Profile:", profile ? 'present' : 'null', "Loading:", loading, "Path:", location.pathname);

  const handleLogout = async () => {
    await logout(); // Call the centralized logout function
  };

  const displayName = profile?.first_name || user?.email?.split('@')[0] || "Guest";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  const getNavLinkClass = (path: string) =>
    cn(
      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
      "hover:bg-primary-foreground/10 hover:text-primary-foreground",
      location.pathname === path ? "bg-primary-foreground/20 text-accent font-semibold" : "text-primary-foreground"
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
            {isActualAdmin && <AdminViewToggle />} {/* Use isActualAdmin here */}
            <Button variant="ghost" asChild className={getNavLinkClass("/")}>
              <Link to="/">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
            </Button>
            {!user && ( // Only show "Learn More" if user is not logged in
              <Button variant="ghost" asChild className={getNavLinkClass("/learn-more")}>
                <Link to="/learn-more">
                  <Info className="h-4 w-4" />
                  <span>Learn More</span>
                </Link>
              </Button>
            )}
            <Button variant="ghost" asChild className={cn(getNavLinkClass("/current-event"), "text-accent font-bold")}>
              <Link to="/current-event">
                <CalendarDays className="h-4 w-4" />
                <span>COMING UP!</span>
              </Link>
            </Button>
            {user ? (
              <>
                {console.log("[Layout] User is logged in, rendering authenticated nav links.")}
                <Button variant="ghost" asChild className={getNavLinkClass("/resources")}>
                  <Link to="/resources">
                    <FileText className="h-4 w-4" />
                    <span>Resources</span>
                  </Link>
                </Button>
                <Button variant="ghost" asChild className={getNavLinkClass("/events")}>
                  <Link to="/events">
                    <CalendarDays className="h-4 w-4" />
                    <span>Events</span>
                  </Link>
                </Button>
                <Button variant="ghost" asChild className={getNavLinkClass("/song-suggestions")}>
                  <Link to="/song-suggestions">
                    <Music className="h-4 w-4" />
                    <span>Song Suggestions</span>
                  </Link>
                </Button>
                {user.is_admin && (
                  <>
                    {console.log("[Layout] User is admin, rendering Admin Zone link.")}
                    <Button variant="ghost" asChild className={getNavLinkClass("/admin")}>
                      <Link to="/admin">
                        <Shield className="h-4 w-4" />
                        <span>Admin Zone</span>
                      </Link>
                    </Button>
                  </>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                      <Avatar className="h-7 w-7">
                        {avatarUrl ? (
                          <AvatarImage src={avatarUrl} alt={`${displayName}'s avatar`} className="object-cover" />
                        ) : (
                          <AvatarFallback className="bg-primary-foreground text-primary text-xs">
                            <UserIcon className="h-4 w-4" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span>{displayName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile/survey" className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        <span>My Survey</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                      {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {console.log("[Layout] User is NOT logged in, rendering public nav links.")}
                <Button variant="ghost" asChild className={getNavLinkClass("/events")}>
                  <Link to="/events">
                    <CalendarDays className="h-4 w-4" />
                    <span>Events</span>
                  </Link>
                </Button>
                <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
                  <Link to="/login"><span>Get Started</span></Link>
                </Button>
              </>
            )}
            <ThemeToggle />
          </nav>
          <div className="flex items-center sm:hidden">
            <ThemeToggle />
            <MobileNav /> {/* MobileNav now gets its props from useSession */}
          </div>
        </div>
      </header>
      <main className="flex-grow bg-background">
        <div className="container mx-auto max-w-6xl px-4">
          {children}
        </div>
      </main>
      <FooterSection />
      <BackToTopButton />
      <ReportIssueButton />
      {user?.is_admin && <UnreadIssueReportsNotice />}
    </div>
  );
};

export default Layout;