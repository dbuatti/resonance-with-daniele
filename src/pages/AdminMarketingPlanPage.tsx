"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Instagram, 
  Mail, 
  Target, 
  Copy, 
  Clock,
  Users,
  Calendar,
  Ticket,
  TrendingUp,
  Music,
  Zap,
  DollarSign,
  Activity,
  Bot,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  Brain,
  ExternalLink,
  Facebook,
  Building2,
  Loader2,
  Sparkles
} from "lucide-react";

import { showSuccess } from "@/utils/toast";
import BackButton from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, differenceInDays, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

import MarketingChecklist from "@/components/admin/MarketingChecklist";
import OutreachTracker from "@/components/admin/OutreachTracker";
import FacebookGroupTracker from "@/components/admin/FacebookGroupTracker";
import EventPrepChecklist from "@/components/admin/EventPrepChecklist";
import EmailMembersModal from "@/components/admin/EmailMembersModal";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

const AdminMarketingPlanPage: React.FC = () => {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [localBrainDump, setLocalBrainDump] = useState("");

  // Fetch all events
  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ["allEventsForMarketingPlan"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Auto-select first event
  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const selectedEvent = useMemo(() => 
    events.find((e) => e.id === selectedEventId), 
    [events, selectedEventId]
  );

  // Live stats & financials
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["eventMarketingStats", selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return null;

      const [{ data: orders }, { data: expenses }] = await Promise.all([
        supabase
          .from("event_orders")
          .select("valid_tickets, your_earnings, order_date")
          .eq("event_id", selectedEventId)
          .order("order_date", { ascending: false }),
        supabase
          .from("event_expenses")
          .select("amount")
          .eq("event_id", selectedEventId)
      ]);

      const totalTickets = orders?.reduce((sum, o) => sum + (o.valid_tickets || 0), 0) || 0;
      const totalEarnings = orders?.reduce((sum, o) => sum + Number(o.your_earnings || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      return {
        totalTickets,
        totalEarnings,
        totalExpenses,
        recentOrders: orders?.slice(0, 5) || [],
      };
    },
    enabled: !!selectedEventId,
  });

  // Nominated focus folder
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

  // Countdown & derived values
  const daysUntil = useMemo(() => {
    if (!selectedEvent?.date) return null;
    return differenceInDays(
      startOfDay(new Date(selectedEvent.date)),
      startOfDay(new Date())
    );
  }, [selectedEvent?.date]);

  const dailyMission = useMemo(() => {
    if (daysUntil === null) return null;

    const missions: Record<number | string, any> = {
      [daysUntil > 7 ? "default" : daysUntil]: {
        title: "Build Anticipation",
        task: "Share a 'behind the scenes' photo of your prep.",
        icon: <Sparkles className="h-10 w-10" />,
      },
      7: { title: "The 1-Week Mark", task: "Email the full list. Remind them why this song matters.", icon: <Mail className="h-10 w-10" /> },
      3: { title: "Relational Push", task: "Message your '10 People'. This is the most important day.", icon: <Target className="h-10 w-10" /> },
      2: { title: "Vibe Check", task: "Post a video of you playing the chords. Make it feel safe.", icon: <Instagram className="h-10 w-10" /> },
      1: { title: "Final Call", task: "Instagram Story: 'Last few spots left. See you tomorrow?'", icon: <Zap className="h-10 w-10" /> },
      0: { title: "Showtime", task: "Inhabit the room. Focus on the humans, not the notes.", icon: <Heart className="h-10 w-10" /> },
    };

    return missions[daysUntil] || missions.default;
  }, [daysUntil]);

  const eventHealth = useMemo(() => {
    if (!stats || daysUntil === null) {
      return { label: "Unknown", color: "text-muted-foreground", icon: <Activity className="h-5 w-5" /> };
    }

    const progress = (stats.totalTickets / 125) * 100;

    if (progress >= 80) return { label: "Near Capacity", color: "text-green-500", icon: <CheckCircle2 className="h-5 w-5" /> };
    if (daysUntil <= 3 && progress < 40) return { label: "Critical Push Needed", color: "text-destructive", icon: <ShieldAlert className="h-5 w-5" /> };
    if (daysUntil <= 7 && progress < 60) return { label: "Needs Attention", color: "text-yellow-500", icon: <AlertTriangle className="h-5 w-5" /> };
    return { label: "On Track", color: "text-primary", icon: <TrendingUp className="h-5 w-5" /> };
  }, [stats, daysUntil]);

  // Live countdown timer
  useEffect(() => {
    if (!selectedEvent?.date) return;

    const targetDate = new Date(`${selectedEvent.date}T10:00:00`).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const distance = targetDate - now;

      if (distance < 0) {
        setTimeLeft("Event Started!");
        return;
      }

      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${d}d ${h}h ${m}m`);
    }, 60000); // Update every minute (sufficient for display)

    return () => clearInterval(interval);
  }, [selectedEvent]);

  // Brain Dump Persistence
  const { data: noteData } = useQuery({
    queryKey: ["adminBrainDump", selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return "";
      const { data, error } = await supabase
        .from("admin_notes")
        .select("content")
        .eq("note_key", `brain_dump_${selectedEventId}`)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.content || "";
    },
    enabled: !!user && !!selectedEventId,
  });

  const debouncedBrainDump = useDebounce(localBrainDump, 800);

  useEffect(() => {
    if (noteData !== undefined) setLocalBrainDump(noteData);
  }, [noteData]);

  const saveNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedEventId || !user?.id) return;
      await supabase.from("admin_notes").upsert({
        admin_id: user.id,
        note_key: `brain_dump_${selectedEventId}`,
        event_id: selectedEventId,
        content,
      }, { onConflict: "note_key" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBrainDump", selectedEventId] });
    },
  });

  useEffect(() => {
    if (debouncedBrainDump !== noteData && selectedEventId) {
      saveNoteMutation.mutate(debouncedBrainDump);
    }
  }, [debouncedBrainDump, noteData, selectedEventId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showSuccess(`${label} copied to clipboard!`);
  };

  // Dynamic values
  const eventDate = selectedEvent ? new Date(selectedEvent.date) : new Date();
  const eventDateFormatted = selectedEvent ? format(eventDate, "EEEE, MMMM do") : "";
  const eventDayName = selectedEvent ? format(eventDate, "EEEE") : "Saturday";
  const eventLocation = selectedEvent?.location || "Armadale Baptist Church";
  const eventLink = selectedEvent?.humanitix_link || "https://events.humanitix.com/resonance-choir";
  const focusSong = nominatedFolder?.name || "some incredible new harmonies";
  const promoExpiryDate = subDays(eventDate, 1);
  const promoExpiryFormatted = format(promoExpiryDate, "EEEE 'at' 1:00 PM (MM/dd/yyyy)");

  // Dynamic AI Prompt
  const aiPrompt = useMemo(() => `
I am Daniele Buatti, a vocal coach and choir director. I'm running a pop-up choir session called "${selectedEvent?.title}" on ${eventDateFormatted} at ${eventLocation}.

We are focusing on the song "${focusSong}". 
Current status: ${stats?.totalTickets || 0} tickets sold out of 125 target. 
Days remaining: ${daysUntil ?? "unknown"}.

Please generate 3 variations of a warm, expressive, and human-centric Instagram caption:
1. Focus on the joy of the specific song "${focusSong}".
2. Focus on the community and meeting new people in Armadale.
3. A "Final Call" urgency post mentioning the SING20 discount code.

Keep the tone grounded, resonant, and inviting. Avoid corporate language. Use emojis sparingly.
  `.trim(), [selectedEvent, eventDateFormatted, eventLocation, focusSong, stats, daysUntil]);

  // Marketing Templates
  const marketingTemplates = useMemo(() => [
    {
      label: "Community Post",
      icon: <Users className="h-5 w-5" />,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
      text: `Any local singers (or shower-singers) in Armadale? 🎶\n\nHi everyone! I’m Daniele, a local music director. I’m hosting a pop-up choir session at ${eventLocation} on ${eventDateFormatted}.\n\nWe're learning "${focusSong}" this month. It’s a low-pressure morning with no auditions and no experience needed.\n\n📍 ${eventLocation}\n⏰ ${eventDateFormatted}, 10am–1pm\n🎟️ ${eventLink}`,
    },
    {
      label: "Instagram Caption",
      icon: <Instagram className="h-5 w-5" />,
      color: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
      text: `We're back for ${selectedEvent?.title || "our next session"}.\n\nWe'll be diving into "${focusSong}" — the harmonies are sounding beautiful already.\n\n📍 ${eventLocation}\n⏰ ${eventDateFormatted}, 10am\n\nIf you've been meaning to come, this is the one. Use SING20 for 20% off until ${format(promoExpiryDate, "EEEE")}.\n\nCome sing with us. 🌿`,
    },
    {
      label: "Email to Past Singers",
      icon: <Mail className="h-5 w-5" />,
      color: "bg-primary/5 text-primary",
      text: `Subject: Let's sing together this ${eventDayName}! 🎶\n\nHi there,\n\nI’d love to see you back in the circle for ${selectedEvent?.title} this ${eventDateFormatted} (10am–1pm) at ${eventLocation}.\n\nWe're working on "${focusSong}", and I can't wait to hear how it sounds with a full room.\n\nUse code SING20 for 20% off (valid until ${promoExpiryFormatted}).\n\nGrab your spot: ${eventLink}\n\n— Daniele`,
      action: () => {
        const subject = encodeURIComponent(`Let's sing together for ${selectedEvent?.title}! 🎶`);
        const body = encodeURIComponent(`Hi there,\n\nI’d love to see you back...`); // shortened for brevity
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      },
    },
    {
      label: "Song Reveal",
      icon: <Music className="h-5 w-5" />,
      color: "bg-accent/10 text-accent-foreground",
      text: `The repertoire for ${selectedEvent?.title} is officially here. 🕊️\n\nWe're diving into:\n✨ Billie Eilish - "What Was I Made For?"\n✨ The Wailin' Jennys - "The Parting Glass"\n\nCome and inhabit these songs with us. Link in bio.`,
    },
    {
      label: "Flash Sale",
      icon: <Zap className="h-5 w-5" />,
      color: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400",
      text: `Subject: 24-Hour Flash Sale: 15% off Resonance ⚡\n\nHi there,\n\nWe’re just a few days away and the energy is building.\n\nFor the next 24 hours, use FLASH15 for 15% off.\n\n${eventLink}\n\nHope to see you in the circle.\n\n— Daniele`,
    },
  ], [selectedEvent, eventDateFormatted, eventLocation, focusSong, promoExpiryDate, eventLink, eventDayName, promoExpiryFormatted]);

  if (loadingEvents) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const targetTickets = 125;
  const netProfit = stats ? stats.totalEarnings - stats.totalExpenses : 0;

  return (
    <div className="min-h-screen bg-background/50 pb-20">
      <div className="max-w-[1600px] mx-auto px-4 md:px-12 py-8 md:py-12">
        <BackButton className="mb-8" to="/admin" />

        {/* Hero Header */}
        <header className="bg-card border border-primary/10 rounded-[3.5rem] p-12 md:p-20 shadow-xl mb-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-12">
            <div className="space-y-8 lg:max-w-lg">
              <div className="flex flex-wrap gap-4">
                <Badge className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-xs font-black tracking-widest">COMMAND CENTER</Badge>
                <div className={cn("flex items-center gap-2 px-6 py-2.5 rounded-full border-2 font-black text-xs tracking-widest", eventHealth.color)}>
                  {eventHealth.icon} {eventHealth.label}
                </div>
              </div>

              <h1 className="text-6xl md:text-8xl font-black font-lora tracking-tighter leading-none">Operation Hub</h1>

              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 ml-1">ACTIVE SESSION</p>
                <Select value={selectedEventId || ""} onValueChange={setSelectedEventId}>
                  <SelectTrigger className="h-20 text-2xl font-black rounded-3xl px-8 border-4 border-primary/10">
                    <SelectValue placeholder="Select an event..." />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id} className="py-4 text-lg">
                        {event.title} • {format(new Date(event.date), "MMM d")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Live Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full lg:w-auto">
              <Card className="bg-background p-8 rounded-3xl border-none shadow-xl flex flex-col items-center text-center">
                <Clock className="h-9 w-9 text-primary mb-3" />
                <p className="text-xs font-black tracking-widest text-muted-foreground">T-MINUS</p>
                <p className="text-4xl font-black text-primary mt-1 tracking-tighter">{timeLeft || "—"}</p>
              </Card>

              <Card className="bg-background p-8 rounded-3xl border-none shadow-xl flex flex-col items-center text-center">
                <Ticket className="h-9 w-9 text-green-600 mb-3" />
                <p className="text-xs font-black tracking-widest text-muted-foreground">TICKETS</p>
                <p className="text-4xl font-black text-green-600 mt-1 tracking-tighter">
                  {stats?.totalTickets || 0} / {targetTickets}
                </p>
              </Card>

              <Card className="bg-primary text-primary-foreground p-8 rounded-3xl border-none shadow-xl flex flex-col items-center text-center">
                <DollarSign className="h-9 w-9 mb-3" />
                <p className="text-xs font-black tracking-widest opacity-75">NET PROFIT</p>
                <p className="text-4xl font-black mt-1 tracking-tighter">${netProfit}</p>
              </Card>
            </div>
          </div>
        </header>

        {!selectedEventId ? (
          <Card className="p-32 text-center border-dashed border-4 rounded-[4rem]">
            <Calendar className="h-20 w-20 mx-auto mb-6 text-muted-foreground/30" />
            <p className="text-3xl font-lora font-bold text-muted-foreground">Select an event to launch the operation.</p>
          </Card>
        ) : (
          <Tabs defaultValue="execution" className="space-y-20">
            <div className="flex justify-center">
              <TabsList className="grid w-full max-w-md grid-cols-2 h-16 rounded-3xl p-1 bg-muted/70">
                <TabsTrigger value="execution" className="rounded-2xl font-black text-lg">Execution</TabsTrigger>
                <TabsTrigger value="preparation" className="rounded-2xl font-black text-lg">Preparation</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="execution" className="space-y-24">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Relational Outreach + FB */}
                <div className="lg:col-span-4 space-y-12">
                  <section>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-9 w-1 bg-primary rounded-full" />
                      <h2 className="text-3xl font-black font-lora">Relational Outreach</h2>
                    </div>
                    <Card className="border-4 border-primary/10 bg-primary/5 rounded-[3rem] shadow-2xl">
                      <CardContent className="p-10">
                        <OutreachTracker eventId={selectedEventId} />
                      </CardContent>
                    </Card>
                  </section>

                  <section>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-9 w-1 bg-primary rounded-full" />
                      <h2 className="text-3xl font-black font-lora">Facebook Groups</h2>
                    </div>
                    <Card className="rounded-[3rem] shadow-2xl">
                      <CardContent className="p-8">
                        <FacebookGroupTracker eventId={selectedEventId} postText={marketingTemplates[0].text} />
                      </CardContent>
                    </Card>
                  </section>
                </div>

                {/* Strategy & Assets */}
                <div className="lg:col-span-5 space-y-12">
                  {dailyMission && (
                    <Card className="bg-gradient-to-br from-accent to-primary/10 border-none rounded-[3.5rem] overflow-hidden shadow-2xl">
                      <CardContent className="p-12 flex gap-8">
                        <div className="bg-white/20 p-6 rounded-3xl shrink-0">
                          {dailyMission.icon}
                        </div>
                        <div>
                          <p className="uppercase text-xs font-black tracking-widest opacity-70">TODAY'S MISSION</p>
                          <h3 className="text-4xl font-black font-lora mt-2 leading-none">{dailyMission.title}</h3>
                          <p className="mt-4 text-xl leading-relaxed">{dailyMission.task}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* AI Prompt Generator */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-9 w-1 bg-primary rounded-full" />
                      <h2 className="text-3xl font-black font-lora">AI Strategy</h2>
                    </div>
                    <Card className="rounded-[3rem] border-none shadow-2xl overflow-hidden">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <Bot className="text-primary" /> Prompt Generator
                        </CardTitle>
                        <CardDescription>Copy into Claude / Gemini for perfect copy</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="bg-muted/50 p-8 rounded-3xl text-sm leading-relaxed border border-border/60 font-medium">
                          {aiPrompt}
                        </div>
                        <Button 
                          onClick={() => copyToClipboard(aiPrompt, "AI Prompt")}
                          className="w-full h-14 text-lg font-black rounded-2xl"
                        >
                          <Copy className="mr-3" /> Copy AI Prompt
                        </Button>
                      </CardContent>
                    </Card>
                  </section>

                  {/* Marketing Assets */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-9 w-1 bg-primary rounded-full" />
                      <h2 className="text-3xl font-black font-lora">Marketing Assets</h2>
                    </div>

                    <div className="space-y-6">
                      {marketingTemplates.map((asset, i) => (
                        <Card key={i} className="rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all group">
                          <div className="px-8 py-6 flex justify-between items-center border-b">
                            <div className="flex items-center gap-4">
                              <div className={cn("p-3 rounded-2xl", asset.color)}>{asset.icon}</div>
                              <span className="font-semibold text-lg">{asset.label}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => copyToClipboard(asset.text, asset.label)}
                                className="font-mono text-xs"
                              >
                                <Copy className="mr-2 h-4 w-4" /> COPY
                              </Button>
                              {asset.action && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={asset.action}
                                  className="font-mono text-xs text-primary"
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" /> OPEN
                                </Button>
                              )}
                            </div>
                          </div>
                          <CardContent className="p-8 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                            {asset.text.length > 280 ? asset.text.slice(0, 280) + "..." : asset.text}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Workspace */}
                <div className="lg:col-span-3 space-y-12">
                  <section className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-9 w-1 bg-primary rounded-full" />
                      <h2 className="text-3xl font-black font-lora">Brain Dump</h2>
                    </div>
                    <Card className="rounded-[3rem] border-l-8 border-yellow-400 bg-yellow-50/80 dark:bg-yellow-950/30 min-h-[480px] flex flex-col shadow-xl">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-3 text-yellow-700 dark:text-yellow-300">
                          <Brain className="h-7 w-7" /> Ideas for this session
                        </CardTitle>
                        <CardDescription>Auto-saves to Supabase</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 p-8 pt-0">
                        <Textarea
                          value={localBrainDump}
                          onChange={(e) => setLocalBrainDump(e.target.value)}
                          placeholder="Random thoughts, song ideas, marketing angles..."
                          className="flex-1 min-h-[340px] bg-white/70 dark:bg-black/30 border-yellow-200 focus-visible:ring-yellow-400 rounded-3xl text-base resize-y"
                        />
                        {saveNoteMutation.isPending && (
                          <p className="text-xs text-yellow-600 mt-3 font-medium">Saving...</p>
                        )}
                      </CardContent>
                    </Card>
                  </section>

                  <section>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-9 w-1 bg-primary rounded-full" />
                      <h2 className="text-3xl font-black font-lora">Quick Links</h2>
                    </div>
                    <Card className="rounded-3xl p-6 shadow-xl">
                      <div className="grid gap-3">
                        {[
                          { label: "Humanitix", url: "https://humanitix.com", icon: <Ticket /> },
                          { label: "Kit (Email)", url: "https://kit.com", icon: <Mail /> },
                          { label: "Google Ads", url: "https://ads.google.com", icon: <TrendingUp /> },
                          { label: "Stonnington Council", url: "https://www.stonnington.vic.gov.au", icon: <Building2 /> },
                          { label: "FB Malvern Notice", url: "https://www.facebook.com/groups/301509297978154", icon: <Facebook /> },
                        ].map((link, i) => (
                          <Button key={i} variant="outline" className="h-14 justify-start rounded-2xl" asChild>
                            <a href={link.url} target="_blank" rel="noopener noreferrer">
                              <span className="mr-4 text-primary">{link.icon}</span>
                              {link.label}
                            </a>
                          </Button>
                        ))}
                      </div>
                    </Card>
                  </section>
                </div>
              </div>

              {/* Execution Checklist */}
              <section className="pt-12 border-t">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-12 w-1.5 bg-primary rounded-full" />
                  <h2 className="text-4xl font-black font-lora tracking-tight">Execution Checklist</h2>
                </div>
                <MarketingChecklist 
                  eventId={selectedEventId} 
                  onActionClick={(taskId) => taskId === "email-regulars" && setIsEmailModalOpen(true)} 
                />
              </section>
            </TabsContent>

            <TabsContent value="preparation">
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