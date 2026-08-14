"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/use-debounce";
import AdminWorkbenchShell from "@/components/admin/AdminWorkbenchShell";
import EventCreatePanel from "@/components/admin/EventCreatePanel";
import EventFeedbackPanel from "@/components/admin/EventFeedbackPanel";
import EventPrepChecklist from "@/components/admin/EventPrepChecklist";
import MarketingChecklist from "@/components/admin/MarketingChecklist";
import OutreachTracker from "@/components/admin/OutreachTracker";
import FacebookGroupTracker from "@/components/admin/FacebookGroupTracker";
import EventOrderList from "@/components/admin/EventOrderList";
import ExpenseLogger from "@/components/admin/ExpenseLogger";
import TicketSalesLogger from "@/components/admin/TicketSalesLogger";
import FlashSaleManager from "@/components/admin/FlashSaleManager";
import MarketingOverview from "@/components/admin/MarketingOverview";
import MarketingInsights from "@/components/admin/MarketingInsights";
import TaskRolodex from "@/components/admin/TaskRolodex";
import EmailMembersModal from "@/components/admin/EmailMembersModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, LayoutDashboard, ListTodo, Megaphone, Users, DollarSign, MessageSquareQuote, Brain, Ticket, TrendingUp, Clock, ExternalLink, Send } from "lucide-react";
import { format, differenceInDays, startOfDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const AdminEventWorkbench: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const isCreateMode = searchParams.get("new") === "1";
  const activeTab = searchParams.get("tab") || "overview";

  const [searchTerm, setSearchTerm] = useState("");
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [localBrainDump, setLocalBrainDump] = useState("");

  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ["allEventsForWorkbench"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, date")
        .order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const selectedEvent = useMemo(() => events?.find((e) => e.id === id) || null, [events, id]);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (!searchTerm.trim()) return events;
    const q = searchTerm.toLowerCase();
    return events.filter((e) => e.title.toLowerCase().includes(q));
  }, [events, searchTerm]);

  const { data: stats } = useQuery({
    queryKey: ["eventWorkbenchStats", id],
    queryFn: async () => {
      if (!id) return null;
      const { data: orders } = await supabase
        .from("event_orders")
        .select("valid_tickets, your_earnings")
        .eq("event_id", id);
      const { data: expenses } = await supabase
        .from("event_expenses")
        .select("amount")
        .eq("event_id", id);
      const totalTickets = orders?.reduce((s, o) => s + (o.valid_tickets || 0), 0) || 0;
      const totalEarnings = orders?.reduce((s, o) => s + Number(o.your_earnings || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((s, e) => s + Number(e.amount), 0) || 0;
      return { totalTickets, totalEarnings, totalExpenses };
    },
    enabled: !!id,
  });

  const { data: brainDumpData } = useQuery({
    queryKey: ["adminBrainDump", id],
    queryFn: async () => {
      if (!id) return "";
      const { data } = await supabase
        .from("admin_notes")
        .select("content")
        .eq("note_key", `brain_dump_${id}`)
        .maybeSingle();
      return data?.content || "";
    },
    enabled: !!id,
  });

  const debouncedBrainDump = useDebounce(localBrainDump, 1000);
  useEffect(() => { if (brainDumpData !== undefined) setLocalBrainDump(brainDumpData); }, [brainDumpData]);

  const saveNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!id) return;
      await supabase.from("admin_notes").upsert({
        note_key: `brain_dump_${id}`,
        event_id: id,
        content,
      }, { onConflict: "note_key" });
    },
  });
  useEffect(() => {
    if (debouncedBrainDump !== brainDumpData && id) saveNoteMutation.mutate(debouncedBrainDump);
  }, [debouncedBrainDump, brainDumpData, id, saveNoteMutation]);

  useEffect(() => {
    if (!selectedEvent?.date) return;
    const target = new Date(`${selectedEvent.date}T10:00:00`).getTime();
    const timer = setInterval(() => {
      const distance = target - Date.now();
      if (distance < 0) { setTimeLeft("Live"); return; }
      const d = Math.floor(distance / 86400000);
      const h = Math.floor((distance % 86400000) / 3600000);
      setTimeLeft(`${d}d ${h}h`);
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedEvent]);

  const daysUntil = useMemo(() => {
    if (!selectedEvent?.date) return null;
    return differenceInDays(startOfDay(parseISO(selectedEvent.date)), startOfDay(new Date()));
  }, [selectedEvent]);

  const setTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    if (tab === "overview") next.delete("tab"); else next.set("tab", tab);
    setSearchParams(next, { replace: true });
  };

  const selectEvent = (eventId: string) => {
    navigate(`/admin/events/${eventId}`);
  };

  const startCreate = () => {
    setSearchParams({ new: "1" }, { replace: true });
  };

  const handleCreated = (newId: string) => {
    queryClient.invalidateQueries({ queryKey: ["allEventsForWorkbench"] });
    navigate(`/admin/events/${newId}`);
  };

  const handleCancelCreate = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("new");
    setSearchParams(next, { replace: true });
  };

  if (loadingEvents) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const eventList = (
    <div className="space-y-4">
      <Button onClick={startCreate} className="w-full h-11 font-black rounded-xl shadow-lg">
        <Plus className="mr-2 h-4 w-4" /> New Event
      </Button>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search events..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-10 rounded-xl font-bold bg-muted/30 border-none focus-visible:ring-primary" />
      </div>
      <div className="space-y-1.5">
        {filteredEvents.map((e) => {
          const active = e.id === id;
          return (
            <button key={e.id} onClick={() => selectEvent(e.id)} className={cn(
              "w-full text-left px-4 py-3 rounded-xl border transition-all",
              active ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-card border-border/50 hover:border-primary/30 hover:bg-muted/30"
            )}>
              <p className={cn("font-black font-lora text-sm leading-tight truncate", active ? "text-primary-foreground" : "text-foreground")}>{e.title}</p>
              <p className={cn("text-[10px] font-black uppercase tracking-widest mt-1", active ? "text-primary-foreground/70" : "text-muted-foreground")}>
                {format(parseISO(e.date), "MMM d, yyyy")}
              </p>
            </button>
          );
        })}
        {filteredEvents.length === 0 && (
          <p className="text-xs font-medium text-muted-foreground italic px-2 py-4">No events found.</p>
        )}
      </div>
    </div>
  );

  // --- CREATE MODE ---
  if (isCreateMode) {
    return (
      <AdminWorkbenchShell
        title="New Event"
        description="Quickly set up your next session."
        badge="Create"
        actions={<Button variant="ghost" onClick={handleCancelCreate} className="font-bold">Cancel</Button>}
      >
        <div className="max-w-2xl">
          <EventCreatePanel onCreated={handleCreated} onCancel={handleCancelCreate} />
        </div>
      </AdminWorkbenchShell>
    );
  }

  // --- GLOBAL (no event selected) ---
  if (!selectedEvent) {
    return (
      <AdminWorkbenchShell
        title="Events"
        description="Aggregated financial health, the task rolodex, and community trends across all sessions."
        badge="All Events"
        toolbar={
          <Button onClick={startCreate} className="font-black rounded-xl shadow-md h-12">
            <Plus className="mr-2 h-4 w-4" /> New Event
          </Button>
        }
        left={eventList}
      >
        <div className="space-y-10">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <SparklesBadge /> <h2 className="text-lg font-black font-lora">Task Rolodex</h2>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Your ever-evolving timeline across all upcoming concerts.</p>
            <TaskRolodex />
          </section>
          <section className="space-y-4">
            <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> <h2 className="text-lg font-black font-lora">Financial Momentum</h2></div>
            <MarketingOverview eventId="all" />
          </section>
          <section className="space-y-4">
            <div className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" /> <h2 className="text-lg font-black font-lora">Insights</h2></div>
            <MarketingInsights eventId="all" />
          </section>
        </div>
      </AdminWorkbenchShell>
    );
  }

  // --- EVENT SELECTED ---
  const eventDateFormatted = format(parseISO(selectedEvent.date), "EEEE, MMMM do");
  const eventLink = "https://events.humanitix.com/resonance-choir";
  const postText = `Resonance is a monthly pop-up choir in ${selectedEvent.title.includes("Armadale") ? "Armadale" : "Melbourne"} where everyone is welcome. No auditions, no experience needed.\n\nWe're back on ${eventDateFormatted} for our next session!\n\nGrab your spot here: ${eventLink}`;

  const quickLinks = [
    { label: "Humanitix", url: "https://humanitix.com" },
    { label: "Kit (Email)", url: "https://kit.com" },
  ];

  return (
    <AdminWorkbenchShell
      title={selectedEvent.title}
      description={`${eventDateFormatted}${daysUntil !== null ? ` • ${daysUntil === 0 ? "Today" : `${daysUntil} days away`}` : ""}`}
      badge="Event Workbench"
      actions={
        <>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black h-9 px-3 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> {timeLeft || "—"}
          </Badge>
          <Button asChild variant="ghost" className="font-bold" onClick={() => setIsEmailModalOpen(true)}>
            <span><Send className="h-4 w-4 mr-2" /> Broadcast</span>
          </Button>
        </>
      }
      left={eventList}
    >
      <Tabs value={activeTab} onValueChange={setTab} className="space-y-8">
        <TabsList className="bg-muted/50 p-1 rounded-2xl h-14 w-full flex overflow-x-auto no-scrollbar">
          <TabsTrigger value="overview" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"><LayoutDashboard className="h-4 w-4 mr-2 shrink-0" /> Overview</TabsTrigger>
          <TabsTrigger value="preparation" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"><ListTodo className="h-4 w-4 mr-2 shrink-0" /> Preparation</TabsTrigger>
          <TabsTrigger value="marketing" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"><Megaphone className="h-4 w-4 mr-2 shrink-0" /> Marketing</TabsTrigger>
          <TabsTrigger value="attendees" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"><Users className="h-4 w-4 mr-2 shrink-0" /> Attendees</TabsTrigger>
          <TabsTrigger value="finance" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"><DollarSign className="h-4 w-4 mr-2 shrink-0" /> Finance</TabsTrigger>
          <TabsTrigger value="feedback" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"><MessageSquareQuote className="h-4 w-4 mr-2 shrink-0" /> Feedback</TabsTrigger>
          <TabsTrigger value="notes" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"><Brain className="h-4 w-4 mr-2 shrink-0" /> Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-primary/5">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-primary">Tickets Sold</CardDescription>
                <CardTitle className="text-4xl font-black font-lora flex items-center gap-3"><Ticket className="h-8 w-8 text-primary" /> {stats?.totalTickets || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-green-500/5">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-green-600">Total Revenue</CardDescription>
                <CardTitle className="text-4xl font-black font-lora flex items-center gap-3 text-green-600"><DollarSign className="h-8 w-8" /> ${(stats?.totalEarnings || 0).toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-muted/30">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Net Profit</CardDescription>
                <CardTitle className="text-3xl font-black font-lora text-primary">${((stats?.totalEarnings || 0) - (stats?.totalExpenses || 0)).toFixed(0)}</CardTitle>
              </CardHeader>
            </Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[2.5rem] border-border/50 shadow-sm">
              <CardHeader><CardTitle className="text-lg font-black font-lora">Quick Links</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {quickLinks.map((l) => (
                  <Button key={l.label} variant="ghost" className="justify-between h-12 px-4 rounded-xl border border-border/50 bg-card hover:bg-muted w-full" asChild>
                    <a href={l.url} target="_blank" rel="noopener noreferrer">
                      <span className="font-bold text-sm">{l.label}</span><ExternalLink className="h-3 w-3 opacity-30" />
                    </a>
                  </Button>
                ))}
              </CardContent>
            </Card>
            <Card className="rounded-[2.5rem] border-border/50 shadow-sm">
              <CardHeader><CardTitle className="text-lg font-black font-lora">Reference Link</CardTitle></CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full h-12 rounded-xl font-bold border-primary/20 hover:bg-primary/5" disabled={!selectedEvent}>
                  <a href={eventLink} target="_blank" rel="noopener noreferrer">Humanitix <ExternalLink className="h-4 w-4 ml-2" /></a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preparation"><EventPrepChecklist eventId={selectedEvent.id} /></TabsContent>

        <TabsContent value="marketing" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
              <section className="space-y-4">
                <h3 className="text-base font-black font-lora">Execution Checklist</h3>
                <MarketingChecklist eventId={selectedEvent.id} eventDate={selectedEvent.date} onActionClick={(taskId) => { if (["email-regulars", "flash-sale-newsletter", "thank-you-email"].includes(taskId)) setIsEmailModalOpen(true); }} />
              </section>
              <section className="space-y-4">
                <h3 className="text-base font-black font-lora">Facebook Groups</h3>
                <Card className="rounded-2xl overflow-hidden"><CardContent className="p-6"><FacebookGroupTracker eventId={selectedEvent.id} postText={postText} /></CardContent></Card>
              </section>
            </div>
            <div className="space-y-6">
              <section className="space-y-4">
                <h3 className="text-base font-black font-lora">Relational Outreach</h3>
                <Card className="rounded-2xl overflow-hidden">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-bold">The 10 People Rule</CardTitle><CardDescription>Personal connection is king.</CardDescription></CardHeader>
                  <CardContent><OutreachTracker eventId={selectedEvent.id} /></CardContent>
                </Card>
              </section>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="attendees"><EventOrderList eventId={selectedEvent.id} /></TabsContent>

        <TabsContent value="finance" className="space-y-10">
          <section className="space-y-4"><h3 className="text-base font-black font-lora">Ticket Sales</h3><TicketSalesLogger eventId={selectedEvent.id} /></section>
          <section className="space-y-4"><h3 className="text-base font-black font-lora">Expenses</h3><ExpenseLogger eventId={selectedEvent.id} /></section>
          <section className="space-y-4"><h3 className="text-base font-black font-lora">Promotions</h3><FlashSaleManager eventId={selectedEvent.id} /></section>
        </TabsContent>

        <TabsContent value="feedback"><EventFeedbackPanel eventId={selectedEvent.id} /></TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <h3 className="text-base font-black font-lora">Brain Dump</h3>
          <Card className="rounded-2xl bg-yellow-50/50 dark:bg-yellow-950/10">
            <CardContent className="p-6 space-y-3">
              <Textarea placeholder="Brain dump ideas for this event... saves automatically." className="min-h-[200px] bg-transparent border-yellow-200/50 rounded-xl resize-none" value={localBrainDump} onChange={(e) => setLocalBrainDump(e.target.value)} />
              {saveNoteMutation.isPending && <p className="text-[9px] text-yellow-600 font-bold uppercase tracking-widest animate-pulse">Saving...</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EmailMembersModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        eventTitle={selectedEvent.title}
        eventDate={eventDateFormatted}
        eventLink={eventLink}
      />
    </AdminWorkbenchShell>
  );
};

const SparklesBadge: React.FC = () => (
  <div className="p-2 bg-primary/10 rounded-lg"><TrendingUp className="h-4 w-4 text-primary" /></div>
);

export default AdminEventWorkbench;