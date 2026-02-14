"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Info, FileText, CalendarDays, Music, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface DesktopNavProps {
  user: any;
  unreadAnnouncementCount?: number;
}

const DesktopNav: React.FC<DesktopNavProps> = ({ user, unreadAnnouncementCount }) => {
  const location = useLocation();

  const getNavLinkClass = (path: string) =>
    cn(
      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
      "hover:bg-primary-foreground/10 hover:text-primary-foreground",
      location.pathname === path ? "bg-primary-foreground/20 text-accent font-semibold" : "text-primary-foreground"
    );

  return (
    <div className="hidden sm:flex items-center gap-2">
      <Button variant="ghost" asChild className={getNavLinkClass("/")}>
        <Link to="/" className="relative">
          <Home className="h-4 w-4" />
          <span>Home</span>
          {unreadAnnouncementCount && unreadAnnouncementCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-3 h-4 w-4 p-0 flex items-center justify-center text-xs font-bold rounded-full ring-2 ring-primary">
              {unreadAnnouncementCount}
            </Badge>
          )}
        </Link>
      </Button>

      {!user && (
        <Button variant="ghost" asChild className={getNavLinkClass("/learn-more")}>
          <Link to="/learn-more">
            <Info className="h-4 w-4" />
            <span>Learn More</span>
          </Link>
        </Button>
      )}

      {user && (
        <>
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
            <Button variant="ghost" asChild className={getNavLinkClass("/admin")}>
              <Link to="/admin">
                <Shield className="h-4 w-4" />
                <span>Admin Zone</span>
              </Link>
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default DesktopNav;