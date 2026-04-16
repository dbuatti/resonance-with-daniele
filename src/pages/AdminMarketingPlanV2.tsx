"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Target, 
  TrendingUp, 
  Users, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Instagram, 
  Mail, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  DollarSign,
  Ticket,
  LayoutDashboard,
  MousePointer2,
  Share2,
  Brain,
  ChevronRight,
  Loader2,
  ShieldCheck
} from "lucide-react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInDays, startOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackButton from "@/components/ui/BackButton";
import OutreachTracker from "@/components/admin/OutreachTracker";
import FacebookGroupTracker from "@/components/admin/FacebookGroupTracker";
import MarketingChecklist from "@/components/admin/MarketingChecklist";
import { cn } from "@/lib/utils";

const AdminMarketingPlanV2: React.FC = () => {
  const { user } = useSession();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "outreach" | "content">("overview");

  // Fetch events
  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ["allEventsForV2"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (events && events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const selectedEvent = useMemo(() => events?.find(e => e.id === selectedEventId), [events, selectedEventId]);

  // Fetch Stats
  const { data: stats } = useQuery({
    queryKey: ["v2Stats", selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return null;
      const { data: orders } = await supabase.from("event_orders").select("valid_tickets, your_earnings").eq("event_id", selectedEventId);
      const totalTickets = orders?.reduce((sum, o) => sum + (o.valid_tickets || 0), 0) || 0;
      const totalEarnings = orders?.reduce((sum, o) => sum + Number(o.your_earnings || 0), 0) || 0;
      return { totalTickets, totalEarnings };
    },
    enabled: !!selectedEventId,
  });

  const daysUntil = useMemo(() => {
    if (!selectedEvent?.date) return 0;
    return differenceInDays(startOfDay(new Date(selectedEvent.date)), startOfDay(new Date()));
  }, [selectedEvent]);

  if (loadingEvents) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto h-12 w-12 text-primary" /></div>;

  const ticketTarget = 125;
  const ticketProgress = stats ? (stats.totalTickets / ticketTarget) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white pb-20">
      {/* --- TOP NAVIGATION BAR --- */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <BackButton to="/admin" className="text-white/60 hover:text-white" />
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg shadow-lg shadow-primary/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-black font-lora tracking-tight">Command V2</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Select value={selectedEventId || ""} onValueChange={setSelectedEventId}>
              <SelectTrigger className="w-[300px] bg-white/5 border-white/10 rounded-xl h-11 font-bold">
                <SelectValue placeholder="Select Operation" />
              </SelectTrigger>
              <SelectContent className="bg-[#121214] border-white/10 text-white rounded-xl">
                {events?.map(e => (
                  <SelectItem key={e.id} value={e.id} className="font-bold focus:bg-primary focus:text-white">
                    {e.title} ({format(new Date(e.date), "MMM d")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="h-11 px-4 rounded-xl border-white/10 bg-white/5 text-white/60 font-mono">
              T-MINUS {daysUntil} DAYS
            </Badge>
          </div>
        </div>
      </nav>

      <main className="max-w-[1800px] mx-auto p-6 md:p-10 space-y-10">
        
        {/* --- HERO METRICS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-[#121214] border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary/20 transition-colors" />
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Ticket Velocity</p>
                <Ticket className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-5xl font-black tracking-tighter">{stats?.totalTickets || 0}</p>
                <div className="flex items-center justify-between text-[10px] font-bold text-white/60">
                  <span>TARGET: {ticketTarget}</span>
                  <span>{Math.round(ticketProgress)}%</span>
                </div>
                <Progress value={ticketProgress} className="h-2 bg-white/5" />
              </div>
            </div>
          </Card>

          <Card className="bg-[#121214] border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-green-500/20 transition-colors" />
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Gross Revenue</p>
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div className="space-y-1">
                <p className="text-5xl font-black tracking-tighter text-green-500">${stats?.totalEarnings.toFixed(0)}</p>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Live from Humanitix</p>
              </div>
            </div>
          </Card>

          <Card className="bg-[#121214] border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group md:col-span-2">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10 h-full">
              <div className="bg-accent/10 p-6 rounded-[1.5rem] shadow-inner">
                <Target className="h-10 w-10 text-accent" />
              </div>
              <div className="flex-1 space-y-2 text-center md:text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/60">Current Mission</p>
                <h3 className="text-3xl font-black font-lora leading-tight">The Relational Push</h3>
                <p className="text-sm font-medium text-white/60">Message your "10 People" today. Personal connection drives 60% of retention.</p>
              </div>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-black rounded-xl h-14 px-8 shadow-xl">
                Open List <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </Card>
        </div>

        {/* --- MAIN WORKSPACE --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT COLUMN: EXECUTION (8/12) */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* TABS NAV */}
            <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl w-fit border border-white/5">
              {[
                { id: "overview", label: "Overview", icon: LayoutDashboard },
                { id: "outreach", label: "Outreach", icon: Users },
                { id: "content", label: "Content", icon: Instagram },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all",
                    activeTab === tab.id ? "bg-primary text-white shadow-lg" : "text-white/40 hover:text-white hover:bg-white/5"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div 
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-10"
                >
                  <section className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-1.5 bg-primary rounded-full" />
                      <h2 className="text-2xl font-black font-lora tracking-tight">Critical Path</h2>
                    </div>
                    <MarketingChecklist eventId={selectedEventId || ""} />
                  </section>
                </motion.div>
              )}

              {activeTab === "outreach" && (
                <motion.div 
                  key="outreach"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                  <Card className="bg-[#121214] border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="bg-primary/10 p-4 rounded-2xl">
                        <Target className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black font-lora">The 10 People</h3>
                        <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Direct Outreach Tracker</p>
                      </div>
                    </div>
                    <OutreachTracker eventId={selectedEventId || ""} />
                  </Card>

                  <Card className="bg-[#121214] border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="bg-blue-500/10 p-4 rounded-2xl">
                        <Users className="h-8 w-8 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black font-lora">Community Groups</h3>
                        <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Facebook Distribution</p>
                      </div>
                    </div>
                    <FacebookGroupTracker eventId={selectedEventId || ""} postText="Prototype Post Text" />
                  </Card>
                </motion.div>
              )}

              {activeTab === "content" && (
                <motion.div 
                  key="content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { label: "Instagram", icon: Instagram, color: "text-rose-500", bg: "bg-rose-500/10" },
                      { label: "Email List", icon: Mail, color: "text-primary", bg: "bg-primary/10" },
                      { label: "FB Groups", icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" },
                    ].map(asset => (
                      <Card key={asset.label} className="bg-[#121214] border-white/5 rounded-[2rem] p-8 hover:border-white/20 transition-all cursor-pointer group">
                        <div className={cn("p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform", asset.bg, asset.color)}>
                          <asset.icon className="h-6 w-6" />
                        </div>
                        <h4 className="text-xl font-black font-lora mb-2">{asset.label} Assets</h4>
                        <p className="text-sm text-white/40 font-medium mb-6">Ready-to-use templates and AI prompts.</p>
                        <Button variant="ghost" className="w-full justify-between font-black text-[10px] uppercase tracking-widest hover:bg-white/5">
                          View Templates <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Card>
                    ))}
                  </div>

                  <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-white/5 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                      <div className="bg-white/10 p-8 rounded-[2rem] shadow-inner">
                        <Brain className="h-12 w-12 text-accent" />
                      </div>
                      <div className="flex-1 space-y-4 text-center md:text-left">
                        <h3 className="text-3xl font-black font-lora tracking-tight">AI Strategy Engine</h3>
                        <p className="text-lg font-medium text-white/60 leading-relaxed">Generate custom captions, email subject lines, and outreach scripts based on your current ticket sales and repertoire.</p>
                        <Button size="lg" className="h-16 px-10 text-xl font-black rounded-2xl shadow-2xl group">
                          Generate Fresh Copy <Sparkles className="ml-2 h-6 w-6 animate-pulse" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT COLUMN: INTEL & LINKS (4/12) */}
          <div className="lg:col-span-4 space-y-10">
            
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-8 w-1.5 bg-accent rounded-full" />
                <h2 className="text-2xl font-black font-lora tracking-tight">Live Intel</h2>
              </div>
              <Card className="bg-[#121214] border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Recent Activity</p>
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="bg-green-500/20 p-2 rounded-lg">
                          <MousePointer2 className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold">New Ticket Order</p>
                          <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">2 minutes ago</p>
                        </div>
                        <Badge variant="outline" className="border-white/10 text-white/60">+$30</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Quick Links</p>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { label: "Humanitix Dashboard", url: "https://humanitix.com", icon: Ticket },
                      { label: "Kit Email Marketing", url: "https://kit.com", icon: Mail },
                      { label: "Google Ads Manager", url: "https://ads.google.com", icon: TrendingUp },
                    ].map(link => (
                      <Button key={link.label} variant="outline" className="h-14 rounded-2xl bg-white/5 border-white/5 hover:bg-white/10 justify-start px-6 font-bold group" asChild>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          <link.icon className="h-5 w-5 mr-4 text-white/40 group-hover:text-primary transition-colors" />
                          {link.label}
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-8 w-1.5 bg-primary rounded-full" />
                <h2 className="text-2xl font-black font-lora tracking-tight">Brain Dump</h2>
              </div>
              <Card className="bg-[#1a1a1d] border-white/5 border-l-[12px] border-primary rounded-[2.5rem] p-8 shadow-2xl min-h-[300px] flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <Brain className="h-6 w-6 text-primary" />
                  <p className="text-sm font-black uppercase tracking-widest text-white/60">Strategic Notes</p>
                </div>
                <textarea 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-lg font-medium text-white/80 placeholder:text-white/10 resize-none"
                  placeholder="Jot down ideas for this event... they auto-save to the cloud."
                />
              </Card>
            </section>

          </div>
        </div>
      </main>

      {/* --- FOOTER STATUS --- */}
      <footer className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/5 px-10 py-4 z-50">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">System Online</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Last Sync: Just Now</span>
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Resonance Command v2.0.0-PROTOTYPE</p>
        </div>
      </footer>
    </div>
  );
};

export default AdminMarketingPlanV2;