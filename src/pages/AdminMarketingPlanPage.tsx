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
  Leaf,
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
  AlertTriangle,
  Activity,
  Bot,
  CheckCircle2,
  ShieldAlert,
  Building2,
  ListTodo
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import BackButton from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/badge";
import MarketingChecklist from "@/components/admin/MarketingChecklist";
import { Textarea } from "@/components/ui/textarea";
import OutreachTracker from "@/components/admin/OutreachTracker";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/integrations/supabase/auth";
import { useDebounce } from "@/hooks/use-debounce";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, differenceInDays, startOfDay } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import EmailMembersModal from "@/components/admin/EmailMembersModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventPrepChecklist from "@/components/admin/EventPrepChecklist";

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
  const ticketProgress = stats ? (stats.totalTickets / targetTickets) * 100 : 0;
  const netProfit = stats ? stats.totalEarnings - stats.totalExpenses : 0;

  return (
    <div className="space-y-8 py-8 md:py-12 bg-background/50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4">
        <BackButton className="mb-6" to="/admin" />
        
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
          <div className="space-y-6 flex-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground px-3 py-1 rounded-full font-black uppercase tracking-widest text-[10px]">War Room</Badge>
              <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border-2 font-black uppercase tracking-widest text-[10px]", eventHealth.color)}>
                {eventHealth.icon} {eventHealth.label}
              </div>
            </div>
            <h1 className="text-5xl md:text-8xl font-black font-lora tracking-tighter leading-none">Command Center</h1>
            
            <div className="w-full md:w-96 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Operation</label>
              <Select value={selectedEventId || ""} onValueChange={setSelectedEventId}>
                <SelectTrigger className="h-16 rounded-[1.5rem] shadow-xl bg-card border-4 border-primary/10 text-xl font-black">
                  <SelectValue placeholder="Choose an event..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {events?.map((event) => (
                    <SelectItem key={event.id} value={event.id} className="py-4 font-bold">
                      {event.title} ({format(new Date(event.date), "MMM d")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
            <Card className="bg-card p-6 rounded-[2.5rem] shadow-2xl border-none flex items-center gap-4 min-w-[220px]">
              <div className="bg-primary/10 p-4 rounded-2xl">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">T-Minus</p>
                <p className="text-3xl font-black text-primary tracking-tighter">{timeLeft}</p>
              </div>
            </Card>
            
            <Card className="bg-primary text-primary-foreground p-6 rounded-[2.5rem] shadow-2xl border-none flex items-center gap-4 min-w-[220px]">
              <div className="bg-white/20 p-4 rounded-2xl">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Net Profit</p>
                <p className="text-3xl font-black tracking-tighter">${netProfit.toFixed(0)}</p>
              </div>
            </Card>
          </div>
        </header>

        {!selectedEventId ? (
          <Card className="p-24 text-center border-dashed border-4 rounded-[4rem]">
            <Calendar className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-10" />
            <p className="text-2xl font-bold text-muted-foreground font-lora">Select an operation to begin.</p>
          </Card>
        ) : (
          <Tabs defaultValue="execution" className="space-y-12">
            <div className="flex justify-center">
              <TabsList className="grid w-full max-w-md grid-cols-2 rounded-2xl h-14 p-1 bg-muted/50">
                <TabsTrigger value="execution" className="rounded-xl font-black flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Execution
                </TabsTrigger>
                <TabsTrigger value="preparation" className="rounded-xl font-black flex items-center gap-2">
                  <ListTodo className="h-4 w-4" /> Preparation
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="execution" className="space-y-12">
              {/* Daily Mission Banner */}
              {dailyMission && (
                <section className="animate-fade-in-up">
                  <Card className="bg-accent text-accent-foreground border-none shadow-2xl rounded-[3rem] overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <CardContent className="p-10 flex flex-col md:flex-row items-center gap-8 relative z-10">
                      <div className="bg-white/20 p-6 rounded-[2rem] shadow-inner">
                        {React.cloneElement(dailyMission.icon as React.ReactElement, { className: "h-12 w-12" })}
                      </div>
                      <div className="flex-1 text-center md:text-left space-y-2">
                        <h3 className="text-xs font-black uppercase tracking-[0.4em] opacity-70">Today's High-Impact Mission</h3>
                        <p className="text-4xl font-black font-lora leading-tight">{dailyMission.title}: {dailyMission.task}</p>
                      </div>
                      <Button size="lg" className="bg-accent-foreground text-accent hover:bg-accent-foreground/90 font-black rounded-2xl h-16 px-8 shadow-2xl group" onClick={() => {}}>
                        Execute Mission <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* Stats Grid */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="border-none bg-muted/30 p-8 rounded-[2.5rem] shadow-inner flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Ticket className="h-4 w-4" /> Ticket Momentum
                    </h3>
                    <p className="text-4xl font-black text-primary">{stats?.totalTickets || 0} / {targetTickets}</p>
                  </div>
                  <div className="mt-6 space-y-2">
                    <Progress value={ticketProgress} className="h-3 bg-primary/10" />
                    <p className="text-[10px] font-bold text-muted-foreground text-right">{Math.round(ticketProgress)}% of target reached</p>
                  </div>
                </Card>

                <Card className="border-none bg-muted/30 p-8 rounded-[2.5rem] shadow-inner flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-green-600 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> Revenue Intel
                    </h3>
                    <p className="text-4xl font-black text-green-600">${(stats?.totalEarnings || 0).toFixed(0)}</p>
                  </div>
                  <div className="mt-6 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expenses</p>
                      <p className="text-lg font-bold text-red-500">-${(stats?.totalExpenses || 0).toFixed(0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Break Even</p>
                      <p className="text-lg font-bold text-foreground">{stats && stats.totalEarnings >= stats.totalExpenses ? "✅ SECURED" : "PENDING"}</p>
                    </div>
                  </div>
                </Card>

                <Card className="border-none bg-muted/30 p-8 rounded-[2.5rem] shadow-inner flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-accent-foreground flex items-center gap-2">
                      <Music className="h-4 w-4" /> Repertoire Focus
                    </h3>
                    <p className="text-2xl font-black font-lora leading-tight line-clamp-2">"{focusSong}"</p>
                  </div>
                  <Button variant="outline" className="mt-6 rounded-xl font-bold border-primary/20 text-primary" asChild>
                    <a href={`/resources?folderId=${nominatedFolder?.name}`} target="_blank" rel="noopener noreferrer">View Materials</a>
                  </Button>
                </Card>
              </section>

              <section>
                <Card className="border-4 border-primary bg-primary/5 shadow-2xl overflow-hidden rounded-[3rem]">
                  <CardContent className="p-10 flex flex-col lg:flex-row items-start gap-12">
                    <div className="lg:w-1/3 space-y-6">
                      <div className="bg-primary text-primary-foreground p-6 rounded-3xl shadow-xl inline-block">
                        <Target className="h-12 w-12" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Relational Outreach</h2>
                        <p className="text-4xl font-black font-lora leading-tight">The 10 People Rule.</p>
                        <p className="text-muted-foreground leading-relaxed">Identify 10 specific people who would love this session. Message them personally. This is your highest ROI activity.</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 w-full">
                      <OutreachTracker eventId={selectedEventId} />
                    </div>
                  </CardContent>
                </Card>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-12">
                  {/* AI Strategy Assistant */}
                  <section className="space-y-6">
                    <h2 className="text-3xl font-black font-lora flex items-center gap-3">
                      <Bot className="h-8 w-8 text-primary" /> AI Strategy Assistant
                    </h2>
                    <Card className="border-none shadow-xl bg-gradient-to-br from-primary/5 to-accent/5 rounded-[2rem] overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold">Generate Fresh Marketing Copy</CardTitle>
                        <CardDescription>Copy this prompt and paste it into Claude or Gemini for custom variations.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-background/80 p-6 rounded-2xl border-2 border-primary/10 text-sm font-medium text-muted-foreground italic leading-relaxed">
                          "{aiPrompt.substring(0, 200)}..."
                        </div>
                        <Button className="w-full h-12 font-black rounded-xl" onClick={() => copyToClipboard(aiPrompt, "AI Prompt")}>
                          <Copy className="h-4 w-4 mr-2" /> Copy Full AI Prompt
                        </Button>
                      </CardContent>
                    </Card>
                  </section>

                  <section className="space-y-6">
                    <h2 className="text-3xl font-black font-lora flex items-center gap-3">
                      <Mic2 className="h-8 w-8 text-primary" /> Marketing Assets
                    </h2>
                    
                    <div className="space-y-6">
                      <Card className="border-none shadow-xl bg-card overflow-hidden rounded-[2rem]">
                        <div className="bg-muted/50 px-8 py-4 flex justify-between items-center border-b">
                          <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Users className="h-4 w-4" /> Community Post (FB Groups)
                          </span>
                          <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black hover:bg-primary/10 hover:text-primary" onClick={() => copyToClipboard(fullCommunityPost, "Community Post")}>
                            <Copy className="h-4 w-4 mr-2" /> COPY
                          </Button>
                        </div>
                        <CardContent className="p-8">
                          <p className="text-base italic text-muted-foreground leading-relaxed whitespace-pre-wrap">{fullCommunityPost}</p>
                        </CardContent>
                      </Card>

                      <Card className="border-none shadow-xl bg-card overflow-hidden rounded-[2rem]">
                        <div className="bg-muted/50 px-8 py-4 flex justify-between items-center border-b">
                          <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Instagram className="h-4 w-4" /> Instagram Caption
                          </span>
                          <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black hover:bg-primary/10 hover:text-primary" onClick={() => copyToClipboard(authenticCaption, "Instagram Caption")}>
                            <Copy className="h-4 w-4 mr-2" /> COPY
                          </Button>
                        </div>
                        <CardContent className="p-8">
                          <p className="text-base italic text-muted-foreground leading-relaxed whitespace-pre-wrap">{authenticCaption}</p>
                        </CardContent>
                      </Card>

                      <Card className="border-none shadow-xl bg-card overflow-hidden rounded-[2rem]">
                        <div className="bg-muted/50 px-8 py-4 flex justify-between items-center border-b">
                          <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Mail className="h-4 w-4" /> Email Template
                          </span>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black hover:bg-primary/10 hover:text-primary" onClick={() => copyToClipboard(authenticEmail, "Email Template")}>
                              <Copy className="h-4 w-4 mr-2" /> COPY
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black text-primary hover:bg-primary/10" onClick={handleOpenMail}>
                              <ExternalLink className="h-4 w-4 mr-2" /> OPEN MAIL
                            </Button>
                          </div>
                        </div>
                        <CardContent className="p-8">
                          <p className="text-base italic text-muted-foreground leading-relaxed whitespace-pre-wrap">{authenticEmail}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </section>
                </div>

                <div className="lg:col-span-5">
                  <div className="sticky top-24 space-y-10">
                    {/* Live Intelligence Feed */}
                    <Card className="border-none shadow-xl bg-card rounded-[2rem] overflow-hidden">
                      <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                          <Activity className="h-4 w-4 text-primary" /> Live Intelligence
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-border">
                          {stats?.recentOrders.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground italic">No recent activity.</div>
                          ) : (
                            stats?.recentOrders.map((order: any, i: number) => (
                              <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="bg-primary/10 p-2 rounded-lg">
                                    <UserPlus className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold">{order.first_name} {order.last_name}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-black">{format(new Date(order.order_date), "MMM d, h:mm a")}</p>
                                  </div>
                                </div>
                                <Badge variant="outline" className="font-black text-[10px]">{order.valid_tickets} TIX</Badge>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl bg-yellow-50 dark:bg-yellow-950/20 border-l-[12px] border-yellow-400 rounded-[2.5rem]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-black flex items-center gap-3 text-yellow-800 dark:text-yellow-400">
                          <Brain className="h-6 w-6" /> Brain Dump
                        </CardTitle>
                        <CardDescription className="text-yellow-700/70 dark:text-yellow-400/60 font-medium">Ideas for {selectedEvent?.title}. Auto-saves.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Textarea 
                          placeholder="Random ideas for this specific event..." 
                          className="min-h-[200px] bg-background/50 border-yellow-200 focus-visible:ring-yellow-400 rounded-2xl text-base"
                          value={localBrainDump}
                          onChange={(e) => setLocalBrainDump(e.target.value)}
                        />
                        {saveNoteMutation.isPending && <p className="text-[10px] text-yellow-600 mt-3 font-bold animate-pulse uppercase tracking-widest">Syncing to cloud...</p>}
                      </CardContent>
                    </Card>

                    <MarketingChecklist eventId={selectedEventId} onActionClick={handleTaskAction} />
                    
                    <Card className="border-none shadow-xl bg-card rounded-[2rem] overflow-hidden">
                      <CardHeader className="bg-muted/30">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                          <Globe className="h-4 w-4" /> Quick Links
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 grid grid-cols-2 gap-3">
                        <Button variant="outline" className="rounded-xl h-12 font-bold" asChild><a href="https://ads.google.com/aw/campaigns?ocid=8144309883&euid=6471693261&__u=3594183589&uscid=8144309883&__c=6279405667&authuser=0&workspaceId=0&subid=au-en-awhp-g-aw-c-home-signin-bgc!o2-%7Cib:none%7Cib:6653296821%7Cib:9279461727%7Cib:7966379274%7C-ahpm-0000000200-0000000000%7C-ahpm-0000000179-0000000001" target="_blank" rel="noopener noreferrer">Google Ads</a></Button>
                        <Button variant="outline" className="rounded-xl h-12 font-bold" asChild><a href="https://www.stonnington.vic.gov.au/MyCity/Dashboard" target="_blank" rel="noopener noreferrer">Stonnington Hub</a></Button>
                        <Button variant="outline" className="rounded-xl h-12 font-bold" asChild><a href="https://humanitix.com" target="_blank" rel="noopener noreferrer">Humanitix</a></Button>
                        <Button variant="outline" className="rounded-xl h-12 font-bold" asChild><a href="https://kit.com" target="_blank" rel="noopener noreferrer">Kit (Email)</a></Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preparation">
              <EventPrepChecklist eventId={selectedEventId} />
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