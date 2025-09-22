"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const HUMANITIX_EVENT_URL = "https://events.humanitix.com/melbourne-pop-up-choir";

const CurrentEventPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 space-y-6">
      <Card className="p-6 md:p-8 shadow-lg rounded-xl border-2 border-primary">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold font-lora">COMING UP!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join us for our next exciting pop-up choir event!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-xl border border-border">
            <iframe
              src={HUMANITIX_EVENT_URL + "/tickets?widget=popup"}
              title="Humanitix Current Event"
              className="absolute top-0 left-0 w-full h-full border-0"
              allowFullScreen
            ></iframe>
          </div>
          <div className="text-center">
            <Button asChild>
              <a href={HUMANITIX_EVENT_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> View on Humanitix
              </a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            If the embedded content is not loading, please click the button above to view the event directly on Humanitix.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrentEventPage;