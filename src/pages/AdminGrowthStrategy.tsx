"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Star, 
  Facebook, 
  Instagram, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink, 
  Trophy,
  Rocket,
  Target,
  ArrowRight,
  Circle,
  Check,
  Zap,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/ui/BackButton";
import { Progress } from "@/components/ui/progress";
import { showSuccess, showError } from "@/utils/toast";
import { Checkbox } from "@/components/ui/checkbox";

interface Mission {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  badge: string;
  steps: string[];
  link?: string;
  linkText?: string;
  futureVision: string;
}

const missions: Mission[] = [
  {
    id: "google-maps",
    title: "Claim Your Spot on Google Maps",
    description: "Competitors are appearing in 'choir near me' searches. Let's get Resonance on the map.",
    icon: MapPin,
    color: "bg-blue-600 border-blue-400",
    badge: "Local SEO",
    steps: ["Create profile at google.com/business", "Set location to Armadale Baptist Church", "Link to this website"],
    link: "https://www.google.com/business/",
    linkText: "Start Mission",
    futureVision: "1 Year Goal: Rank #1 for 'Choir Melbourne' and 'Singing Armadale'."
  },
  {
    id: "council-listing",
    title: "Council Connection (Stonnington)",
    description: "You've joined MyCity! Now let's make sure the local council knows Resonance is a key community asset.",
    icon: Building2,
    color: "bg-emerald-600 border-emerald-400",
    badge: "Local Gov",
    steps: ["Log in to Stonnington MyCity Dashboard", "Add Resonance to the Community Directory", "Submit a 'What's On' event for the next session"],
    link: "https://www.stonnington.vic.gov.au/MyCity/Dashboard",
    linkText: "Open Dashboard",
    futureVision: "1 Year Goal: Featured in the Stonnington 'What's On' newsletter monthly."
  },
  {
    id: "google-reviews",
    title: "The Review Wave",
    description: "Social proof is everything. We need 5-star ratings to build trust with strangers.",
    icon: Star,
    color: "bg-amber-500 border-amber-300",
    badge: "Social Proof",
    steps: ["Copy your Google Review link", "Send to 5 loyal regulars", "Ask for 'joyful' or 'welcoming' keywords"],
    futureVision: "1 Year Goal: 50+ verified 5-star reviews creating a 'trust shield'."
  },
  {
    id: "facebook-outreach",
    title: "Suburb Spotlight",
    description: "People in Armadale/Malvern are looking for local activities. Go where they hang out.",
    icon: Facebook,
    color: "bg-indigo-600 border-indigo-400",
    badge: "Community",
    steps: ["Join 'Armadale Community' FB group", "Share a photo of the circle", "Reply to every comment personally"],
    futureVision: "1 Year Goal: Become the 'go-to' musical recommendation in local groups."
  },
  {
    id: "instagram-reel",
    title: "Capture the Magic",
    description: "Show them how safe and joyful the room actually feels. Video builds connection.",
    icon: Instagram,
    color: "bg-rose-600 border-rose-400",
    badge: "Content",
    steps: ["Record 15s of a harmony part", "Post as Reel with Armadale tag", "Add link sticker to next event"],
    futureVision: "1 Year Goal: A library of 'vibe checks' that make joining feel low-risk."
  }
];

const AdminGrowthStrategy: React.FC = () => {
  const { user } = useSession();
  const queryClient = useQueryClient();

  // Fetch completed steps from Supabase
  const { data: completedSteps, isLoading } = useQuery({
    queryKey: ["growthMissionSteps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("growth_mission_steps")
        .select("mission_key, step_index")
        .eq("is_completed", true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const toggleStep = useMutation({
    mutationFn: async ({ missionId, stepIndex }: { missionId: string, stepIndex: number }) => {
      const isDone = completedSteps?.some(s => s.mission_key === missionId && s.step_index === stepIndex);
      const { error } = await supabase
        .from("growth_mission_steps")
        .upsert({ 
          admin_id: user?.id, 
          mission_key: missionId, 
          step_index: stepIndex,
          is_completed: !isDone,
          completed_at: !isDone ? new Date().toISOString() : null
        }, { onConflict: 'admin_id,mission_key,step_index' });
      if (error) throw error;
      return { missionId, stepIndex, wasCompleted: !isDone };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["growthMissionSteps"] });
      if (data.wasCompleted) {
        // Check if this was the last step for the mission
        const mission = missions.find(m => m.id === data.missionId);
        const missionSteps = completedSteps?.filter(s => s.mission_key === data.missionId) || [];
        if (mission && missionSteps.length + 1 === mission.steps.length) {
          showSuccess(`BOOM! Mission "${mission.title}" Complete! 🚀`);
        }
      }
    },
    onError: () => showError("Failed to sync progress.")
  });

  if (isLoading) return <div className="p-20 text-center"><Sparkles className="animate-spin h-12 w-12 mx-auto text-primary" /></div>;

  const totalSteps = missions.reduce((acc, m) => acc + m.steps.length, 0);
  const completedCount = completedSteps?.length || 0;
  const overallProgress = (completedCount / totalSteps) * 100;

  return (
    <div className="space-y-10 py-8 md:py-12 max-w-6xl mx-auto px-4">
      <BackButton to="/admin" />
      
      <header className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <Badge className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
              <Rocket className="h-3 w-3 mr-2" /> Growth Engine
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black font-lora tracking-tighter">The 1-Year Vision</h1>
          </div>
          <div className="bg-card p-6 rounded-3xl shadow-xl border-2 border-primary/10 w-full md:w-72">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Overall Progress</span>
              <span className="text-lg font-black text-primary">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3 bg-primary/10" />
          </div>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
          Daniele, these are your high-impact levers. Check off each step as you go. Small wins lead to a massive 2027.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {missions.map((mission) => {
          const missionCompletedSteps = completedSteps?.filter(s => s.mission_key === mission.id) || [];
          const isMissionDone = missionCompletedSteps.length === mission.steps.length;
          const missionProgress = (missionCompletedSteps.length / mission.steps.length) * 100;

          return (
            <Card 
              key={mission.id} 
              className={cn(
                "relative overflow-hidden border-4 transition-all duration-500 rounded-[2.5rem] shadow-xl flex flex-col",
                isMissionDone 
                  ? "border-green-500/30 bg-green-500/5" 
                  : `border-transparent ${mission.color} text-white`
              )}
            >
              {/* Satisfying "Complete" Overlay */}
              {isMissionDone && (
                <div className="absolute inset-0 bg-green-500/10 backdrop-blur-[2px] z-10 flex items-center justify-center pointer-events-none animate-in fade-in duration-700">
                  <div className="bg-white p-4 rounded-full shadow-2xl transform rotate-12">
                    <Trophy className="h-12 w-12 text-green-600" />
                  </div>
                </div>
              )}

              <CardHeader className="pb-2 relative z-20">
                <div className="flex justify-between items-start">
                  <Badge className={cn(
                    "font-black px-3 py-1 text-[10px] uppercase tracking-widest border-none",
                    isMissionDone ? "bg-green-500 text-white" : "bg-white/20 text-white"
                  )}>
                    {isMissionDone ? "Mission Accomplished" : mission.badge}
                  </Badge>
                  <div className="text-xs font-black opacity-70">
                    {missionCompletedSteps.length}/{mission.steps.length} Steps
                  </div>
                </div>
                <CardTitle className={cn(
                  "text-3xl font-black font-lora leading-tight flex items-center gap-4 mt-4",
                  isMissionDone && "text-green-700"
                )}>
                  <div className={cn(
                    "p-3 rounded-2xl shadow-inner",
                    isMissionDone ? "bg-green-500/20" : "bg-white/20"
                  )}>
                    <mission.icon className={cn("h-6 w-6", isMissionDone ? "text-green-600" : "text-white")} />
                  </div>
                  {mission.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6 pt-4 flex-grow relative z-20">
                <p className={cn(
                  "text-lg font-medium leading-relaxed opacity-90",
                  isMissionDone && "text-green-800/70"
                )}>
                  {mission.description}
                </p>

                <div className="space-y-3">
                  {mission.steps.map((step, i) => {
                    const isStepDone = missionCompletedSteps.some(s => s.step_index === i);
                    return (
                      <div 
                        key={i} 
                        onClick={() => toggleStep.mutate({ missionId: mission.id, stepIndex: i })}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer group",
                          isStepDone 
                            ? "bg-green-500/20 border-green-500/30 text-green-800" 
                            : isMissionDone 
                              ? "bg-transparent border-green-500/10 text-green-800/40"
                              : "bg-white/10 border-white/10 hover:bg-white/20 text-white"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                          isStepDone 
                            ? "bg-green-500 border-green-500 shadow-lg shadow-green-500/20" 
                            : isMissionDone
                              ? "border-green-500/20"
                              : "border-white/40 group-hover:border-white"
                        )}>
                          {isStepDone && <Check className="h-4 w-4 text-white stroke-[4px]" />}
                        </div>
                        <p className={cn(
                          "text-sm font-bold leading-tight flex-1",
                          isStepDone && "line-through opacity-60"
                        )}>
                          {step}
                        </p>
                        {!isStepDone && !isMissionDone && (
                          <Zap className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-yellow-300" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className={cn(
                  "pt-4 border-t",
                  isMissionDone ? "border-green-500/20" : "border-white/10"
                )}>
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-3 opacity-70",
                    isMissionDone && "text-green-700"
                  )}>
                    <Target className="h-3 w-3" /> The Long Game
                  </p>
                  <p className={cn(
                    "text-xs italic font-medium p-4 rounded-2xl",
                    isMissionDone ? "bg-green-500/10 text-green-800" : "bg-black/10 text-white"
                  )}>
                    "{mission.futureVision}"
                  </p>
                </div>

                {!isMissionDone && mission.link && (
                  <Button size="lg" className="w-full bg-white text-primary hover:bg-white/90 font-black rounded-2xl h-14 shadow-2xl group/btn mt-auto" asChild>
                    <a href={mission.link} target="_blank" rel="noopener noreferrer">
                      {mission.linkText} <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover/btn:translate-x-2" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <section className="mt-20 p-10 bg-accent text-accent-foreground rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10 text-center space-y-6">
          <h2 className="text-4xl font-black font-lora">Projecting Forward: March 2027</h2>
          <p className="text-xl max-w-3xl mx-auto font-medium leading-relaxed">
            By completing these missions, Resonance will no longer rely on manual outreach. You'll have a self-sustaining ecosystem where new members find you through search, trust you through reviews, and stay because of the community.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <div className="bg-white/20 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest">100+ Active Members</div>
            <div className="bg-white/20 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest">Waitlists for Events</div>
            <div className="bg-white/20 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest">Brand Authority</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminGrowthStrategy;