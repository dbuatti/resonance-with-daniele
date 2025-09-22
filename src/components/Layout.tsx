"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Shield } from "lucide-react"; // Import Shield icon
import { cn } from "@/lib/utils";
import BackToTopButton from "./BackToTopButton";
import FooterSection from "./landing/FooterSection";
import MobileNav from "./MobileNav";

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
      "hover:text-primary-foreground/80",
      location.pathname === path && "text-accent font-semibold"
    );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold whitespace-nowrap font-lora">
            Resonance with Daniele
          </Link>
          <nav className="hidden sm:flex flex-wrap justify-end gap-2 items-center">
            <Button variant="ghost" asChild>
              <Link to="/" className={getNavLinkClass("/")}>Home</Link>
            </Button>
            {!loading && user ? (
              <>
                {console.log("[Layout] User is logged in, rendering authenticated nav links.")}
                <Button variant="ghost" asChild>
                  <Link to="/resources" className={getNavLinkClass("/resources")}>Resources</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/events" className={getNavLinkClass("/events")}>Events</Link>
                </Button>
                {user.is_admin && ( // Conditionally render Admin Zone link
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
                  <Link to="/events" className={getNavLinkClass("/events")}>Events</Link>
                </Button>
                <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
                  <Link to="/login">Sign Up Now</Link>
                </Button>
              </>
            )}
          </nav>
          <MobileNav user={user} loading={loading} handleLogout={handleLogout} />
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