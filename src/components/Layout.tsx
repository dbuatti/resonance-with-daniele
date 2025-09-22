"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, loading } = useSession();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const displayName = user?.user_metadata?.first_name || user?.email || "Guest";

  console.log("Layout.tsx - user?.user_metadata?.avatar_url:", user?.user_metadata?.avatar_url); // Added log

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <Link to="/" className="text-2xl font-bold whitespace-nowrap font-lora">
            Resonance with Daniele
          </Link>
          <nav className="flex flex-wrap justify-center sm:justify-end gap-2 items-center">
            <Button variant="ghost" asChild>
              <Link to="/">Home</Link>
            </Button>
            {!loading && user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/resources">Resources</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/events">Events</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/profile" className="flex items-center gap-2">
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
                <Button variant="ghost" asChild>
                  <Link to="/events">Events</Link>
                </Button>
                <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
                  <Link to="/login">Sign Up Now</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto py-8 px-4">
        {children}
      </main>
    </div>
  );
};

export default Layout;