"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Library, Music, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/integrations/supabase/auth";

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { user } = useSession();

  if (!user) return null;

  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Sessions", icon: BookOpen, path: "/sessions" },
    { label: "Library", icon: Library, path: "/resources" },
    { label: "Profile", icon: User, path: "/profile" },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 z-50 px-6 pb-6 pt-3">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-300",
                isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all",
                isActive && "bg-primary/10"
              )}>
                <item.icon className={cn("h-6 w-6", isActive && "fill-current")} />
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                isActive ? "opacity-100" : "opacity-50"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;