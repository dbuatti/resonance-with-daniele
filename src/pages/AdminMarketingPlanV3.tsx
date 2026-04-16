"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  Zap, 
  Users, 
  TrendingUp, 
  ArrowRight, 
  Sparkles, 
  Loader2, 
  Calendar,
  LayoutDashboard,
  MousePointer2,
  Layers,
  Compass,
  PieChart,
  MessageSquare,
  Share2,
  Mail,
  Instagram,
  Facebook,
  ExternalLink // Added missing import
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/auth";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/ui/BackButton";
import { cn } from "@/lib/utils";
import OutreachTracker from "@/components/admin/OutreachTracker";
import FacebookGroupTracker from "@/components/admin/FacebookGroupTracker";

const AdminMarketingPlanV3: React.FC = () => {
  const { user } = useSession();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ["allEventsForMarketingPlanV3"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (events && events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const selectedEvent = useMemo(() => 
    events?.find(e => e.id === selectedEventId), 
    [events, selectedEventId]
  );

  if (loadingEvents) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-12 py-8 md:py-12 max-w-[1400px] mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <BackButton to="/admin" />
          <div className="flex items-center gap-3 mt-4">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <Compass className="h-6 w-6" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-lora tracking-tighter">Marketing V3 <span className="text-muted-foreground/30">Prototype</span></h1>
          </div>
          <p className="text-xl text-muted-foreground font-medium">The Strategy Map: Visualizing the path to a full circle.</p>
        </div>

        <div className="w-full md:w-80 space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Active Mission</label>
          <Select value={selectedEventId || ""} onValueChange={setSelectedEventId}>
            <SelectTrigger className="h-14 rounded-2xl shadow-xl border-2 border-primary/10 bg-card font-bold">
              <SelectValue placeholder="Select Event" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {events?.map((e) => (
                <SelectItem key={e.id} value={e.id} className="font-bold py-3">
                  {e.title} ({format(new Date(e.date), "MMM d")})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* --- STRATEGY PILLARS GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Pillar 1: Awareness (The Top of Funnel) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-1.5 bg-blue-500 rounded-full" />
            <h2 className="text-2xl font-black font-lora tracking-tight">1. Awareness</h2>
          </div>
          
          <Card className="border-none shadow-xl bg-blue-50/50 dark:bg-blue-950/10 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-blue-600">
                <Share2 className="h-5 w-5" /> Community Broadcast
              </CardTitle>
              <CardDescription>Getting the word out to the neighborhood.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-white dark:bg-background rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-sm">
                <p className="text-xs font-black uppercase tracking-widest text-blue-500 mb-3">Facebook Groups</p>
                <FacebookGroupTracker eventId={selectedEventId!} postText="Prototype Post Text" />
              </div>
              
              <Button variant="outline" className="w-full h-12 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 font-bold" asChild>
                <a href="https://www.facebook.com/groups/301509297978154" target="_blank" rel="noopener noreferrer">
                  Open Malvern Noticeboard <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Pillar 2: Engagement (The Relational Core) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-1.5 bg-primary rounded-full" />
            <h2 className="text-2xl font-black font-lora tracking-tight">2. Engagement</h2>
          </div>
          
          <Card className="border-none shadow-2xl bg-primary/5 rounded-[2.5rem] overflow-hidden border-t-8 border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                <Target className="h-5 w-5" /> The 10 People Rule
              </CardTitle>
              <CardDescription>Direct, human-to-human connection.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-white dark:bg-background rounded-2xl border border-primary/10 shadow-sm">
                <OutreachTracker eventId={selectedEventId!} />
              </div>
              
              <div className="bg-primary text-primary-foreground p-6 rounded-2xl shadow-lg">
                <p className="text-sm font-medium italic leading-relaxed">
                  "Personal invites are 10x more effective than any social media post. Who are your 10 today?"
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Pillar 3: Conversion (The Final Push) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-1.5 bg-accent rounded-full" />
            <h2 className="text-2xl font-black font-lora tracking-tight">3. Conversion</h2>
          </div>
          
          <Card className="border-none shadow-xl bg-accent/5 dark:bg-accent/10 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-accent-foreground">
                <Zap className="h-5 w-5" /> Urgency & Incentives
              </CardTitle>
              <CardDescription>Turning interest into ticket sales.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <Button className="h-16 rounded-2xl font-black text-lg shadow-xl bg-accent text-accent-foreground hover:bg-accent/90">
                  <Instagram className="mr-3 h-6 w-6" /> Post "Final Call" Story
                </Button>
                
                <Button variant="outline" className="h-16 rounded-2xl font-black text-lg border-accent/30 hover:bg-accent/10">
                  <Mail className="mr-3 h-6 w-6" /> Send Flash Sale Email
                </Button>
              </div>

              <div className="p-6 rounded-2xl bg-background border-2 border-dashed border-accent/50 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Active Promo Code</p>
                <p className="text-3xl font-black font-mono text-accent-foreground">SING20</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* --- PROTOTYPE WORKSPACE --- */}
      <section className="pt-12 border-t border-border/50">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            <Card className="rounded-[3rem] border-none shadow-2xl bg-card overflow-hidden">
              <CardHeader className="p-10 bg-muted/30 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-3xl font-black font-lora">Strategy Canvas</CardTitle>
                    <CardDescription className="text-lg font-medium">Map out your creative ideas for this session.</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-background font-black px-4 py-1 rounded-full">V3.0-ALPHA</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-y md:divide-y-0 divide-border/50">
                  <div className="p-10 space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Layers className="h-4 w-4" /> Visual Assets
                    </h3>
                    <div className="aspect-video rounded-3xl bg-muted/50 border-4 border-dashed border-border flex flex-col items-center justify-center text-center p-8 group cursor-pointer hover:bg-muted transition-colors">
                      <div className="bg-background p-4 rounded-2xl shadow-xl mb-4 group-hover:scale-110 transition-transform">
                        <Sparkles className="h-8 w-8 text-primary" />
                      </div>
                      <p className="font-bold">Upload Session Graphics</p>
                      <p className="text-xs text-muted-foreground mt-1">Drag & drop your Canva exports here.</p>
                    </div>
                  </div>
                  <div className="p-10 space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" /> Copywriting Lab
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Draft 1: The "Why"</p>
                        <p className="text-sm font-medium italic">"There's something about the way these harmonies sit..."</p>
                      </div>
                      <Button variant="ghost" className="w-full justify-start font-bold text-primary hover:bg-primary/5">
                        <ArrowRight className="mr-2 h-4 w-4" /> Generate AI Variations
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-primary text-primary-foreground p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="relative z-10 space-y-4">
                <h3 className="text-xl font-black font-lora">V3 Insights</h3>
                <p className="text-sm font-medium opacity-80 leading-relaxed">
                  This prototype focuses on the "Three Pillars" of choir growth. Awareness brings them in, Engagement keeps them close, and Conversion gets them in the room.
                </p>
                <div className="pt-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                    <span>Overall Strategy Health</span>
                    <span>65%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-accent w-[65%]" />
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 rounded-3xl shadow-lg border-none bg-card flex flex-col items-center text-center gap-2">
                <PieChart className="h-6 w-6 text-blue-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reach</p>
                <p className="text-2xl font-black">1.2k</p>
              </Card>
              <Card className="p-6 rounded-3xl shadow-lg border-none bg-card flex flex-col items-center text-center gap-2">
                <Users className="h-6 w-6 text-green-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New</p>
                <p className="text-2xl font-black">+14</p>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminMarketingPlanV3;