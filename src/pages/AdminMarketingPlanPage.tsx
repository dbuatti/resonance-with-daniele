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
  Sparkles,
  Loader2,
  ExternalLink,
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
  Facebook,
  LayoutDashboard,
  AlertTriangle,
  Building2,
  ChevronRight,
  Brain,
  ListTodo,
  Tag
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventPrepChecklist from "@/components/admin/EventPrepChecklist";
import EmailMembersModal from "@/components/admin/EmailMembersModal";
import FounderStrategyCard from "@/components/admin/FounderStrategyCard";
import { cn } from "@/lib/utils";

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

  // 2. Fetch Live Stats
  const { data: stats } = useQuery({
    queryKey: ["eventMarketingStats", selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return null;
      
      const { data: orders } = await supabase
        .from("event_orders")
        .select("valid_tickets, your_earnings")
        .eq("event_id", selectedEventId);

      const { data: expenses } = await supabase
        .from("event_expenses")
        .select("amount")
        .eq("event_id", selectedEventId);

      const totalTickets = orders?.reduce((sum, o) => sum + (o.valid_tickets || 0), 0) || 0;
      const totalEarnings = orders?.reduce((sum, o) => sum + Number(o.your_earnings || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      
      return { totalTickets, totalEarnings, totalExpenses };
    },
    enabled: !!selectedEventId,
  });

  const { data: nominatedFolder } = useQuery({
    queryKey: ["nominatedFolderForMarketing"],
    queryFn: async () => {
      const { data } = await supabase
        .from("resource_folders")
        .select("name")
        .eq("is_nominated_for_dashboard", true)
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const daysUntil = useMemo(() => {
    if (!selectedEvent?.date) return null;
    return differenceInDays(startOfDay(new Date(selectedEvent.date)), startOfDay(new Date()));
  }, [selectedEvent]);

  const dailyMission = useMemo(() => {
    if (daysUntil === null) return null;
    if (daysUntil > 7) return { title: "Build Anticipation", task: "Share a 'behind the scenes' photo of your prep.", icon: <Sparkles className="h-5 w-5" /> };
    if (daysUntil === 7) return { title: "The 1-Week Mark", task: "Email the full list. Remind them why this song matters.", icon: <Mail className="h-5 w-5" /> };
    if (daysUntil === 3) return { title: "Relational Push", task: "Message your '10 People'. This is the most important day.", icon: <Target className="h-5 w-5" /> };
    if (daysUntil === 2) return { title: "Vibe Check", task: "Post a video of you playing the chords. Make it feel safe.", icon: <Instagram className="h-5 w-5" /> };
    if (daysUntil === 1) return { title: "Final Call", task: "Instagram Story: 'Last few spots left. See you tomorrow?'", icon: <Zap className="h-5 w-5" /> };
    if (daysUntil === 0) return { title: "Showtime", task: "Inhabit the room. Focus on the humans, not the notes.", icon: <Heart className="h-5 w-5" /> };
    return { title: "Keep Momentum", task: "Check your outreach list and follow up on replies.", icon: <Users className="h-5 w-5" /> };
  }, [daysUntil]);

  const eventHealth = useMemo(() => {
    if (!stats || daysUntil === null) return { label: "Unknown", color: "text-muted-foreground", icon: <Activity className="h-4 w-4" /> };
    const target = 125;
    const progress = (stats.totalTickets / target) * 100;
    if (progress >= 80) return { label: "Near Capacity", color: "text-green-600", icon: <CheckCircle2 className="h-4 w-4" /> };
    if (daysUntil <= 3 && progress < 40) return { label: "Critical Push", color: "text-destructive", icon: <ShieldAlert className="h-4 w-4" /> };
    return { label: "On Track", color: "text-primary", icon: <TrendingUp className="h-4 w-4" /> };
  }, [stats, daysUntil]);

  useEffect(() => {
    if (!selectedEvent?.date) return;
    const targetDate = new Date(`${selectedEvent.date}T10:00:00`).getTime();
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      if (distance < 0) { setTimeLeft("Live"); clearInterval(timer); return; }
      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeLeft(`${d}d ${h}h`);
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedEvent]);

  const { data: noteData } = useQuery({
    queryKey: ["adminBrainDump", selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return "";
      const { data } = await supabase.from("admin_notes").select("content").eq("note_key", `brain_dump_${selectedEventId}`).single();
      return data?.content || "";
    },
    enabled: !!selectedEventId,
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
    showSuccess(`${label} copied!`);
  };

  const eventDateFormatted = selectedEvent ? format(new Date(selectedEvent.date), "EEEE, MMMM do") : "";
  const focusSong = nominatedFolder?.name || "new harmonies";
  const eventLink = selectedEvent?.humanitix_link || "https://events.humanitix.com/resonance-choir";

  const authenticCaption = `Resonance is a monthly pop-up choir in Armadale where everyone is welcome. No auditions, no experience needed.\n\nWe're back on ${eventDateFormatted} for our next session!\n\nWe'll be diving into "${focusSong}" — I've just finished the arrangement and I can't wait to hear these harmonies come to life with all of you.\n\n📍 ${selectedEvent?.location || "Armadale"}\n⏰ ${eventDateFormatted}, 10am\n\nGrab your spot here: ${eventLink}\n\nCome sing with us. 🌿`;

  if (loadingEvents) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-10">
      <div className="flex items-center justify-between">
        <BackButton to="/admin" />
        <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full bg-background border text-[10px] font-black uppercase tracking-widest shadow-sm", eventHealth.color)}>
          {eventHealth.icon} {eventHealth.label}
        </div>
      </div>

      {/* Header & Event Selector */}
      <header className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black font-lora tracking-tight">Operation Hub</h1>
            <p className="text-lg text-muted-foreground font-medium">Strategic execution for your upcoming sessions.</p>
          </div>
          <div className="w-full md:w-72">
            <Select value={selectedEventId || ""} onValueChange={setSelectedEventId}>
              <SelectTrigger className="h-12 rounded-xl shadow-sm font-bold border-primary/10">
                <SelectValue placeholder="Select an event..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {events?.map((event) => (
                  <SelectItem key={event.id} value={event.id} className="font-medium">
                    {event.title} ({format(new Date(event.date), "MMM d")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm bg-card rounded-2xl p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/5 rounded-xl text-primary"><Clock className="h-6 w-6" /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">T-Minus</p>
              <p className="text-2xl font-black">{timeLeft}</p>
            </div>
          </Card>
          <Card className="border-none shadow-sm bg-card rounded-2xl p-6 flex items-center gap-4">
            <div className="p-3 bg-green-500/5 rounded-xl text-green-600"><Ticket className="h-6 w-6" /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tickets Sold</p>
              <p className="text-2xl font-black">{stats?.totalTickets || 0} / 125</p>
            </div>
          </Card>
          <Card className="border-none shadow-sm bg-card rounded-2xl p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500/5 rounded-xl text-blue-600"><DollarSign className="h-6 w-6" /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Net Profit</p>
              <p className="text-2xl font-black">${((stats?.totalEarnings || 0) - (stats?.totalExpenses || 0)).toFixed(0)}</p>
            </div>
          </Card>
        </div>
      </header>

      {!selectedEventId ? (
        <Card className="p-20 text-center border-dashed border-2 rounded-[2rem] bg-muted/10">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-xl font-bold text-muted-foreground font-lora">Select an event to begin.</p>
        </Card>
      ) : (
        <Tabs defaultValue="execution" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-2 rounded-xl h-12 p-1 bg-muted/50">
              <TabsTrigger value="execution" className="rounded-lg font-bold">Execution</TabsTrigger>
              <TabsTrigger value="preparation" className="rounded-lg font-bold">Preparation</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="execution" className="space-y-10 animate-fade-in-up">
            {/* Today's Mission Banner */}
            {dailyMission && (
              <Card className="bg-primary text-primary-foreground border-none shadow-lg rounded-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <CardContent className="p-6 flex items-center gap-6 relative z-10">
                  <div className="bg-white/20 p-4 rounded-xl shrink-0">{dailyMission.icon}</div>
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase tracking-widest opacity-70">Today's Mission: {dailyMission.title}</h3>
                    <p className="text-lg font-bold leading-tight">{dailyMission.task}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Main Column */}
              <div className="lg:col-span-2 space-y-8">
                {/* Founder Strategy Card - Only show if it's the current session (April) */}
                {selectedEvent?.title.includes("Session #12") && (
                  <FounderStrategyCard 
                    eventDate="Sunday, May 24th" 
                    eventLink="https://events.humanitix.com/resonance-choir-may" 
                  />
                )}

                {/* Public Launch Reference Card - Only show for May event */}
                {selectedEvent?.title.includes("May") && (
                  <Card className="border-none shadow-xl bg-card rounded-[2rem] overflow-hidden border-t-4 border-primary">
                    <CardHeader className="bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Ticket className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl font-black font-lora">Public Launch Reference</CardTitle>
                      </div>
                      <CardDescription className="font-medium">Enable these tiers in Humanitix 7 days after the April event.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { label: "General Admission", price: "$30.00", qty: 30 },
                          { label: "Early Bird", price: "$25.00", qty: 30 },
                          { label: "Concession / Community", price: "$20.00", qty: 30 },
                          { label: "Donations", price: "Any Amount", qty: 30 },
                          { label: "Helpers!", price: "$0.00", qty: 5 },
                        ].map((tier, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
                            <div>
                              <p className="font-bold text-sm">{tier.label}</p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Qty: {tier.qty}</p>
                            </div>
                            <Badge className="bg-primary/10 text-primary border-none font-black">{tier.price}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <section className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <ListTodo className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-black font-lora">Execution Checklist</h2>
                  </div>
                  <MarketingChecklist eventId={selectedEventId} onActionClick={(id) => id === "email-regulars" && setIsEmailModalOpen(true)} />
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Facebook className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-black font-lora">Facebook Groups</h2>
                  </div>
                  <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                      <FacebookGroupTracker eventId={selectedEventId} postText={authenticCaption} />
                    </CardContent>
                  </Card>
                </section>
              </div>

              {/* Sidebar Column */}
              <div className="space-y-8">
                <section className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Target className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-black font-lora">Relational Outreach</h2>
                  </div>
                  <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold">The 10 People Rule</CardTitle>
                      <CardDescription>Personal connection is king.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <OutreachTracker eventId={selectedEventId} />
                    </CardContent>
                  </Card>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Bot className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-black font-lora">AI Strategy</h2>
                  </div>
                  <Card className="border-none shadow-sm rounded-2xl bg-primary/5">
                    <CardContent className="p-6 space-y-4">
                      <p className="text-xs font-medium text-muted-foreground italic leading-relaxed line-clamp-3">
                        "I am Daniele Buatti... We are focusing on {focusSong}... {stats?.totalTickets} sold..."
                      </p>
                      <Button variant="outline" className="w-full h-10 font-bold rounded-xl border-primary/20 text-primary" onClick={() => copyToClipboard(authenticCaption, "AI Prompt")}>
                        <Copy className="h-4 w-4 mr-2" /> Copy Prompt
                      </Button>
                    </CardContent>
                  </Card>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Brain className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-black font-lora">Workspace</h2>
                  </div>
                  <Card className="border-none shadow-sm rounded-2xl bg-yellow-50/50 dark:bg-yellow-950/10">
                    <CardContent className="p-6 space-y-3">
                      <Textarea 
                        placeholder="Brain dump ideas here..." 
                        className="min-h-[150px] bg-transparent border-yellow-200/50 rounded-xl text-sm resize-none"
                        value={localBrainDump}
                        onChange={(e) => setLocalBrainDump(e.target.value)}
                      />
                      {saveNoteMutation.isPending && <p className="text-[9px] text-yellow-600 font-bold animate-pulse uppercase tracking-widest">Saving...</p>}
                    </CardContent>
                  </Card>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-black font-lora">Quick Links</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { label: "Humanitix", url: "https://humanitix.com", icon: <Ticket className="h-4 w-4" /> },
                      { label: "Kit (Email)", url: "https://kit.com", icon: <Mail className="h-4 w-4" /> },
                      { label: "Stonnington Hub", url: "https://www.stonnington.vic.gov.au/MyCity/Dashboard", icon: <Building2 className="h-4 w-4" /> }
                    ].map((link, i) => (
                      <Button key={i} variant="ghost" className="justify-between h-12 px-4 rounded-xl border border-border/50 bg-card hover:bg-muted" asChild>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          <div className="flex items-center gap-3 font-bold text-sm">{link.icon} {link.label}</div>
                          <ExternalLink className="h-3 w-3 opacity-30" />
                        </a>
                      </Button>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preparation" className="animate-fade-in-up">
            <div className="max-w-4xl auto">
              <EventPrepChecklist eventId={selectedEventId} />
            </div>
          </TabsContent>
        </Tabs>
      )}

      <EmailMembersModal 
        isOpen={isEmailModalOpen} 
        onClose={() => setIsEmailModalOpen(false)} 
        eventTitle={selectedEvent?.title}
        eventDate={eventDateFormatted}
        eventLink={eventLink}
        eventLocation={selectedEvent?.location || "Armadale Baptist Church"}
      />
    </div>
  );
};

export default AdminMarketingPlanPage;