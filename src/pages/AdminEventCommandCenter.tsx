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
        <TabsContent value="links" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-xl font-black font-lora">Copy to Clipboard</CardTitle>
              <CardDescription className="font-medium">Quickly grab event details for emails, social media, or messages.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {[
                  { label: "Event Title", value: event.title },
                  { label: "Date & Time", value: format(eventDate, "EEEE, MMMM do, yyyy") },
                  { label: "Location", value: event.location || "Armadale" },
                  { label: "Humanitix Link", value: event.humanitix_link || "" },
                  { label: "Main Song", value: event.main_song || "" },
                  { label: "Full Description", value: event.description || "" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-6 hover:bg-muted/10 transition-colors group">
                    <div className="space-y-1 flex-1 mr-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-bold line-clamp-2">{item.value || "Not set"}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={cn(
                        "rounded-xl font-bold h-10 px-4 transition-all",
                        copiedField === item.label ? "bg-green-500 text-white hover:bg-green-600" : "bg-primary/5 text-primary hover:bg-primary/10"
                      )}
                      onClick={() => handleCopy(item.value, item.label)}
                      disabled={!item.value}
                    >
                      {copiedField === item.label ? (
                        <><Check className="h-4 w-4 mr-2" /> Copied</>
                      ) : (
                        <><Copy className="h-4 w-4 mr-2" /> Copy</>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminEventCommandCenter;