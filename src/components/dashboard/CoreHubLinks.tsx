"use client";

import React from "react";
import { Link } from "react-router-dom";
import { FileText, CalendarDays, Music, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/integrations/supabase/auth";

const coreLinks = [
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: "Session Hub",
    description: "Materials by event.",
    link: "/sessions",
    color: "text-accent-foreground",
    bg: "bg-accent/20"
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: "Resources",
    description: "Sheet music & audio.",
    link: "/resources",
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    icon: <CalendarDays className="h-6 w-6" />,
    title: "Events",
    description: "Upcoming sessions.",
    link: "/events",
    color: "text-green-500",
    bg: "bg-green-500/10",
    adminOnly: true
  },
  {
    icon: <Music className="h-6 w-6" />,
    title: "Suggestions",
    description: "Vote on songs.",
    link: "/song-suggestions",
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  },
];

const CoreHubLinks: React.FC = () => {
  const { user } = useSession();
  const isAdmin = user?.is_admin;

  const filteredLinks = coreLinks.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className={cn("grid grid-cols-2 gap-6", filteredLinks.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
      {filteredLinks.map((item, index) => (
        <Link key={index} to={item.link} className="group">
          <div className={cn(
            "h-full flex flex-col p-8 transition-all duration-300 rounded-[2rem] border-2 border-border/50 bg-card shadow-sm",
            "hover:border-primary/30 hover:shadow-2xl hover:-translate-y-2"
          )}>
            <div className={cn("mb-6 p-4 rounded-2xl w-fit transition-transform group-hover:scale-110 shadow-inner", item.bg, item.color)}>
              {item.icon}
            </div>
            <h3 className="text-2xl font-black font-lora mb-2 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              {item.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default CoreHubLinks;