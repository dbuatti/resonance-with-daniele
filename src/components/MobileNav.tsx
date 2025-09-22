"use client";

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User as UserIcon, LogOut, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Profile } from "@/integrations/supabase/auth";

interface MobileNavProps {
  user: any;
  profile: Profile | null;
  loading: boolean;
  handleLogout: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ user, profile, loading, handleLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const getNavLinkClass = (path: string) =>
    cn(
      "block w-full text-left py-2 px-4 rounded-md text-lg font-medium transition-colors",
      location.pathname === path ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-primary/5"
    );

  // Prioritize profile data for display name and avatar
  const displayName = profile?.first_name || user?.email?.split('@')[0] || "Guest";
  const avatarUrl = profile?.avatar_url; // Use profile.avatar_url directly

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
            <span>Home</span>
          </Link>
          <Link to="/current-event" className={getNavLinkClass("/current-event")} onClick={() => setIsOpen(false)}>
            <span>Current Event</span>
          </Link>
          {!loading && user ? (
            <>
              <Link to="/resources" className={getNavLinkClass("/resources")} onClick={() => setIsOpen(false)}>
                <span>Resources</span>
              </Link>
              <Link to="/events" className={getNavLinkClass("/events")} onClick={() => setIsOpen(false)}>
                <span>Events</span>
              </Link>
              {user.is_admin && (
                <Link to="/admin" className={cn("flex items-center gap-2", getNavLinkClass("/admin"))} onClick={() => setIsOpen(false)}>
                  <Shield className="h-5 w-5" /> Admin Zone
                </Link>
              )}
              <Link to="/profile" className={cn("flex items-center gap-2", getNavLinkClass("/profile"))} onClick={() => setIsOpen(false)}>
                <Avatar className="h-7 w-7">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={`${displayName}'s avatar`} className="object-cover" />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <UserIcon className="h-4 w-4" />
                    </AvatarFallback>
                  )}
                </Avatar>
                My Profile
              </Link>
              <Button
                variant="ghost"
                className={cn(
                  "block w-full text-left py-2 px-4 rounded-md text-lg font-medium transition-colors mt-auto",
                  "text-destructive hover:bg-destructive/10 hover:text-destructive"
                )}
                onClick={() => { handleLogout(); setIsOpen(false); }}
              >
                <LogOut className="mr-2 h-5 w-5" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/events" className={getNavLinkClass("/events")} onClick={() => setIsOpen(false)}>
                <span>Events</span>
              </Link>
              <Button asChild className="mt-auto w-full">
                <Link to="/login" onClick={() => setIsOpen(false)}><span>Sign Up Now</span></Link>
              </Button>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;