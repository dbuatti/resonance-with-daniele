"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Instagram, 
  Mail, 
  Mic2, 
  Target, 
  Copy, 
  Clock,
  UserPlus,
  MapPin,
  Brain,
  ArrowRight,
  Sparkles,
  Loader2,
  ExternalLink,
  Users,
  Calendar,
  Ticket,
  TrendingUp,
  Music,
  Globe,
  Zap,
  DollarSign,
  Activity,
  Bot,
  CheckCircle2,
  ShieldAlert,
  ListTodo,
  Facebook,
  MessageSquare,
  LayoutDashboard,
  FileText,
  AlertTriangle,
  Building2
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import BackButton from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/badge";
import MarketingChecklist from "@/components/admin/MarketingChecklist";
import { Textarea } from "@/components/ui/textarea";
import OutreachTracker from "@/components/admin/OutreachTracker";
import FacebookGroupTracker from "@/components/admin/FacebookGroupTracker";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, differenceInDays, startOfDay } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import EmailMembersModal from "@/components/admin/EmailMembersModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventPrepChecklist from "@/components/admin/EventPrepChecklist";
import { ScrollArea } from "@/components/ui/scroll-area";

const AdminMarketingPlanPage: React.FC = () => {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // 1. Fetch all events
  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ["allEventsForMarketingPlan"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Set default event
  useEffect(() => {
    if (events && events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const selectedEvent = useMemo(() => 
    events?.find(e => e.id === selectedEventId), 
    [events, selectedEventId]
  );

  // 2. Fetch Live Stats & Financials
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["eventMarketingStats", selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return null;
      
      const { data: orders, error: orderError } = await supabase
        .from("event_orders")
        .select("valid_tickets, your_earnings, first_name, last_name, order_date")
        .eq("event_id", selectedEventId)
        .order("order_date", { ascending: false });
      if (orderError) throw orderError;

      const { data: expenses, error: expenseError } = await supabase
        .from("event_expenses")
        .select("amount")
        .eq("event_id", selectedEventId);
      if (expenseError) throw expenseError;

      const totalTickets = orders?.reduce((sum, o) => sum + (o.valid_tickets || 0), 0) || 0;
      const totalEarnings = orders?.reduce((sum, o) => sum + Number(o.your_earnings || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      
      return { totalTickets, totalEarnings, totalExpenses, recentOrders: orders?.slice(0, 5) || [] };
    },
    enabled: !!selectedEventId,
  });

  // 3. Fetch Current Focus (Nominated Folder)
  const { data: nominatedFolder } = useQuery({
    queryKey: ["nominatedFolderForMarketing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resource_folders")
        .select("name")
        .eq("is_nominated_for_dashboard", true)
        .limit(1)
        .maybeSingle();
      if (error) return null;
      return data;
    },
  });

  // 4. Dynamic Countdown & Mission Logic
  const daysUntil = useMemo(() => {
    if (!selectedEvent?.date) return null;
    return differenceInDays(startOfDay(new Date(selectedEvent.date)), startOfDay(new Date()));
  }, [selectedEvent]);

  const dailyMission = useMemo(() => {
    if (daysUntil === null) return null;
    if (daysUntil > 7) return { title: "Build Anticipation", task: "Share a 'behind the scenes' photo of your prep.", icon: <Sparkles /> };
    if (daysUntil === 7) return { title: "The 1-Week Mark", task: "Email the full list. Remind them why this song matters.", icon: <Mail /> };
    if (daysUntil === 3) return { title: "Relational Push", task: "Message your '10 People'. This is the most important day.", icon: <Target /> };
    if (daysUntil === 2) return { title: "Vibe Check", task: "Post a video of you playing the chords. Make it feel safe.", icon: <Instagram /> };
    if (daysUntil === 1) return { title: "Final Call", task: "Instagram Story: 'Last few spots left. See you tomorrow?'", icon: <Zap /> };
    if (daysUntil === 0) return { title: "Showtime", task: "Inhabit the room. Focus on the humans, not the notes.", icon: <Heart /> };
    return { title: "Keep Momentum", task: "Check your outreach list and follow up on replies.", icon: <Users /> };
  }, [daysUntil]);

  // 5. Event Health Status Logic
  const eventHealth = useMemo(() => {
    if (!stats || daysUntil === null) return { label: "Unknown", color: "text-muted-foreground", icon: <Activity /> };
    const target = 125;
    const progress = (stats.totalTickets / target) * 100;
    
    if (progress >= 80) return { label: "Near Capacity", color: "text-green-500", icon: <CheckCircle2 /> };
    if (daysUntil <= 3 && progress < 40) return { label: "Critical Push Needed", color: "text-destructive", icon: <ShieldAlert /> };
    if (daysUntil <= 7 && progress < 60) return { label: "Needs Attention", color: "text-yellow-500", icon: <AlertTriangle /> };
    return { label: "On Track", color: "text-primary", icon: <TrendingUp /> };
  }, [stats, daysUntil]);

  useEffect(() => {
    if (!selectedEvent?.date) return;
    const targetDate = new Date(`${selectedEvent.date}T10:00:00`).getTime();
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      if (distance < 0) { setTimeLeft("Event Started!"); clearInterval(timer); return; }
      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${d}d ${h}h ${m}m`);
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedEvent]);

  // 6. Brain Dump Persistence
  const { data: noteData } = useQuery({
    queryKey: ["adminBrainDump", selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return "";
      const { data, error } = await supabase.from("admin_notes").select("content").eq("note_key", `brain_dump_${selectedEventId}`).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data?.content || "";
    },
    enabled: !!user && !!selectedEventId,
  });

  const [localBrainDump, setLocalBrainDump] = useState("");
  const debouncedBrainDump = useDebounce(localBrainDump, 1000);

  useEffect(() => { if (noteData !== undefined) setLocalBrainDump(noteData); }, [noteData]);

  const saveNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedEventId) return;
      await supabase.from("admin_notes").upsert({ admin_id: user?.id, note_key: `brain_dump_${selectedEventId}`, event_id: selectedEventId, content }, { onConflict: 'note_key' });
    }
  });

  useEffect(() => { if (debouncedBrainDump !== noteData && selectedEventId) saveNoteMutation.mutate(debouncedBrainDump); }, [debouncedBrainDump, selectedEventId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showSuccess(`${label} copied to clipboard!`);
  };

  // --- DYNAMIC CALCULATIONS ---
  const eventDate = selectedEvent ? new Date(selectedEvent.date) : new Date();
  const eventDateFormatted = selectedEvent ? format(eventDate, "EEEE, MMMM do") : "";
  const eventDayName = selectedEvent ? format(eventDate, "EEEE") : "Saturday";
  const eventLocation = selectedEvent?.location || "Armadale Baptist Church";
  const eventLink = selectedEvent?.humanitix_link || "https://events.humanitix.com/resonance-choir";
  const focusSong = nominatedFolder?.name || "some incredible new harmonies";
  const promoExpiryDate = subDays(eventDate, 1);
  const promoExpiryFormatted = format(promoExpiryDate, "EEEE 'at' 1:00 PM (MM/dd/yyyy)");

  // --- AI PROMPT GENERATOR ---
  const aiPrompt = `I am Daniele Buatti, a vocal coach and choir director. I'm running a pop-up choir session called "${selectedEvent?.title}" on ${eventDateFormatted} at ${eventLocation}. 

We are focusing on the song "${focusSong}". 
Current status: We have ${stats?.totalTickets || 0} tickets sold out of a 125 target. 
Days remaining: ${daysUntil}.

Please generate 3 variations of a warm, expressive, and human-centric Instagram caption. 
Variation 1: Focus on the joy of the specific song "${focusSong}".
Variation 2: Focus on the community and meeting new people in Armadale.
Variation 3: A "Final Call" urgency post mentioning the SING20 discount code.

Keep the tone grounded, resonant, and inviting. Avoid corporate or "hype" language. Use emojis sparingly.`;

  // --- DYNAMIC TEMPLATES ---
  const authenticCaption = `We're back for ${selectedEvent?.title || "our next session"}. \n\nWe'll be diving into "${focusSong}" — the harmonies are sounding beautiful already.\n\n📍 ${eventLocation}\n⏰ ${eventDateFormatted}, 10am\n\nIf you've been meaning to come, this is the one. Use SING20 for 20% off until ${format(promoExpiryDate, "EEEE")}.\n\nLink in bio. Come sing with us. 🌿`;
  const authenticEmail = `Subject: Let's sing together this ${eventDayName}! 🎶\n\nHi there,\n\nI’d love to see you back in the circle for ${selectedEvent?.title || "our next session"} this ${eventDateFormatted} (10am–1pm) at ${eventLocation}.\n\nWe're going to be working on "${focusSong}", and I can't wait to hear how it sounds with a full room.\n\nI’m opening up a 20% discount for my past singers to help get the room full of familiar voices.\n\nUse code SING20 at checkout.\n(Valid until ${promoExpiryFormatted})\n\nGrab your spot here: ${eventLink}\n\nI'd love to see you there.\n\n— Daniele`;
  const fullCommunityPost = `Any local singers (or shower-singers) in Armadale? 🎶\n\nHi everyone! I’m Daniele, a local music director. I’m hosting a pop-up choir session at ${eventLocation} on ${eventDateFormatted}.\n\nWe're learning "${focusSong}" this month. It’s a low-pressure morning. There are no auditions and no experience is needed. We just get together to learn some great harmonies and meet some new people in the neighborhood.\n\n📍 Where: ${eventLocation}\n⏰ When: ${eventDateFormatted}, 10am to 1pm\n🎟️ Link: ${eventLink}\n\nHope to see some local faces there!`;

  const songRevealCaption = `The repertoire for ${selectedEvent?.title || "our next session"} is officially here. 🕊️\n\nWe’re diving into:\n✨ Billie Eilish - "What Was I Made For?"\n✨ The Wailin' Jennys - "The Parting Glass"\n\nTwo songs that explore what it means to be human, to lose, and to find ourselves again. The harmonies are hauntingly beautiful.\n\n📍 ${eventLocation}\n⏰ ${eventDateFormatted}, 10am\n\nCome and inhabit these songs with us. Link in bio for the last few spots.`;
  
  const flashSaleEmail = `Subject: 24-Hour Flash Sale: 15% off Resonance ⚡\n\nHi there,\n\nI wanted to send a quick note because we’re just a few days away from ${selectedEvent?.title || "our next session"} and the energy is already building.\n\nIf you’ve been sitting on the fence, I’d love to make it a little easier for you to join us.\n\nFor the next 24 hours, you can grab a ticket for 15% off using the code: FLASH15\n\nGrab your spot here: ${eventLink}\n\nWe’re learning some incredible arrangements of Billie Eilish and The Wailin' Jennys. It’s going to be a special morning.\n\nHope to see you in the circle.\n\n— Daniele`;

  const handleOpenMail = () => {
    const subject = encodeURIComponent(`Let's sing together for ${selectedEvent?.title}! 🎶`);
    const body = encodeURIComponent(authenticEmail.split('\n\n').slice(1).join('\n\n'));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleTaskAction = (taskId: string) => {
    if (taskId === "email-regulars") {
      setIsEmailModalOpen(true);
    }
  };

  if (loadingEvents) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  const targetTickets = 125;
  const netProfit = stats ? stats.totalEarnings - stats.totalExpenses : 0;

  return (
    <div className="space-y-8 py-8 md:py-12 bg-background/50 min-h-screen">
      <div className="max-w-[1600px] mx-auto px-4 md:px-12">
        <BackButton className="mb-8" to="/admin" />
        
        {/* --- RADICAL HEADER --- */}
        <header className="bg-card border-2 border-primary/5 rounded-[4rem] p-12 md:p-20 shadow-2xl mb-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px]" />
          
          <div className="flex flex-col lg:flex-row justify-between items-start gap-16 relative z-10">
            <div className="space-y-10 flex-1 text-center lg:text-left">
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4">
                <Badge className="bg-primary text-primary-foreground px-5 py-2 rounded-full font-black uppercase tracking-widest text-[11px]">Command Center</Badge>
                <div className={cn("flex items-center gap-2 px-5 py-2 rounded-full bg-background border-2 font-black uppercase tracking-widest text-[11px] shadow-sm", eventHealth.color)}>
                  {eventHealth.icon} {eventHealth.label}
                </div>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-7xl md:text-9xl font-black font-lora tracking-tighter leading-none">Operation Hub</h1>
                <div className="w-full md:w-[500px] mx-auto lg:mx-0 space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-4">Active Session</label>
                  <Select value={selectedEventId || ""} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="h-24 rounded-[2.5rem] shadow-2xl bg-background border-4 border-primary/10 text-3xl font-black px-10">
                      <SelectValue placeholder="Choose an event..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-[2.5rem] p-2">
                      {events?.map((event) => (
                        <SelectItem key={event.id} value={event.id} className="py-5 font-bold rounded-2xl text-lg">
                          {event.title} ({format(new Date(event.date), "MMM d")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full lg:w-auto">
              <Card className="bg-background p-10 rounded-[3rem] shadow-2xl border-none flex flex-col items-center text-center gap-2 min-w-[240px] hover:scale-105 transition-transform">
                <div className="bg-primary/10 p-5 rounded-3xl mb-2">
                  <Clock className="h-10 w-10 text-primary" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">T-Minus</p>
                <p className="text-4xl font-black text-primary tracking-tighter">{timeLeft}</p>
              </Card>
              
              <Card className="bg-background p-10 rounded-[3rem] shadow-2xl border-none flex flex-col items-center text-center gap-2 min-w-[240px] hover:scale-105 transition-transform">
                <div className="bg-green-500/10 p-5 rounded-3xl mb-2">
                  <Ticket className="h-10 w-10 text-green-600" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Tickets</p>
                <p className="text-4xl font-black text-green-600 tracking-tighter">{stats?.totalTickets || 0} / {targetTickets}</p>
              </Card>

              <Card className="bg-primary text-primary-foreground p-10 rounded-[3rem] shadow-2xl border-none flex flex-col items-center text-center gap-2 min-w-[240px] hover:scale-105 transition-transform">
                <div className="bg-white/20 p-5 rounded-3xl mb-2">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest opacity-70">Net Profit</p>
                <p className="text-3xl font-black tracking-tighter">${netProfit.toFixed(0)}</p>
              </Card>
            </div>
          </div>
        </header>

        {!selectedEventId ? (
          <Card className="p-32 text-center border-dashed border-4 rounded-[5rem] bg-muted/10">
            <Calendar className="h-24 w-24 text-muted-foreground mx-auto mb-6 opacity-10" />
            <p className="text-3xl font-bold text-muted-foreground font-lora">Select an operation to begin.</p>
          </Card>
        ) : (
          <Tabs defaultValue="execution" className="space-y-20">
            <div className="flex justify-center">
              <TabsList className="grid w-full max-w-lg grid-cols-2 rounded-[2.5rem] h-20 p-2 bg-muted/50 shadow-inner">
                <TabsTrigger value="execution" className="rounded-[2rem] font-black text-xl flex items-center gap-3 data-[state=active]:shadow-2xl">
                  <Zap className="h-6 w-6" /> Execution
                </TabsTrigger>
                <TabsTrigger value="preparation" className="rounded-[2rem] font-black text-xl flex items-center gap-3 data-[state=active]:shadow-2xl">
                  <ListTodo className="h-6 w-6" /> Preparation
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="execution" className="space-y-24 animate-fade-in-up">
              {/* --- 3-COLUMN DASHBOARD GRID --- */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* COLUMN 1: OUTREACH & FB (4/12) */}
                <div className="lg:col-span-4 space-y-12">
                  <section className="space-y-8">
                    <div className="flex items-center gap-4 px-4">
                      <div className="h-10 w-2 bg-primary rounded-full" />
                      <h2 className="text-3xl font-black font-lora tracking-tight">Relational Outreach</h2>
                    </div>
                    <Card className="border-4 border-primary bg-primary/5 shadow-2xl overflow-hidden rounded-[4rem]">
                      <CardContent className="p-10 space-y-10">
                        <div className="flex items-center gap-5">
                          <div className="bg-primary text-primary-foreground p-4 rounded-2xl shadow-xl">
                            <Target className="h-8 w-8" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-2xl font-black font-lora">The 10 People Rule</p>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Personal connection is king.</p>
                          </div>
                        </div>
                        <OutreachTracker eventId={selectedEventId} />
                      </CardContent>
                    </Card>
                  </section>

                  <section className="space-y-8">
                    <div className="flex items-center gap-4 px-4">
                      <div className="h-10 w-1.5 bg-primary rounded-full" />
                      <h2 className="text-3xl font-black font-lora tracking-tight">Facebook Groups</h2>
                    </div>
                    <Card className="border-none shadow-2xl bg-card rounded-[3rem] overflow-hidden">
                      <CardContent className="p-8">
                        <FacebookGroupTracker eventId={selectedEventId} postText={fullCommunityPost} />
                      </CardContent>
                    </Card>
                  </section>
                </div>

                {/* COLUMN 2: STRATEGY & ASSETS (5/12) */}
                <div className="lg:col-span-5 space-y-12">
                  {dailyMission && (
                    <Card className="bg-accent text-accent-foreground border-none shadow-2xl rounded-[4rem] overflow-hidden relative hover:scale-[1.02] transition-transform">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                      <CardContent className="p-10 flex items-start gap-8 relative z-10">
                        <div className="bg-white/20 p-6 rounded-3xl shadow-inner shrink-0">
                          {React.cloneElement(dailyMission.icon as React.ReactElement, { className: "h-10 w-10" })}
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] opacity-70">Today's Mission</h3>
                          <p className="text-4xl font-black font-lora leading-tight">{dailyMission.title}</p>
                          <p className="text-xl font-medium opacity-90 leading-relaxed">{dailyMission.task}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <section className="space-y-8">
                    <div className="flex items-center gap-4 px-4">
                      <div className="h-10 w-2 bg-primary rounded-full" />
                      <h2 className="text-3xl font-black font-lora tracking-tight">AI Strategy</h2>
                    </div>
                    <Card className="border-none shadow-2xl bg-gradient-to-br from-primary/5 to-accent/5 rounded-[4rem] overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> Prompt Generator</CardTitle>
                        <CardDescription className="text-lg font-medium">Copy this into Claude or Gemini for fresh copy.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-background/80 p-6 rounded-3xl border-2 border-primary/10 text-sm font-medium text-muted-foreground italic leading-relaxed line-clamp-4">
                          "{aiPrompt}"
                        </div>
                        <Button className="w-full h-16 font-black text-lg rounded-2xl shadow-xl" onClick={() => copyToClipboard(aiPrompt, "AI Prompt")}>
                          <Copy className="h-5 w-5 mr-2" /> Copy Full AI Prompt
                        </Button>
                      </CardContent>
                    </Card>
                  </section>

                  <section className="space-y-8">
                    <div className="flex items-center gap-4 px-4">
                      <div className="h-10 w-2 bg-primary rounded-full" />
                      <h2 className="text-3xl font-black font-lora tracking-tight">Marketing Assets</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                      {[
                        { label: "Community Post", icon: <Users />, text: fullCommunityPost, color: "bg-blue-50 text-blue-600" },
                        { label: "Instagram Caption", icon: <Instagram />, text: authenticCaption, color: "bg-rose-50 text-rose-600" },
                        { label: "Email Template", icon: <Mail />, text: authenticEmail, color: "bg-primary/5 text-primary", action: handleOpenMail },
                        { label: "Song Reveal", icon: <Music />, text: songRevealCaption, color: "bg-accent/10 text-accent-foreground" },
                        { label: "Flash Sale", icon: <Zap />, text: flashSaleEmail, color: "bg-yellow-50 text-yellow-600" }
                      ].map((asset, i) => (
                        <Card key={i} className="border-none shadow-lg bg-card overflow-hidden rounded-3xl group/asset hover:shadow-xl transition-all">
                          <div className="px-8 py-5 flex justify-between items-center border-b border-border/50">
                            <span className="text-[11px] font-black uppercase tracking-widest flex items-center gap-3">
                              <div className={cn("p-2 rounded-xl", asset.color)}>{asset.icon}</div>
                              {asset.label}
                            </span>
                            <div className="flex gap-3">
                              <Button variant="ghost" size="sm" className="h-10 px-4 text-[11px] font-black hover:bg-primary/10" onClick={() => copyToClipboard(asset.text, asset.label)}>
                                <Copy className="h-4 w-4 mr-2" /> COPY
                              </Button>
                              {asset.action && (
                                <Button variant="ghost" size="sm" className="h-10 px-4 text-[11px] font-black text-primary hover:bg-primary/10" onClick={asset.action}>
                                  <ExternalLink className="h-4 w-4 mr-2" /> OPEN
                                </Button>
                              )}
                            </div>
                          </div>
                          <CardContent className="p-8">
                            <p className="text-sm italic text-muted-foreground leading-relaxed line-clamp-2">{asset.text}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                </div>

                {/* COLUMN 3: WORKSPACE (3/12) */}
                <div className="lg:col-span-3 space-y-12">
                  <section className="space-y-8">
                    <div className="flex items-center gap-3 px-4">
                      <div className="h-10 w-2 bg-primary rounded-full" />
                      <h2 className="text-3xl font-black font-lora tracking-tight">Workspace</h2>
                    </div>
                    <Card className="border-none shadow-2xl bg-yellow-50 dark:bg-yellow-950/20 border-l-[16px] border-yellow-400 rounded-[4rem] min-h-[500px] flex flex-col hover:rotate-1 transition-transform">
                      <CardHeader className="p-10 pb-4">
                        <CardTitle className="text-xl font-black flex items-center gap-3 text-yellow-800 dark:text-yellow-400">
                          <Brain className="h-8 w-8" /> Brain Dump
                        </CardTitle>
                        <CardDescription className="text-lg text-yellow-700/70 dark:text-yellow-400/60 font-medium">Ideas for {selectedEvent?.title}. Auto-saves.</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col p-10 pt-0">
                        <Textarea 
                          placeholder="Random ideas for this specific event..." 
                          className="flex-1 min-h-[350px] bg-background/50 border-yellow-200 focus-visible:ring-yellow-400 rounded-[2rem] text-base resize-none"
                          value={localBrainDump}
                          onChange={(e) => setLocalBrainDump(e.target.value)}
                        />
                        {saveNoteMutation.isPending && <p className="text-[10px] text-yellow-600 mt-3 font-bold animate-pulse uppercase tracking-[0.3em]">Syncing to cloud...</p>}
                      </CardContent>
                    </Card>
                  </section>

                  <section className="space-y-8">
                    <div className="flex items-center gap-4 px-4">
                      <div className="h-10 w-2 bg-primary rounded-full" />
                      <h2 className="text-3xl font-black font-lora tracking-tight">Quick Links</h2>
                    </div>
                    <Card className="border-none shadow-2xl bg-card rounded-[3rem] overflow-hidden">
                      <CardContent className="p-8 grid grid-cols-1 gap-4">
                        {[
                          { label: "Humanitix", url: "https://humanitix.com", icon: <Ticket className="text-primary" /> },
                          { label: "Kit (Email)", url: "https://kit.com", icon: <Mail className="text-primary" /> },
                          { label: "Google Ads", url: "https://ads.google.com", icon: <TrendingUp className="text-primary" /> },
                          { label: "Stonnington Hub", url: "https://www.stonnington.vic.gov.au/MyCity/Dashboard", icon: <Building2 className="text-primary" /> },
                          { label: "FB: Malvern Notice", url: "https://www.facebook.com/groups/301509297978154", icon: <Facebook className="text-blue-600" /> },
                          { label: "FB: Choirs Melb", url: "https://www.facebook.com/groups/1173481763392463/", icon: <Facebook className="text-blue-600" /> }
                        ].map((link, i) => (
                          <Button key={i} variant="outline" className="rounded-2xl h-14 font-black text-base justify-start px-8 border-primary/5 hover:bg-primary/5 shadow-sm" asChild>
                            <a href={link.url} target="_blank" rel="noopener noreferrer">
                              <div className="mr-5">{link.icon}</div>
                              {link.label}
                            </a>
                          </Button>
                        ))}
                      </CardContent>
                    </Card>
                  </section>
                </div>
              </div>

              {/* FULL WIDTH CHECKLIST SECTION */}
              <section className="space-y-10 pt-20 border-t-4 border-border/50">
                <div className="flex items-center gap-5 px-4">
                  <div className="h-12 w-2.5 bg-primary rounded-full" />
                  <h2 className="text-4xl font-black font-lora tracking-tight">Execution Checklist</h2>
                </div>
                <MarketingChecklist eventId={selectedEventId} onActionClick={handleTaskAction} />
              </section>
            </TabsContent>

            <TabsContent value="preparation" className="animate-fade-in-up">
              <div className="max-w-5xl mx-auto">
                <EventPrepChecklist eventId={selectedEventId} />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <EmailMembersModal 
        isOpen={isEmailModalOpen} 
        onClose={() => setIsEmailModalOpen(false)} 
        eventTitle={selectedEvent?.title}
        eventDate={eventDateFormatted}
        eventLink={eventLink}
        eventLocation={eventLocation}
      />
    </div>
  );
};

export default AdminMarketingPlanPage;