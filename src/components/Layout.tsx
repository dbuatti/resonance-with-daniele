"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, loading } = useSession();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <Link to="/" className="text-2xl font-bold whitespace-nowrap">
            Resonance with Daniele
          </Link>
          <nav className="flex flex-wrap justify-center sm:justify-end gap-2">
            <Button variant="ghost" asChild>
              <Link to="/">Home</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/resources">Resources</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/events">Events</Link>
            </Button>
            {!loading && (
              user ? (
                <Button variant="ghost" onClick={handleLogout}>
                  Logout
                </Button>
              ) : (
                <Button variant="default" asChild> {/* Changed to variant="default" for logged-out users */}
                  <Link to="/login">Login</Link>
                </Button>
              )
            )}
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto py-8 px-4">
        {children}
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Layout;