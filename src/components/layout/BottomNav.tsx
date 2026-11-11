"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Library, User, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/integrations/supabase/auth";

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { user } = useSession();

  if (!user) return null;

  // "/next" is a serverless redirect to the booking provider, so it must be a
  // real anchor rather than a client-side route.
  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Sessions", icon: BookOpen, path: "/sessions" },
    { label: "Book", icon: CalendarPlus, path: "/next", external: true },
    { label: "Library", icon: Library, path: "/resources" },
    { label: "Profile", icon: User, path: "/profile" },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 z-50 px-4 pb-6 pt-3">
      <div className="flex justify-between items-end max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          if (item.external) {
            return (
              <a
                key={item.path}
                href={item.path}
                className="flex flex-col items-center gap-1 -mt-8"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition-transform active:scale-95">
                  <item.icon className="h-6 w-6" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                  {item.label}
                </span>
              </a>
            );
          }

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
