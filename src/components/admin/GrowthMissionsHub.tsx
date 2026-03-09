"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  ExternalLink, 
  Sparkles, 
  X, 
  Star, 
  Facebook, 
  Instagram, 
  CheckCircle2,
  ArrowRight,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Mission {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  badge: string;
  steps: string[];
  link?: string;
  linkText?: string;
  footerNote: string;
}

const missions: Mission[] = [
  {
    id: "google-maps",
    title: "Claim Your Spot on Google Maps",
    description: "Competitors are appearing in 'choir near me' searches because they are listed on Google Maps. Let's get Resonance on the map.",
    icon: <MapPin className="h-6 w-6" />,
    color: "from-blue-600 to-indigo-700",
    badge: "Local SEO",
    steps: [
      "Create your profile at google.com/business",
      "Set location to Armadale Baptist Church",
      "Link it to this website URL"
    ],
    link: "https://www.google.com/business/",
    linkText: "Start Mission",
    footerNote: "This helps you rank #1 for 'Choir in Armadale'"
  },
  {
    id: "google-reviews",
    title: "The Review Wave",
    description: "Social proof is everything. Once your Google profile is live, we need those 5-star ratings to build trust with strangers.",
    icon: <Star className="h-6 w-6" />,
    color: "from-amber-500 to-orange-600",
    badge: "Social Proof",
    steps: [
      "Copy your 'Google Review' link",
      "Send it to 5 of your most loyal regulars",
      "Ask them to mention 'joyful' or 'welcoming'"
    ],
    footerNote: "5 reviews is the 'magic number' for Google's algorithm"
  },
  {
    id: "facebook-outreach",
    title: "Suburb Spotlight",
    description: "People in Armadale and Malvern are looking for local activities. Let's go where they already hang out.",
    icon: <Facebook className="h-6 w-6" />,
    color: "from-blue-500 to-blue-800",
    badge: "Community",
    steps: [
      "Join the 'Armadale Community' FB group",
      "Share a photo of the circle with a warm invite",
      "Reply to every single comment personally"
    ],
    footerNote: "Local groups have 10x the reach of a business page"
  },
  {
    id: "instagram-reel",
    title: "Capture the Magic",
    description: "People are often afraid they 'can't sing.' Show them how safe and joyful the room actually feels.",
    icon: <Instagram className="h-6 w-6" />,
    color: "from-pink-500 to-rose-600",
    badge: "Content",
    steps: [
      "Record 15s of a beautiful harmony part",
      "Post as a Reel with the 'Armadale' location tag",
      "Add a 'Link' sticker to the next event"
    ],
    footerNote: "Video content builds the fastest emotional connection"
  }
];

const GrowthMissionsHub: React.FC = () => {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const activeMissions = missions.filter(m => !dismissedIds.includes(m.id));

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => [...prev, id]);
  };

  if (activeMissions.length === 0) {
    return (
      <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/5 p-12 text-center rounded-3xl mb-10">
        <Trophy className="h-12 w-12 text-accent mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-bold font-lora">All Missions Completed!</h3>
        <p className="text-muted-foreground mt-2">You've cleared your growth tasks. Check back later for new strategies.</p>
        <Button 
          variant="link" 
          className="mt-4 text-primary font-bold"
          onClick={() => setDismissedIds([])}
        >
          Reset Missions
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 mb-12">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-black font-lora flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Growth Missions
        </h2>
        <Badge variant="secondary" className="font-bold">
          {activeMissions.length} Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeMissions.map((mission) => (
          <Card 
            key={mission.id} 
            className={cn(
              "relative overflow-hidden border-none shadow-xl text-white group transition-all duration-300 hover:scale-[1.01]",
              `bg-gradient-to-br ${mission.color}`
            )}
          >
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:bg-white/20 transition-colors duration-500" />
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full z-20"
              onClick={() => handleDismiss(mission.id)}
            >
              <X className="h-4 w-4" />
            </Button>

            <CardHeader className="relative z-10 pb-2">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-white/20 text-white border-none hover:bg-white/30 font-bold px-3 py-0.5 text-[10px] uppercase tracking-widest">
                  {mission.badge}
                </Badge>
              </div>
              <CardTitle className="text-2xl font-black font-lora leading-tight flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg shadow-inner">
                  {mission.icon}
                </div>
                {mission.title}
              </CardTitle>
              <CardDescription className="text-white/80 text-sm mt-2 leading-relaxed">
                {mission.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="relative z-10 space-y-6 pt-4">
              <div className="space-y-3">
                {mission.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                    <div className="bg-white text-primary w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5 shadow-md">
                      {i + 1}
                    </div>
                    <p className="text-xs font-bold leading-tight">{step}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                {mission.link ? (
                  <Button size="sm" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 font-bold rounded-xl h-10 px-6 shadow-lg group/btn" asChild>
                    <a href={mission.link} target="_blank" rel="noopener noreferrer">
                      {mission.linkText} <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    className="w-full sm:w-auto bg-white/20 text-white hover:bg-white/30 font-bold rounded-xl h-10 px-6 border border-white/20"
                    onClick={() => handleDismiss(mission.id)}
                  >
                    Mark as Done <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                )}
                <p className="text-[10px] text-white/60 italic flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" /> {mission.footerNote}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GrowthMissionsHub;