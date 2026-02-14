"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Music, MessageSquare, User, Zap, Calendar } from "lucide-react";

const QuickActions: React.FC = () => {
  return (
    <Card className="shadow-md border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-lora flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" /> Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button variant="outline" className="justify-start h-12" asChild>
          <Link to="/song-suggestions">
            <Music className="mr-2 h-4 w-4 text-primary" /> Suggest a Song
          </Link>
        </Button>
        <Button variant="outline" className="justify-start h-12" asChild>
          <Link to="/profile">
            <User className="mr-2 h-4 w-4 text-primary" /> Update Profile
          </Link>
        </Button>
        <Button variant="outline" className="justify-start h-12" asChild>
          <Link to="/current-event">
            <Calendar className="mr-2 h-4 w-4 text-primary" /> RSVP to Next Event
          </Link>
        </Button>
        <Button variant="outline" className="justify-start h-12" onClick={() => {
          // Trigger the Report Issue dialog by finding the button and clicking it
          const reportBtn = document.querySelector('button[aria-haspopup="dialog"]') as HTMLButtonElement;
          if (reportBtn) reportBtn.click();
        }}>
          <MessageSquare className="mr-2 h-4 w-4 text-primary" /> Report an Issue
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuickActions;