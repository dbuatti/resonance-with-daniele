"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Megaphone, Mail, Sparkles, CheckCircle2 } from "lucide-react";
import { showSuccess } from "@/utils/toast";

interface FounderStrategyCardProps {
  eventDate: string;
  eventLink: string;
}

const FounderStrategyCard: React.FC<FounderStrategyCardProps> = ({ eventDate, eventLink }) => {
  const pitchText = `Thank you all for today. It’s been incredible to hear these voices together. To say thanks for being part of the very first one, I’ve set up a 'Founding Member' rate for our next session on ${eventDate}. I’ll be emailing you a private link tonight that gives you 20% off for the next week before we open it up to the general public. I’d love to see this same group back in the circle!`;

  const emailBody = `Hi [Name],\n\nThank you so much for joining me today. Hearing the voices come to life in that room was exactly what I hoped Resonance would be.\n\nAs a thank you for being there at the very start, I’ve opened up the ${eventDate} session a week early just for you.\n\nI’ve created a 20% "Founding Member" discount that is active for the next 7 days.\n\nYour Code: FOUNDER20\nLink: ${eventLink}\n\nI can't wait to see what we build together in May.\n\nBest,\n\nDaniele`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showSuccess(`${label} copied to clipboard!`);
  };

  return (
    <Card className="border-none shadow-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-[2.5rem] overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      <CardHeader className="p-8 pb-0 relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Strategy Guide</h3>
        </div>
        <CardTitle className="text-3xl font-black font-lora">The Founder Advantage</CardTitle>
        <CardDescription className="text-purple-100 font-medium text-lg">
          Reward your April pioneers and build momentum for May.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-8 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Megaphone className="h-4 w-4" /> The In-Room Pitch
            </h4>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-[10px] font-black hover:bg-white/10 text-white"
              onClick={() => copyToClipboard(pitchText, "Pitch text")}
            >
              <Copy className="h-3 w-3 mr-2" /> COPY PITCH
            </Button>
          </div>
          <div className="bg-black/20 p-6 rounded-2xl border border-white/10 italic text-sm leading-relaxed">
            "{pitchText}"
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Mail className="h-4 w-4" /> Follow-up Email
            </h4>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-[10px] font-black hover:bg-white/10 text-white"
              onClick={() => copyToClipboard(emailBody, "Email body")}
            >
              <Copy className="h-3 w-3 mr-2" /> COPY EMAIL
            </Button>
          </div>
          <div className="bg-black/20 p-6 rounded-2xl border border-white/10 text-xs font-medium whitespace-pre-wrap leading-relaxed">
            {emailBody}
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest opacity-70">
          <CheckCircle2 className="h-4 w-4 text-accent" />
          Goal: 40% pre-booked before public launch
        </div>
      </CardContent>
    </Card>
  );
};

export default FounderStrategyCard;