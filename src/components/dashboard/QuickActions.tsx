"use client";

import React from "react";
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
    <div className="space-y-6">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" /> Quick Actions
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {actions.map((action, i) => (
          <Button 
            key={i}
            variant="ghost" 
            className="w-full justify-between h-16 px-6 hover:bg-muted/50 group rounded-2xl border border-border/50 bg-card shadow-sm"
            asChild={!!action.link}
            onClick={action.onClick}
          >
            {action.link ? (
              <Link to={action.link}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${action.bg} ${action.color} transition-transform group-hover:scale-110 shadow-inner`}>
                    {action.icon}
                  </div>
                  <span className="font-black text-base">{action.label}</span>
                </div>
                <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 text-primary" />
              </Link>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${action.bg} ${action.color} transition-transform group-hover:scale-110 shadow-inner`}>
                    {action.icon}
                  </div>
                  <span className="font-black text-base">{action.label}</span>
                </div>
                <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 text-primary" />
              </div>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;