"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink, CheckCircle2, Sparkles, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

const AdminGrowthMission: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <Card className="relative overflow-hidden border-none shadow-2xl bg-gradient-to-br from-primary via-primary/90 to-indigo-900 text-primary-foreground mb-10 group">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none group-hover:bg-accent/30 transition-colors duration-500" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 text-primary-foreground/50 hover:text-primary-foreground hover:bg-white/10 rounded-full z-20"
        onClick={() => setIsVisible(false)}
      >
        <X className="h-4 w-4" />
      </Button>

      <CardHeader className="relative z-10 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <Badge className="bg-accent text-accent-foreground hover:bg-accent font-bold px-3 py-0.5 text-[10px] uppercase tracking-widest shadow-lg">
            <Sparkles className="h-3 w-3 mr-1" /> Growth Mission
          </Badge>
        </div>
        <CardTitle className="text-3xl md:text-4xl font-black font-lora leading-tight">
          Claim Your Spot on Google Maps
        </CardTitle>
        <CardDescription className="text-primary-foreground/80 text-lg max-w-2xl">
          Competitors are appearing in "choir near me" searches because they are listed on Google Maps. Let's get Resonance on the map to boost your local visibility.
        </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10 space-y-6 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <div className="bg-accent text-accent-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold mb-3 shadow-md">1</div>
            <p className="text-sm font-bold leading-tight">Create your profile at google.com/business</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <div className="bg-accent text-accent-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold mb-3 shadow-md">2</div>
            <p className="text-sm font-bold leading-tight">Set location to Armadale Baptist Church</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <div className="bg-accent text-accent-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold mb-3 shadow-md">3</div>
            <p className="text-sm font-bold leading-tight">Link it to this website URL</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 font-bold rounded-xl h-12 px-8 shadow-xl group/btn" asChild>
            <a href="https://www.google.com/business/" target="_blank" rel="noopener noreferrer">
              Start Mission <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <p className="text-xs text-primary-foreground/60 italic flex items-center gap-2">
            <MapPin className="h-3 w-3" /> This will help you rank #1 for "Choir in Armadale"
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Simple Badge component since it's used inside the card
const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
    {children}
  </span>
);

export default AdminGrowthMission;