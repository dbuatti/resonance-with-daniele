"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { User as UserIcon, ClipboardList, CalendarDays, FileText, Music, Shield, Settings } from "lucide-react";
import { useSession } from "@/integrations/supabase/auth";
import { cn } from "@/lib/utils";

const QuickActionsCard: React.FC = () => {
  const { user, profile } = useSession();

  if (!user) {
    return null; // This card is only for logged-in users
  }

  const isSurveyCompleted = profile ? (
    profile.how_heard !== null ||
    (profile.motivation !== null && profile.motivation.length > 0) ||
    profile.attended_session !== null ||
    profile.singing_experience !== null ||
    profile.session_frequency !== null ||
    profile.preferred_time !== null ||
    (profile.music_genres !== null && profile.music_genres.length > 0) ||
    profile.choir_goals !== null ||
    profile.inclusivity_importance !== null ||
    profile.suggestions !== null
  ) : false;

  const actions = [
    {
      icon: <UserIcon className="h-6 w-6 text-primary" />,
      title: "My Profile",
      description: "View and update your personal details.",
      link: "/profile",
    },
    {
      icon: <ClipboardList className="h-6 w-6 text-primary" />,
      title: "My Survey",
      description: isSurveyCompleted ? "Review your completed survey." : "Complete your market research survey.",
      link: "/profile/survey",
      badge: isSurveyCompleted ? "(Completed)" : "(Pending)",
      badgeVariant: isSurveyCompleted ? "secondary" : "default",
    },
    {
      icon: <CalendarDays className="h-6 w-6 text-primary" />,
      title: "Events",
      description: "See upcoming sessions and performances.",
      link: "/events",
    },
    {
      icon: <FileText className="h-6 w-6 text-primary" />,
      title: "Resources",
      description: "Access sheet music, tracks, and tutorials.",
      link: "/resources",
    },
    {
      icon: <Music className="h-6 w-6 text-primary" />,
      title: "Song Suggestions",
      description: "Suggest and vote for new choir songs.",
      link: "/song-suggestions",
    },
  ];

  if (user.is_admin) {
    actions.push({
      icon: <Shield className="h-6 w-6 text-primary" />,
      title: "Admin Zone",
      description: "Manage members, events, and content.",
      link: "/admin",
    });
  }

  return (
    <Card className="shadow-lg rounded-xl mt-8">
      <CardHeader>
        <CardTitle className="text-2xl font-lora flex items-center gap-2">
          <Settings className="h-7 w-7 text-primary" /> Quick Actions
        </CardTitle>
        <CardDescription>Jump directly to important sections of your hub.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <Link key={index} to={action.link} className="block">
            <Card className={cn(
              "h-full flex flex-col items-start p-4 transition-all duration-200",
              "hover:bg-muted/50 hover:shadow-md",
              action.badge === "(Pending)" && "border-accent/50 bg-accent/5 dark:bg-accent/10"
            )}>
              <div className="mb-2">{action.icon}</div>
              <CardTitle className="text-lg font-semibold font-lora flex items-center gap-2">
                {action.title}
                {action.badge && (
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    action.badge === "(Pending)" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"
                  )}>
                    {action.badge}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                {action.description}
              </CardDescription>
            </Card>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;