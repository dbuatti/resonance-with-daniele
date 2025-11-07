"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { FileText, CalendarDays, Music, Users, Mic2, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

const coreLinks = [
  {
    icon: <FileText className="h-8 w-8 text-primary" />,
    title: "Resources & Practice",
    description: "Access sheet music, audio tracks, and vocal tutorials.",
    link: "/resources",
  },
  {
    icon: <CalendarDays className="h-8 w-8 text-primary" />,
    title: "Events & Schedule",
    description: "View upcoming sessions, RSVP, and check performance dates.",
    link: "/events",
  },
  {
    icon: <Music className="h-8 w-8 text-primary" />,
    title: "Song Suggestions",
    description: "Suggest new songs and vote on the choir's next repertoire.",
    link: "/song-suggestions",
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "Community & Media",
    description: "Connect with members and view performance highlights.",
    link: "/resources?folderId=media", // Placeholder link for media/community folder
  },
];

const CoreHubLinks: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {coreLinks.map((item, index) => (
        <Link key={index} to={item.link} className="block h-full">
          <Card className={cn(
            "h-full flex flex-col items-start p-6 transition-all duration-200 border-l-4 border-primary/50",
            "hover:bg-muted/50 hover:shadow-md"
          )}>
            <div className="mb-4">{item.icon}</div>
            <CardTitle className="text-xl font-lora font-semibold mb-1">
              {item.title}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              {item.description}
            </CardDescription>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default CoreHubLinks;