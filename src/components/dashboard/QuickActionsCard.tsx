"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { User as UserIcon, ClipboardList, CalendarDays, FileText, Music, Shield, Settings } from "lucide-react";
import { useSession } from "@/integrations/supabase/auth";

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

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl font-lora flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Quick Actions
        </CardTitle>
        <CardDescription>Jump directly to important sections of your hub.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button asChild variant="outline" className="justify-start">
          <Link to="/profile">
            <UserIcon className="mr-2 h-4 w-4" /> My Profile
          </Link>
        </Button>
        <Button asChild variant={isSurveyCompleted ? "outline" : "default"} className="justify-start">
          <Link to="/profile/survey">
            <ClipboardList className="mr-2 h-4 w-4" /> My Survey {isSurveyCompleted ? "(Completed)" : "(Pending)"}
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <Link to="/events">
            <CalendarDays className="mr-2 h-4 w-4" /> Events
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <Link to="/resources">
            <FileText className="mr-2 h-4 w-4" /> Resources
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <Link to="/song-suggestions">
            <Music className="mr-2 h-4 w-4" /> Song Suggestions
          </Link>
        </Button>
        {user.is_admin && (
          <Button asChild variant="outline" className="justify-start">
            <Link to="/admin">
              <Shield className="mr-2 h-4 w-4" /> Admin Zone
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;