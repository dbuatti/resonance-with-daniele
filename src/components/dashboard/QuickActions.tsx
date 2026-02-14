"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Music, MessageSquare, User, Zap, Calendar, ArrowRight } from "lucide-react";

const QuickActions: React.FC = () => {
  const actions = [
    {
      label: "Suggest a Song",
      icon: <Music className="h-4 w-4" />,
      link: "/song-suggestions",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      label: "Update Profile",
      icon: <User className="h-4 w-4" />,
      link: "/profile",
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
    {
      label: "RSVP to Event",
      icon: <Calendar className="h-4 w-4" />,
      link: "/current-event",
      color: "text-green-500",
      bg: "bg-green-500/10"
    },
    {
      label: "Report Issue",
      icon: <MessageSquare className="h-4 w-4" />,
      onClick: () => {
        const reportBtn = document.querySelector('button[aria-haspopup="dialog"]') as HTMLButtonElement;
        if (reportBtn) reportBtn.click();
      },
      color: "text-red-500",
      bg: "bg-red-500/10"
    }
  ];

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-lora flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" /> Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3">
        {actions.map((action, i) => (
          <Button 
            key={i}
            variant="ghost" 
            className="w-full justify-between h-12 px-4 hover:bg-muted group"
            asChild={!!action.link}
            onClick={action.onClick}
          >
            {action.link ? (
              <Link to={action.link}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${action.bg} ${action.color}`}>
                    {action.icon}
                  </div>
                  <span className="font-medium">{action.label}</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </Link>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${action.bg} ${action.color}`}>
                    {action.icon}
                  </div>
                  <span className="font-medium">{action.label}</span>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </div>
            )}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuickActions;