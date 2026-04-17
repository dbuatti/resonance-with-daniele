"use client";

import React, { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutDashboard, 
  Calendar, 
  MapPin, 
  Users, 
  Megaphone, 
  ListTodo, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  ExternalLink, 
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Sparkles,
  Ticket,
  DollarSign,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { showSuccess } from "@/utils/toast";
import EventPrepChecklist from "@/components/admin/EventPrepChecklist";
import MarketingChecklist from "@/components/admin/MarketingChecklist";
import EventOrderList from "@/components/admin/EventOrderList";
import { cn } from "@/lib/utils";

const AdminEventCommandCenter = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: event, isLoading: loadingEvent } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: orders } = useQuery({
    queryKey: ["eventOrders", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_orders")
        .select("*")
        .eq("event_id", id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const stats = useMemo(() => {
    if (!orders) return { tickets: 0, revenue: 0 };
    return orders.reduce((acc, order) => ({
      tickets: acc.tickets + (order.valid_tickets || 0),
      revenue: acc.revenue + Number(order.your_earnings || 0)
    }), { tickets: 0, revenue: 0 });
  }, [orders]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showSuccess(`${field} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loadingEvent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-bold font-lora animate-pulse">Loading Command Center...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black font-lora mb-4">Event not found</h2>
        <Button onClick={() => navigate("/events")}>Back to Events</Button>
      </div>
    );
  }

  const eventDate = parseISO(event.date);
  const eventDateFormatted = format(eventDate, "EEEE, MMMM do");
  const eventTime = `${event.start_time || "10:00am"} - ${event.end_time || "1:00pm"}`;
  const eventLocation = event.location || "Armadale Baptist Church";
  const mainSong = event.main_song || "a beautiful new arrangement";
  const bookingLink = event.humanitix_link || "https://events.humanitix.com/resonance-choir";

  const copyTemplates = [
    {
      platform: "Instagram",
      icon: <Instagram className="h-4 w-4" />,
      templates: [
        {
          label: "The 'Vibe' Post",
          value: `Resonance is back! 🌿\n\nJoin us on ${eventDateFormatted} for a morning of harmony and connection in Armadale. We'll be diving into "${mainSong}" — I've just finished the arrangement and it's sounding beautiful.\n\nNo auditions, no experience needed. Just bring your voice and join the circle.\n\n📍 ${eventLocation}\n⏰ ${eventTime}\n\nLink in bio to grab your spot! 🎶`,
        },
        {
          label: "Short & Punchy",
          value: `Next session: ${eventDateFormatted} 🗓️\nSong: ${mainSong} 🎶\nLocation: ${eventLocation} 📍\n\nCome and find your resonance. Link in bio! ✨`,
        }
      ]
    },
    {
      platform: "Facebook",
      icon: <Facebook className="h-4 w-4" />,
      templates: [
        {
          label: "Community Group Post",
          value: `Hi neighbors! 👋 I'm running our next Resonance pop-up choir session on ${eventDateFormatted} at ${eventLocation}.\n\nWe're a welcoming, no-audition group that just loves to sing great songs in harmony. This month we're tackling "${mainSong}".\n\nIt's a low-pressure, high-joy morning. Would love to see some new faces in the circle!\n\nDetails and booking here: ${bookingLink}`,
        }
      ]
    },
    {
      platform: "Email / Newsletter",
      icon: <Mail className="h-4 w-4" />,
      templates: [
        {
          label: "Full Announcement",
          value: `Subject: Ready to sing ${mainSong}? 🎶\n\nHi everyone,\n\nI’d love to see you back in the circle for our next session on ${eventDateFormatted}.\n\nWe’ll be learning "${mainSong}" — a song that I think perfectly captures the energy of this group. As always, we'll meet at ${eventLocation} from ${eventTime}.\n\nNo need to prepare anything, just bring yourself. You can grab your spot here: ${bookingLink}\n\nHope to see you there!\n\n— Daniele`,
        }
      ]
    },
    {
      platform: "SMS / WhatsApp",
      icon: <MessageSquare className="h-4 w-4" />,
      templates: [
        {
          label: "Direct Invite",
          value: `Hi! Hope you're well. Just a heads up that the next Resonance session is on ${eventDateFormatted}. We're singing ${mainSong}. Would love to see you there! Book here: ${bookingLink}`,
        }
      ]
    }
  ];

  const postIdeas = [
    {
      title: "The 'Behind the Scenes' Reel",
      description: "Record a 15-second clip of you playing the piano part or humming a harmony line. Caption: 'Arranging the harmonies for our next session...'",
      icon: <Sparkles className="h-5 w-5 text-accent" />
    },
    {
      title: "The 'Founding Member' Shoutout",
      description: "Share a photo of the group from a previous session. Caption: 'This is what community sounds like. Join us for the next one.'",
      icon: <Users className="h-5 w-5 text-primary" />
    },
    {
      title: "The 'Last Call' Story",
      description: "A simple text-based story 24 hours before. 'Last 5 spots for tomorrow! Who's coming?' with a link sticker.",
      icon: <Zap className="h-5 w-5 text-yellow-500" />
    }
  ];

  return (
    <div className="pb-20 space-y-8">
      {/* Header */}
      <header className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="rounded-xl font-bold">
            <Link to="/events">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Registry
            </Link>
          </Button>
          <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck className="h-3 w-3" />
            <span>Command Center</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-7xl font-black font-lora tracking-tighter leading-none">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-muted-foreground font-medium">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>{format(eventDate, "EEEE, MMMM do, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>{event.location || "Armadale"}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {event.humanitix_link && (
              <Button asChild variant="outline" className="rounded-xl font-bold h-12 px-6 border-primary/20 hover:bg-primary/5">
                <a href={event.humanitix_link} target="_blank" rel="noopener noreferrer">
                  Humanitix <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            )}
            {event.ai_chat_link && (
              <Button asChild className="rounded-xl font-black h-12 px-6 shadow-lg">
                <a href={event.ai_chat_link} target="_blank" rel="noopener noreferrer">
                  AI Planning <Sparkles className="h-4 w-4 ml-2" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="bg-muted/50 p-1 rounded-2xl h-14 w-full md:w-auto flex overflow-x-auto no-scrollbar">
          <TabsTrigger value="overview" className="rounded-xl font-bold px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <LayoutDashboard className="h-4 w-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="prep" className="rounded-xl font-bold px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <ListTodo className="h-4 w-4 mr-2" /> Preparation
          </TabsTrigger>
          <TabsTrigger value="marketing" className="rounded-xl font-bold px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Megaphone className="h-4 w-4 mr-2" /> Marketing
          </TabsTrigger>
          <TabsTrigger value="attendees" className="rounded-xl font-bold px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Users className="h-4 w-4 mr-2" /> Attendees
          </TabsTrigger>
          <TabsTrigger value="links" className="rounded-xl font-bold px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <LinkIcon className="h-4 w-4 mr-2" /> Links & Copy
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl border-none shadow-sm bg-primary/5">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-primary">Tickets Sold</CardDescription>
                <CardTitle className="text-4xl font-black font-lora flex items-center gap-3">
                  <Ticket className="h-8 w-8 text-primary" /> {stats.tickets}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-medium text-muted-foreground">Target: 125 tickets</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-green-500/5">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-green-600">Total Revenue</CardDescription>
                <CardTitle className="text-4xl font-black font-lora flex items-center gap-3 text-green-600">
                  <DollarSign className="h-8 w-8" /> ${stats.revenue.toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-medium text-muted-foreground">Earnings after fees</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-muted/30">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Main Song</CardDescription>
                <CardTitle className="text-2xl font-black font-lora truncate">
                  {event.main_song || "Not set"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-medium text-muted-foreground">Primary repertoire focus</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-black font-lora flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" /> Event Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {event.description || "No description provided."}
                </p>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <h3 className="text-lg font-black font-lora">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-24 rounded-2xl flex flex-col gap-2 font-bold border-border/50 hover:border-primary/30 hover:bg-primary/5" onClick={() => handleCopy(event.humanitix_link || "", "Humanitix Link")}>
                  <LinkIcon className="h-6 w-6 text-primary" />
                  Copy Link
                </Button>
                <Button variant="outline" className="h-24 rounded-2xl flex flex-col gap-2 font-bold border-border/50 hover:border-primary/30 hover:bg-primary/5" onClick={() => handleCopy(`${event.title}\n${format(eventDate, "EEEE, MMMM do")}\n${event.location || "Armadale"}`, "Event Info")}>
                  <Copy className="h-6 w-6 text-primary" />
                  Copy Info
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Preparation Tab */}
        <TabsContent value="prep" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <EventPrepChecklist eventId={id!} />
        </TabsContent>

        {/* Marketing Tab */}
        <TabsContent value="marketing" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <MarketingChecklist eventId={id!} eventDate={event.date} />
        </TabsContent>

        {/* Attendees Tab */}
        <TabsContent value="attendees" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <EventOrderList eventId={id!} />
        </TabsContent>

        {/* Links & Copy Tab */}
        <TabsContent value="links" className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Basic Info Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Info className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-black font-lora">Basic Event Info</h2>
            </div>
            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {[
                    { label: "Event Title", value: event.title },
                    { label: "Date & Time", value: `${eventDateFormatted}, ${eventTime}` },
                    { label: "Location", value: eventLocation },
                    { label: "Humanitix Link", value: bookingLink },
                    { label: "Main Song", value: event.main_song || "" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors group">
                      <div className="space-y-1 flex-1 mr-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
                        <p className="text-sm font-bold line-clamp-1">{item.value || "Not set"}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "rounded-xl font-bold h-9 px-3 transition-all",
                          copiedField === item.label ? "bg-green-500 text-white hover:bg-green-600" : "bg-primary/5 text-primary hover:bg-primary/10"
                        )}
                        onClick={() => handleCopy(item.value, item.label)}
                        disabled={!item.value}
                      >
                        {copiedField === item.label ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Platform Templates Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Megaphone className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-black font-lora">Social Media Templates</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {copyTemplates.map((group) => (
                <Card key={group.platform} className="rounded-2xl border-border/50 shadow-sm overflow-hidden flex flex-col">
                  <CardHeader className="bg-muted/30 py-4 flex flex-row items-center gap-3">
                    <div className="p-2 bg-background rounded-lg shadow-sm text-primary">
                      {group.icon}
                    </div>
                    <CardTitle className="text-lg font-black font-lora">{group.platform}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4 flex-grow">
                    {group.templates.map((template, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{template.label}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] font-black hover:bg-primary/5 text-primary"
                            onClick={() => handleCopy(template.value, `${group.platform} ${template.label}`)}
                          >
                            {copiedField === `${group.platform} ${template.label}` ? "COPIED" : "COPY TEXT"}
                          </Button>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-xl text-xs font-medium leading-relaxed whitespace-pre-wrap italic text-muted-foreground border border-border/50">
                          {template.value}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Post Ideas Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-black font-lora">Strategic Post Ideas</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {postIdeas.map((idea, i) => (
                <Card key={i} className="rounded-2xl border-none shadow-sm bg-primary/5 p-6 space-y-4">
                  <div className="bg-background p-3 rounded-xl w-fit shadow-sm">
                    {idea.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-black text-lg font-lora leading-tight">{idea.title}</h3>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                      {idea.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminEventCommandCenter;