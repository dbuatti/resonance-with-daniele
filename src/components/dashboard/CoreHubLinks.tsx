"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { FileText, CalendarDays, Music, Users, Mic2, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

const coreLinks = [
  {
    icon: <FileText className="h-6 w-6 text-primary" />,
    title: "Resources",
    description: "Sheet music, audio, and tutorials.",
    link: "/resources",
  },
  {
    icon: <CalendarDays className="h-6 w-6 text-primary" />,
    title: "Events",
    description: "Upcoming sessions and RSVPs.",
    link: "/events",
  },
  {
    icon: <Music className="h-6 w-6 text-primary" />,
    title: "Suggestions",
    description: "Suggest and vote on songs.",
    link: "/song-suggestions",
  },
  {
    icon: <Users className="h-6 w-6 text-primary" />,
    title: "Community",
    description: "Connect and view highlights.",
    link: "/resources?folderId=media",
  },
];

const CoreHubLinks: React.FC = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {coreLinks.map((item, index) => (
        <Link key={index} to={item.link} className="block h-full">
          <Card className={cn(
            "h-full flex flex-col items-start p-4 transition-all duration-200 border-l-4 border-primary/50 rounded-xl",
            "hover:bg-muted/50 hover:shadow-md"
          )}>
            <div className="mb-3 bg-primary/5 p-2 rounded-lg">{item.icon}</div>
            <CardTitle className="text-base font-lora font-bold mb-0.5">
              {item.title}
            </CardTitle>
            <CardDescription className="text-[11px] leading-tight text-muted-foreground">
              {item.description}
            </CardDescription>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default CoreHubLinks;