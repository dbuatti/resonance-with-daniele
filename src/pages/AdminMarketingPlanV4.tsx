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
  Brain,
  ArrowRight,
  Sparkles,
  Loader2,
  ExternalLink,
  Users,
  Ticket,
  Zap,
  DollarSign,
  Activity,
  Bot,
  CheckCircle2,
  ShieldAlert,
  ListTodo,
  Facebook,
  LayoutDashboard,
  TrendingUp,
  AlertTriangle,
  Rocket,
  Calendar
} from "lucide-react";
import { showSuccess } from "@/utils/toast";
import BackButton from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/badge";
import MarketingChecklist from "@/components/admin/MarketingChecklist";
import { Textarea } from "@/components/ui/textarea";
import OutreachTracker from "@/components/admin/OutreachTracker";
import FacebookGroupTracker from "@/components/admin/FacebookGroupTracker";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, differenceInDays, startOfDay } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import EmailMembersModal from "@/components/admin/EmailMembersModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventPrepChecklist from "@/components/admin/EventPrepChecklist";

const AdminMarketingPlanV4: React.FC = () => {
  const { user } = useSession();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ["allEventsForMarketingPlanV4"],
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

  const { data: stats } = useQuery({
    queryKey: ["eventMarketingStatsV4", selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return null;
      const { data: orders } = await supabase.from("event_orders").select("valid_tickets, your_earnings").eq("event_id", selectedEventId);
      const { data: expenses } = await supabase.from("event_expenses").select("amount").eq("event_id", selectedEventId);
      const totalTickets = orders?.reduce((sum, o) => sum + (o.valid_tickets || 0), 0) || 0;
      const totalEarnings = orders?.reduce((sum, o) => sum + Number(o.your_earnings || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      return { totalTickets, totalEarnings, totalExpenses };
    },
    enabled: !!selectedEventId,
  });

  const daysUntil = useMemo(() => {
    if (!selectedEvent?.date) return null;
    return differenceInDays(startOfDay(new Date(selectedEvent.date)), startOfDay(new Date()));
  }, [selectedEvent]);

  const eventHealth = useMemo(() => {
    if (!stats || daysUntil === null) return { label: "Standby", color: "text-muted-foreground", icon: <Activity /> };
    const progress = (stats.totalTickets / 125) * 100;
    if (progress >= 80) return { label: "Optimal", color: "text-green-500", icon: <CheckCircle2 /> };
    if (daysUntil <= 3 && progress < 40) return { label: "Critical", color: "text-destructive", icon: <ShieldAlert /> };
    return { label: "Active", color: "text-primary", icon: <TrendingUp /> };
  }, [stats, daysUntil]);

  useEffect(() => {
    if (!selectedEvent?.date) return;
    const timer = setInterval(() => {
      const distance = new Date(`${selectedEvent.date}T10:00:00`).getTime() - new Date().getTime();
      if (distance < 0) { setTimeLeft("LIVE"); clearInterval(timer); return; }
      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeLeft(`${d}d ${h}h`);
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedEvent]);

  const [localBrainDump, setLocalBrainDump] = useState("");
  const debouncedBrainDump = useDebounce(localBrainDump, 1000);

  const { data: noteData } = useQuery({
    queryKey: ["adminBrainDumpV4", selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return "";
      const { data } = await supabase.from("admin_notes").select("content").eq("note_key", `brain_dump_${selectedEventId}`).single();
      return data?.content || "";
    },
    enabled: !!selectedEventId,
  });

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
  const eventLink = selectedEvent?.humanitix_link || "https://events.humanitix.com/resonance-choir";
  const fullCommunityPost = `Any local singers in Armadale? 🎶\n\nI’m Daniele, hosting a pop-up choir at ${selectedEvent?.location || "Armadale Baptist Church"} on ${eventDateFormatted}.\n\nNo auditions, no experience needed. Just harmonies and community.\n\n🎟️ Link: ${eventLink}`;

  if (loadingEvents) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white py-12 px-4 md:px-12">
      <div className="max-w-[1800px] mx-auto space-y-12">
        <div className="flex justify-between items-center">
          <BackButton to="/admin" className="text-white/60 hover:text-white" />
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">System Status</p>
              <p className="text-xs font-bold text-green-500 flex items-center justify-end gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> ALL SYSTEMS NOMINAL
              </p>
            </div>
          </div>
        </div>

        {/* --- V4 HERO SECTION --- */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-gradient-to-br from-[#1a1a1f] to-[#111114] rounded-[3rem] p-12 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]" />
            
            <div className="space-y-10 relative z-10">
              <div className="flex items-center gap-4">
                <Badge className="bg-primary text-white px-4 py-1 rounded-full font-black uppercase tracking-widest text-[10px]">V4 Command</Badge>
                <span className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2", eventHealth.color)}>
                  {eventHealth.icon} {eventHealth.label}
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="text-6xl md:text-8xl font-black font-lora tracking-tighter leading-none">
                  Marketing <span className="text-primary">Engine</span>
                </h1>
                <div className="max-w-md">
                  <Select value={selectedEventId || ""} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="h-20 rounded-2xl bg-white/5 border-white/10 text-2xl font-black px-8 hover:bg-white/10 transition-all">
                      <SelectValue placeholder="Select Mission..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1f] border-white/10 text-white rounded-2xl">
                      {events?.map((e) => (
                        <SelectItem key={e.id} value={e.id} className="py-4 font-bold focus:bg-primary focus:text-white">
                          {e.title} ({format(new Date(e.date), "MMM d")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-6">
            <Card className="bg-[#1a1a1f] border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between hover:border-primary/30 transition-all group">
              <Clock className="h-8 w-8 text-primary group-hover:rotate-12 transition-transform" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">T-Minus</p>
                <p className="text-4xl font-black tracking-tighter">{timeLeft}</p>
              </div>
            </Card>
            <Card className="bg-[#1a1a1f] border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between hover:border-green-500/30 transition-all group">
              <Ticket className="h-8 w-8 text-green-500 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Tickets</p>
                <p className="text-4xl font-black tracking-tighter text-green-500">{stats?.totalTickets || 0}</p>
              </div>
            </Card>
            <Card className="bg-primary rounded-[2.5rem] p-8 flex flex-col justify-between col-span-2 shadow-2xl shadow-primary/20">
              <div className="flex justify-between items-start">
                <DollarSign className="h-8 w-8 text-white/80" />
                <TrendingUp className="h-5 w-5 text-white/40" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Net Revenue</p>
                <p className="text-5xl font-black tracking-tighter">${(stats?.totalEarnings || 0) - (stats?.totalExpenses || 0)}</p>
              </div>
            </Card>
          </div>
        </section>

        {/* --- MAIN WORKSPACE --- */}
        <Tabs defaultValue="outreach" className="space-y-12">
          <div className="flex justify-center">
            <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl h-16">
              <TabsTrigger value="outreach" className="rounded-xl px-8 font-black text-sm uppercase tracking-widest data-[state=active]:bg-primary">Outreach</TabsTrigger>
              <TabsTrigger value="assets" className="rounded-xl px-8 font-black text-sm uppercase tracking-widest data-[state=active]:bg-primary">Strategy Deck</TabsTrigger>
              <TabsTrigger value="checklist" className="rounded-xl px-8 font-black text-sm uppercase tracking-widest data-[state=active]:bg-primary">Checklist</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="outreach" className="animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4 space-y-8">
                <div className="flex items-center gap-4 px-4">
                  <Target className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-black font-lora">The 10 People Rule</h2>
                </div>
                <Card className="bg-[#1a1a1f] border-white/5 rounded-[3rem] p-10 shadow-2xl">
                  <OutreachTracker eventId={selectedEventId!} />
                </Card>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <div className="flex items-center gap-4 px-4">
                  <Facebook className="h-6 w-6 text-blue-500" />
                  <h2 className="text-2xl font-black font-lora">Community Groups</h2>
                </div>
                <Card className="bg-[#1a1a1f] border-white/5 rounded-[3rem] p-10 shadow-2xl">
                  <FacebookGroupTracker eventId={selectedEventId!} postText={fullCommunityPost} />
                </Card>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <div className="flex items-center gap-4 px-4">
                  <Brain className="h-6 w-6 text-yellow-500" />
                  <h2 className="text-2xl font-black font-lora">Brain Dump</h2>
                </div>
                <Card className="bg-[#1a1a1f] border-white/5 rounded-[3rem] p-10 shadow-2xl min-h-[400px] flex flex-col">
                  <Textarea 
                    placeholder="Capture ideas, notes, and reminders..." 
                    className="flex-1 bg-white/5 border-white/10 rounded-2xl p-6 text-lg font-medium resize-none focus-visible:ring-primary"
                    value={localBrainDump}
                    onChange={(e) => setLocalBrainDump(e.target.value)}
                  />
                  {saveNoteMutation.isPending && <p className="text-[10px] text-primary mt-4 font-black uppercase tracking-widest animate-pulse">Syncing to cloud...</p>}
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assets" className="animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <section className="space-y-8">
                <div className="flex items-center gap-4 px-4">
                  <Bot className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-black font-lora">AI Prompt Generator</h2>
                </div>
                <Card className="bg-gradient-to-br from-primary/10 to-transparent border-white/5 rounded-[3rem] p-10">
                  <p className="text-sm text-white/60 mb-6 leading-relaxed italic">"I am Daniele Buatti... generate 3 variations of a warm, expressive Instagram caption for {selectedEvent?.title}..."</p>
                  <Button className="w-full h-16 rounded-2xl font-black text-lg shadow-2xl" onClick={() => copyToClipboard("Full AI Prompt Text Here", "AI Prompt")}>
                    <Copy className="mr-2 h-5 w-5" /> Copy Master Prompt
                  </Button>
                </Card>
              </section>

              <section className="space-y-8">
                <div className="flex items-center gap-4 px-4">
                  <Sparkles className="h-6 w-6 text-accent" />
                  <h2 className="text-2xl font-black font-lora">Copy Templates</h2>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Instagram Caption", icon: <Instagram />, text: "We're back for..." },
                    { label: "Email Blast", icon: <Mail />, text: "Subject: Let's sing..." },
                    { label: "Community Post", icon: <Users />, text: "Any local singers..." }
                  ].map((asset, i) => (
                    <Card key={i} className="bg-[#1a1a1f] border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-white/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-xl text-white/60 group-hover:text-primary transition-colors">{asset.icon}</div>
                        <span className="font-bold">{asset.label}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="font-black text-[10px] uppercase tracking-widest" onClick={() => copyToClipboard(asset.text, asset.label)}>Copy</Button>
                    </Card>
                  ))}
                </div>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="checklist" className="animate-fade-in-up">
            <div className="max-w-5xl mx-auto">
              <MarketingChecklist eventId={selectedEventId!} onActionClick={(id) => id === "email-regulars" && setIsEmailModalOpen(true)} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <EmailMembersModal 
        isOpen={isEmailModalOpen} 
        onClose={() => setIsEmailModalOpen(false)} 
        eventTitle={selectedEvent?.title}
        eventDate={selectedEvent ? format(new Date(selectedEvent.date), "EEEE, MMM do") : ""}
        eventLink={eventLink}
      />
    </div>
  );
};

export default AdminMarketingPlanV4;