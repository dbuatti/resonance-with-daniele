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
  Calendar
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
import { format, subDays, startOfDay, addHours } from "date-fns";

const AdminMarketingPlanPage: React.FC = () => {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState("");

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

  // 2. Dynamic Countdown Logic
  useEffect(() => {
    if (!selectedEvent?.date) return;

    const targetDate = new Date(`${selectedEvent.date}T10:00:00`).getTime();
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      
      if (distance < 0) {
        setTimeLeft("Event Started!");
        clearInterval(timer);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedEvent]);

  // 3. Brain Dump Persistence
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

  const [localBrainDump, setLocalBrainDump] = useState("");
  const debouncedBrainDump = useDebounce(localBrainDump, 1000);

  useEffect(() => {
    if (noteData !== undefined) setLocalBrainDump(noteData);
  }, [noteData]);

  const saveNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedEventId) return;
      const { error } = await supabase
        .from("admin_notes")
        .upsert({ 
          admin_id: user?.id, 
          note_key: `brain_dump_${selectedEventId}`, 
          event_id: selectedEventId,
          content 
        }, { onConflict: 'note_key' });
      if (error) throw error;
    }
  });

  useEffect(() => {
    if (debouncedBrainDump !== noteData && selectedEventId) {
      saveNoteMutation.mutate(debouncedBrainDump);
    }
  }, [debouncedBrainDump, selectedEventId]);

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
  
  // Promo expires the day before the event at 1:00 PM
  const promoExpiryDate = subDays(eventDate, 1);
  const promoExpiryFormatted = format(promoExpiryDate, "EEEE 'at' 1:00 PM");

  // --- DYNAMIC TEMPLATES ---
  const authenticCaption = `We're back for ${selectedEvent?.title || "our next session"}. 
  
📍 ${eventLocation}
⏰ ${eventDateFormatted}, 10am

If you've been meaning to come, this is the one. Use SING20 for 20% off until ${format(promoExpiryDate, "EEEE")}.

Link in bio. Come sing with us. 🌿`;

  const authenticEmail = `Subject: Let's sing together this ${eventDayName}! 🎶

Hi there,

I’d love to see you back in the circle for ${selectedEvent?.title || "our next session"} this ${eventDateFormatted} (10am–1pm) at ${eventLocation}.

I’m opening up a 20% discount for my past singers to help get the room full of familiar voices.

Use code SING20 at checkout.
(Valid until ${promoExpiryFormatted})

Grab your spot here: ${eventLink}

I'd love to see you there.

— Daniele`;

  const fullCommunityPost = `Any local singers (or shower-singers) in Armadale? 🎶

Hi everyone! I’m Daniele, a local music director. I’m hosting a pop-up choir session at ${eventLocation} on ${eventDateFormatted}.

It’s a low-pressure morning. There are no auditions and no experience is needed. We just get together to learn some great harmonies and meet some new people in the neighborhood.

📍 Where: ${eventLocation}
⏰ When: ${eventDateFormatted}, 10am to 1pm
🎟️ Link: ${eventLink}

Hope to see some local faces there!`;

  const handleOpenMail = () => {
    const subject = encodeURIComponent(`Let's sing together for ${selectedEvent?.title}! 🎶`);
    const body = encodeURIComponent(authenticEmail.split('\n\n').slice(1).join('\n\n'));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (loadingEvents) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-8 py-8 md:py-12 bg-background/50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4">
        <BackButton className="mb-6" to="/admin" />
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground px-3 py-1 rounded-full">🚀 Event Sprint</Badge>
              <Badge variant="outline" className="border-primary text-primary px-3 py-1 rounded-full">🤝 Relational Focus</Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-lora tracking-tight">Event Command Center</h1>
            
            <div className="w-full md:w-80 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select Active Event</label>
              <Select value={selectedEventId || ""} onValueChange={setSelectedEventId}>
                <SelectTrigger className="h-12 rounded-xl shadow-sm bg-card">
                  <SelectValue placeholder="Choose an event..." />
                </SelectTrigger>
                <SelectContent>
                  {events?.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title} ({format(new Date(event.date), "MMM d")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedEvent && (
            <div className="bg-card p-4 rounded-2xl shadow-sm border flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-xl">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Countdown</p>
                <p className="text-xl font-black text-primary">{timeLeft}</p>
              </div>
            </div>
          )}
        </header>

        {!selectedEventId ? (
          <Card className="p-12 text-center border-dashed border-2">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">Please select an event to view its marketing plan.</p>
          </Card>
        ) : (
          <>
            <section className="mb-12">
              <Card className="border-4 border-primary bg-primary/5 shadow-2xl overflow-hidden">
                <CardContent className="p-8 flex flex-col lg:flex-row items-start gap-12">
                  <div className="lg:w-1/3 space-y-6">
                    <div className="bg-primary text-primary-foreground p-6 rounded-2xl shadow-xl inline-block">
                      <Target className="h-12 w-12" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Current Focus</h2>
                      <p className="text-3xl font-black font-lora">Message the 10 people who "need" to be there.</p>
                      <p className="text-muted-foreground">Scoped to: {selectedEvent?.title}</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full">
                    <OutreachTracker eventId={selectedEventId} />
                  </div>
                </CardContent>
              </Card>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 space-y-12">
                <section className="space-y-6">
                  <h2 className="text-2xl font-black font-lora flex items-center gap-2">
                    <UserPlus className="h-6 w-6 text-primary" /> 1. Human Connections
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-none shadow-lg bg-card border-l-4 border-primary">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black uppercase tracking-widest">The 10 People Rule</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-xs text-muted-foreground">Identify 10 specific people for this event. Message them personally.</p>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Status: Tracked in Focus Mode ↑</p>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-lg bg-card border-l-4 border-accent">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black uppercase tracking-widest">Community Nodes</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {["Neha & Brad", "The Sangha", "Regular Members"].map((node) => (
                          <div key={node} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-accent" />
                              <span className="text-xs font-bold">{node}</span>
                            </div>
                            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <section className="space-y-6">
                  <h2 className="text-2xl font-black font-lora flex items-center gap-2">
                    <Mic2 className="h-6 w-6 text-primary" /> 2. Copy & Paste
                  </h2>
                  
                  <div className="space-y-4">
                    <Card className="border-none shadow-lg bg-card overflow-hidden">
                      <div className="bg-muted/50 px-6 py-3 flex justify-between items-center border-b">
                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <Users className="h-3 w-3" /> Community Post (FB Groups)
                        </span>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black" onClick={() => copyToClipboard(fullCommunityPost, "Community Post")}>
                          <Copy className="h-3 w-3 mr-1" /> COPY
                        </Button>
                      </div>
                      <CardContent className="p-6 space-y-4">
                        <p className="text-sm italic text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {fullCommunityPost}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-card overflow-hidden">
                      <div className="bg-muted/50 px-6 py-3 flex justify-between items-center border-b">
                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <Instagram className="h-3 w-3" /> Instagram Caption
                        </span>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black" onClick={() => copyToClipboard(authenticCaption, "Instagram Caption")}>
                          <Copy className="h-3 w-3 mr-1" /> COPY
                        </Button>
                      </div>
                      <CardContent className="p-6">
                        <p className="text-sm italic text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {authenticCaption}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-card overflow-hidden">
                      <div className="bg-muted/50 px-6 py-3 flex justify-between items-center border-b">
                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <Mail className="h-3 w-3" /> Email Template
                        </span>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black" onClick={() => copyToClipboard(authenticEmail, "Email Template")}>
                            <Copy className="h-3 w-3 mr-1" /> COPY
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black text-primary" onClick={handleOpenMail}>
                            <ExternalLink className="h-3 w-3 mr-1" /> OPEN MAIL
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <p className="text-sm italic text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {authenticEmail}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </section>
              </div>

              <div className="lg:col-span-5">
                <div className="sticky top-24 space-y-8">
                  <Card className="border-none shadow-xl bg-yellow-50 dark:bg-yellow-950/20 border-l-8 border-yellow-400">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                        <Brain className="h-5 w-5" /> Brain Dump
                      </CardTitle>
                      <CardDescription className="text-yellow-600/70 dark:text-yellow-400/60">
                        Ideas for {selectedEvent?.title}. Auto-saves.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea 
                        placeholder="Random ideas for this specific event..." 
                        className="min-h-[150px] bg-background/50 border-yellow-200 focus-visible:ring-yellow-400"
                        value={localBrainDump}
                        onChange={(e) => setLocalBrainDump(e.target.value)}
                      />
                      {saveNoteMutation.isPending && <p className="text-[10px] text-yellow-600 mt-2 animate-pulse">Saving...</p>}
                    </CardContent>
                  </Card>

                  <MarketingChecklist eventId={selectedEventId} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminMarketingPlanPage;