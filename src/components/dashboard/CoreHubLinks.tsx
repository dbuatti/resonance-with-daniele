"use client";

import React from "react";
import { Link } from "react-router-dom";
import { FileText, CalendarDays, Music, Users, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const coreLinks = [
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: "Session Hub",
    description: "Materials by event.",
    link: "/sessions",
    color: "text-accent-foreground",
    bg: "bg-accent/20"
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "Resources",
    description: "Sheet music & audio.",
    link: "/resources",
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    icon: <CalendarDays className="h-5 w-5" />,
    title: "Events",
    description: "Upcoming sessions.",
    link: "/events",
    color: "text-green-500",
    bg: "bg-green-500/10"
  },
  {
    icon: <Music className="h-5 w-5" />,
    title: "Suggestions",
    description: "Vote on songs.",
    link: "/song-suggestions",
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  },
];

const CoreHubLinks: React.FC = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {coreLinks.map((item, index) => (
        <Link key={index} to={item.link} className="group">
          <div className={cn(
            "h-full flex flex-col p-5 transition-all duration-300 rounded-2xl border border-border/50 bg-card",
            "hover:border-primary/30 hover:shadow-lg hover:-translate-y-1"
          )}>
            <div className={cn("mb-4 p-2.5 rounded-xl w-fit transition-transform group-hover:scale-110", item.bg, item.color)}>
              {item.icon}
            </div>
            <h3 className="text-lg font-black font-lora mb-1 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            <p className="text-xs font-medium text-muted-foreground leading-tight">
              {item.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default CoreHubLinks;