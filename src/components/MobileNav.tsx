"use client";

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  Home,
  Info,
  FileText,
  CalendarDays,
  Music,
  Shield,
  User as UserIcon,
  LogOut,
  Loader2,
  Settings, // Added for profile link
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useSession } from "@/integrations/supabase/auth";
import { Badge } from "@/components/ui/badge"; // Import Badge
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Query function to fetch unread announcement count (simulated)
const fetchUnreadAnnouncementCount = async (): Promise<number> => {
  // NOTE: This is a placeholder query. In a real app, this would query a user_announcement_read_status table.
  // For now, we check if any announcement was created in the last 24 hours.
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { count, error } = await supabase
    .from("announcements")
    .select("id", { count: "exact", head: true })
    .gte("created_at", oneDayAgo);

  if (error) {
    console.error("Error fetching unread announcement count:", error);
    return 0;
  }
  return count || 0;
};

const MobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, profile, loading, isLoggingOut, logout, incompleteTasksCount } = useSession(); // Access session context

  // Fetch unread announcement count
  const { data: unreadAnnouncementCount } = useQuery<number, Error, number, ['unreadAnnouncementCount']>({
    queryKey: ['unreadAnnouncementCount'],
    queryFn: fetchUnreadAnnouncementCount,
    enabled: !!user,
    refetchInterval: 60 * 1000, // Check every minute
  });

  const getNavLinkClass = (path: string) =>
    cn(
      "flex items-center gap-3 w-full text-left py-3 px-4 rounded-md text-lg font-medium transition-colors",
      location.pathname === path ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-primary/5"
    );

  // Prioritize profile data for display name and avatar
  const displayName = profile?.first_name || user?.email?.split('@')[0] || "Guest";
  const avatarUrl = profile?.avatar_url;

  const handleLogoutClick = async () => {
    await logout(); // Call the centralized logout function
    setIsOpen(false); // Close the mobile nav after logout
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="sm:hidden text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] bg-card flex flex-col">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold font-lora text-primary">Resonance with Daniele</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2 flex-grow">
          <Link to="/" className={getNavLinkClass("/")} onClick={() => setIsOpen(false)}>
            <div className="relative flex items-center gap-3">
              <Home className="h-5 w-5" />
              <span>Home</span>
              {unreadAnnouncementCount && unreadAnnouncementCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 left-16 h-4 w-4 p-0 flex items-center justify-center text-xs font-bold rounded-full ring-2 ring-card">
                  {unreadAnnouncementCount}
                </Badge>
              )}
            </div>
          </Link>
          {!user && ( // Only show "Learn More" if user is not logged in
            <Link to="/learn-more" className={getNavLinkClass("/learn-more")} onClick={() => setIsOpen(false)}>
              <Info className="h-5 w-5" />
              <span>Learn More</span>
            </Link>
          )}
          {!loading && user ? (
            <>
              <Link to="/resources" className={getNavLinkClass("/resources")} onClick={() => setIsOpen(false)}>
                <FileText className="h-5 w-5" />
                <span>Resources</span>
              </Link>
              <Link to="/events" className={getNavLinkClass("/events")} onClick={() => setIsOpen(false)}>
                <CalendarDays className="h-5 w-5" />
                <span>Events</span>
              </Link>
              <Link to="/song-suggestions" className={getNavLinkClass("/song-suggestions")} onClick={() => setIsOpen(false)}>
                <Music className="h-5 w-5" />
                <span>Song Suggestions</span>
              </Link>
              {user.is_admin && (
                <Link to="/admin" className={getNavLinkClass("/admin")} onClick={() => setIsOpen(false)}>
                  <Shield className="h-5 w-5" />
                  <span>Admin Zone</span>
                </Link>
              )}
              <Link to="/profile" className={getNavLinkClass("/profile")} onClick={() => setIsOpen(false)}>
                <div className="relative flex items-center">
                  <Avatar className="h-7 w-7">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={`${displayName}'s avatar`} className="object-cover" />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        <UserIcon className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {incompleteTasksCount > 0 && (
                    <Badge variant="destructive" className="absolute top-0 left-5 h-4 w-4 p-0 flex items-center justify-center text-xs font-bold rounded-full ring-2 ring-card">
                      {incompleteTasksCount}
                    </Badge>
                  )}
                </div>
                <span>My Profile</span>
              </Link>
              <Button
                variant="ghost"
                className={cn(
                  "flex items-center gap-3 w-full text-left py-3 px-4 rounded-md text-lg font-medium transition-colors mt-auto",
                  "text-destructive hover:bg-destructive/10 hover:text-destructive"
                )}
                onClick={handleLogoutClick}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogOut className="mr-2 h-5 w-5" />}
                <span>Logout</span>
              </Button>
            </>
          ) : (
            <>
              <Link to="/events" className={getNavLinkClass("/events")} onClick={() => setIsOpen(false)}>
                <CalendarDays className="h-5 w-5" />
                <span>Events</span>
              </Link>
              <Button asChild className="mt-auto w-full">
                <Link to="/login" onClick={() => setIsOpen(false)}><span>Get Started</span></Link>
              </Button>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;