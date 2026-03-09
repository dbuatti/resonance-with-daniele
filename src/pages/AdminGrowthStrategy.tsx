"use client";

import React from "react";
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
  Calendar,
  ArrowRight,
  Circle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/ui/BackButton";
import { Progress } from "@/components/ui/progress";
import { showSuccess, showError } from "@/utils/toast";

interface Mission {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string; // ADHD-friendly high-contrast colors
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
    icon: <MapPin className="h-6 w-6" />,
    color: "bg-blue-600 border-blue-400",
    badge: "Local SEO",
    steps: ["Create profile at google.com/business", "Set location to Armadale Baptist Church", "Link to this website"],
    link: "https://www.google.com/business/",
    linkText: "Start Mission",
    futureVision: "1 Year Goal: Rank #1 for 'Choir Melbourne' and 'Singing Armadale'."
  },
  {
    id: "google-reviews",
    title: "The Review Wave",
    description: "Social proof is everything. We need 5-star ratings to build trust with strangers.",
    icon: <Star className="h-6 w-6" />,
    color: "bg-amber-500 border-amber-300",
    badge: "Social Proof",
    steps: ["Copy your Google Review link", "Send to 5 loyal regulars", "Ask for 'joyful' or 'welcoming' keywords"],
    futureVision: "1 Year Goal: 50+ verified 5-star reviews creating a 'trust shield'."
  },
  {
    id: "facebook-outreach",
    title: "Suburb Spotlight",
    description: "People in Armadale/Malvern are looking for local activities. Go where they hang out.",
    icon: <Facebook className="h-6 w-6" />,
    color: "bg-indigo-600 border-indigo-400",
    badge: "Community",
    steps: ["Join 'Armadale Community' FB group", "Share a photo of the circle", "Reply to every comment personally"],
    futureVision: "1 Year Goal: Become the 'go-to' musical recommendation in local groups."
  },
  {
    id: "instagram-reel",
    title: "Capture the Magic",
    description: "Show them how safe and joyful the room actually feels. Video builds connection.",
    icon: <Instagram className="h-6 w-6" />,
    color: "bg-rose-600 border-rose-400",
    badge: "Content",
    steps: ["Record 15s of a harmony part", "Post as Reel with Armadale tag", "Add link sticker to next event"],
    futureVision: "1 Year Goal: A library of 'vibe checks' that make joining feel low-risk."
  }
];

const AdminGrowthStrategy: React.FC = () => {
  const { user } = useSession();
  const queryClient = useQueryClient();

  // Fetch completed missions from Supabase
  const { data: completedMissions, isLoading } = useQuery({
    queryKey: ["growthMissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("growth_missions")
        .select("mission_key")
        .eq("is_completed", true);
      if (error) throw error;
      return data.map(d => d.mission_key);
    },
    enabled: !!user,
  });

  const toggleMission = useMutation({
    mutationFn: async (missionId: string) => {
      const isDone = completedMissions?.includes(missionId);
      const { error } = await supabase
        .from("growth_missions")
        .upsert({ 
          admin_id: user?.id, 
          mission_key: missionId, 
          is_completed: !isDone,
          completed_at: !isDone ? new Date().toISOString() : null
        }, { onConflict: 'admin_id,mission_key' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["growthMissions"] });
      showSuccess("Progress saved to your strategy!");
    },
    onError: () => showError("Failed to sync with database.")
  });

  if (isLoading) return <div className="p-20 text-center"><Sparkles className="animate-spin h-12 w-12 mx-auto text-primary" /></div>;

  const progress = ((completedMissions?.length || 0) / missions.length) * 100;

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
              <span className="text-lg font-black text-primary">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3 bg-primary/10" />
          </div>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
          Daniele, these are the high-impact levers. Complete these to transform Resonance from a local secret into a Melbourne institution.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {missions.map((mission) => {
          const isDone = completedMissions?.includes(mission.id);
          return (
            <Card 
              key={mission.id} 
              className={cn(
                "relative overflow-hidden border-4 transition-all duration-300 rounded-[2rem] shadow-xl",
                isDone ? "opacity-60 grayscale-[0.5] border-green-500/20 bg-muted/30" : `border-transparent ${mission.color} text-white`
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge className="bg-white/20 text-white border-none font-black px-3 py-1 text-[10px] uppercase tracking-widest">
                    {mission.badge}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white/50 hover:text-white hover:bg-white/10 rounded-full"
                    onClick={() => toggleMission.mutate(mission.id)}
                  >
                    {isDone ? <CheckCircle2 className="h-6 w-6 text-green-400" /> : <Circle className="h-6 w-6" />}
                  </Button>
                </div>
                <CardTitle className="text-3xl font-black font-lora leading-tight flex items-center gap-4 mt-4">
                  <div className="p-3 bg-white/20 rounded-2xl shadow-inner">
                    {mission.icon}
                  </div>
                  {mission.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6 pt-4">
                <p className="text-lg font-medium leading-relaxed opacity-90">
                  {mission.description}
                </p>

                <div className="space-y-3">
                  {mission.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                      <div className="bg-white text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 shadow-md">
                        {i + 1}
                      </div>
                      <p className="text-sm font-bold">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4 opacity-70">
                    <Target className="h-4 w-4" /> The Long Game
                  </p>
                  <p className="text-sm italic font-medium bg-black/10 p-4 rounded-2xl">
                    "{mission.futureVision}"
                  </p>
                </div>

                {!isDone && mission.link && (
                  <Button size="lg" className="w-full bg-white text-primary hover:bg-white/90 font-black rounded-2xl h-14 shadow-2xl group/btn" asChild>
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