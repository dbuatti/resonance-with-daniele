"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Star, TrendingUp, Users, Calendar, Download, Quote, Heart, Copy, History, Globe, Clock, DollarSign, UserCheck, Music, CalendarCheck, Search, Zap, Sparkles, Brain, AlertTriangle, CheckCircle2, PieChart, BarChart3, MapPin, LineChart as LineChartIcon, UserPlus, EyeOff } from "lucide-react";
import { format, parseISO, startOfMonth } from "date-fns";
import BackButton from "@/components/ui/BackButton";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import LegacyFeedbackImporter from "@/components/admin/LegacyFeedbackImporter";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from "recharts";

const AdminEventFeedback: React.FC = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [aiInsights, setAiInsights] = useState<any>(null);

  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ["allEventsForFeedbackAdmin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("id, title, date").order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: feedback, isLoading: loadingFeedback } = useQuery({
    queryKey: ["eventFeedbackData", selectedEventId],
    queryFn: async () => {
      let query = supabase.from("event_feedback").select(`*, profiles (first_name, last_name, email), events (title, date)`).order("created_at", { ascending: false });
      if (selectedEventId !== "all") query = query.eq("event_id", selectedEventId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: savedAiSummary } = useQuery({
    queryKey: ["savedAiSummary", selectedEventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_ai_summaries")
        .select("content")
        .eq("event_id", selectedEventId)
        .maybeSingle();
      if (error) return null;
      return data?.content || null;
    },
    enabled: !!selectedEventId,
  });

  useMemo(() => {
    if (savedAiSummary) setAiInsights(savedAiSummary);
  }, [savedAiSummary]);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('analyze-feedback', {
        body: { eventId: selectedEventId }
      });
      if (error) throw error;
      
      await supabase.from("event_ai_summaries").upsert({
        event_id: selectedEventId,
        summary_type: selectedEventId === "all" ? "global" : "specific",
        content: data,
        updated_at: new Date().toISOString()
      }, { onConflict: 'event_id,summary_type' });

      return data;
    },
    onSuccess: (data) => {
      setAiInsights(data);
      showSuccess("AI Analysis Complete!");
      queryClient.invalidateQueries({ queryKey: ["savedAiSummary", selectedEventId] });
    },
    onError: (err: any) => showError(err.message)
  });

  const stats = useMemo(() => {
    if (!feedback || feedback.length === 0) return null;
    const total = feedback.length;
    const avgScore = feedback.reduce((acc, f) => acc + (f.recommend_score || 0), 0) / total;
    
    const feelings: Record<string, number> = {};
    const timeSlots: Record<string, number> = {};
    const prices: Record<string, number> = {};
    const frequencies: Record<string, number> = {};
    const ongoingTimes: Record<string, number> = {};
    const marketingSources: Record<string, number> = {};
    const repertoire: string[] = [];
    const trendMap: Record<string, { sum: number, count: number }> = {};
    let returningCount = 0;
    let newCount = 0;

    feedback.forEach(f => {
      if (f.overall_feeling) feelings[f.overall_feeling] = (feelings[f.overall_feeling] || 0) + 1;
      if (f.time_slot_rating) timeSlots[f.time_slot_rating] = (timeSlots[f.time_slot_rating] || 0) + 1;
      if (f.price_point) prices[f.price_point] = (prices[f.price_point] || 0) + 1;
      if (f.attendance_frequency) frequencies[f.attendance_frequency] = (frequencies[f.attendance_frequency] || 0) + 1;
      if (f.how_heard) marketingSources[f.how_heard] = (marketingSources[f.how_heard] || 0) + 1;
      if (f.future_ideas) repertoire.push(f.future_ideas);
      
      (f.best_times_ongoing as string[] || []).forEach(time => ongoingTimes[time] = (ongoingTimes[time] || 0) + 1);

      const eventDate = f.events?.date || f.created_at;
      const monthKey = format(startOfMonth(parseISO(eventDate)), "MMM yyyy");
      if (!trendMap[monthKey]) trendMap[monthKey] = { sum: 0, count: 0 };
      trendMap[monthKey].sum += (f.recommend_score || 0);
      trendMap[monthKey].count += 1;

      if (f.is_first_time === false) {
        returningCount++;
      } else {
        newCount++;
      }
    });

    const trendData = Object.entries(trendMap)
      .map(([name, data]) => ({ name, score: parseFloat((data.sum / data.count).toFixed(1)) }))
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

    const getMode = (obj: Record<string, number>) => {
      return Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
    };

    return { 
      total, avgScore, feelings, timeSlots, prices, frequencies, ongoingTimes, marketingSources, repertoire, trendData, returningCount, newCount,
      topPrice: getMode(prices),
      topTimeSlot: getMode(timeSlots),
      topPreferredTime: getMode(ongoingTimes),
      topFrequency: getMode(frequencies)
    };
  }, [feedback]);

  if (loading || loadingEvents) return <div className="p-20 text-center"><Loader2 className="animate-spin h-12 w-12 mx-auto text-primary" /></div>;
  if (!user?.is_admin) { navigate("/"); return null; }

  return (
    <div className="space-y-8 py-8 md:py-12 max-w-7xl mx-auto px-4">
      <BackButton to="/admin" />
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <h1 className="text-5xl font-black font-lora tracking-tighter">{selectedEventId === "all" ? "Global Feedback" : "Event Feedback"}</h1>
          <p className="text-xl text-muted-foreground">{selectedEventId === "all" ? "Aggregated insights from every session." : "Analyze how this specific session landed."}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {selectedEventId !== "all" && <LegacyFeedbackImporter eventId={selectedEventId} />}
          <div className="w-full md:w-72 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select View</label>
            <Select value={selectedEventId} onValueChange={(val) => { setSelectedEventId(val); setAiInsights(null); }}>
              <SelectTrigger className="h-12 rounded-xl shadow-xl bg-card border-2 border-primary/10"><SelectValue placeholder="Choose an event..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-bold text-primary"><div className="flex items-center gap-2"><Globe className="h-4 w-4" /> All Events</div></SelectItem>
                {events?.map((event) => (<SelectItem key={event.id} value={event.id} className="font-bold">{event.title} ({format(new Date(event.date), "MMM d")})</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-primary text-primary-foreground rounded-[2rem] shadow-xl border-none p-8">
          <div className="flex justify-between items-start"><div className="space-y-1"><p className="text-[10px] font-black uppercase tracking-widest opacity-70">Average NPS</p><p className="text-6xl font-black tracking-tighter">{stats?.avgScore.toFixed(1)}</p></div><Star className="h-8 w-8 text-accent fill-current" /></div>
        </Card>
        
        <Card className="rounded-[2rem] shadow-xl border-none p-8 bg-card md:col-span-2">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><LineChartIcon className="h-3 w-3" /> NPS Trend Over Time</p>
          </div>
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" hide />
                <YAxis domain={[0, 10]} hide />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} labelStyle={{ fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={4} dot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-[2rem] shadow-xl border-none p-8 bg-accent text-accent-foreground">
          <div className="flex justify-between items-start"><div className="space-y-1"><p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Responses</p><p className="text-6xl font-black tracking-tighter">{stats?.total}</p></div><Users className="h-8 w-8 opacity-40" /></div>
        </Card>
      </div>

      {/* Logistics & Retention Snapshot */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-1.5 bg-primary rounded-full" />
          <h2 className="text-3xl font-black font-lora tracking-tight">Logistics & Retention</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-lg bg-card p-6 rounded-3xl flex flex-col justify-between">
            <div className="space-y-1"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><DollarSign className="h-3 w-3" /> Ideal Price Point</p><p className="text-2xl font-black text-primary">{stats?.topPrice}</p></div>
            <Badge variant="outline" className="mt-4 w-fit bg-primary/5 border-primary/10 text-[10px] font-bold">Most Frequent Choice</Badge>
          </Card>
          <Card className="border-none shadow-lg bg-card p-6 rounded-3xl flex flex-col justify-between">
            <div className="space-y-1"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Clock className="h-3 w-3" /> Time Slot Fit</p><p className="text-2xl font-black text-primary">{stats?.topTimeSlot}</p></div>
            <Badge variant="outline" className="mt-4 w-fit bg-primary/5 border-primary/10 text-[10px] font-bold">Current 10am-1pm Slot</Badge>
          </Card>
          <Card className="border-none shadow-lg bg-card p-6 rounded-3xl flex flex-col justify-between">
            <div className="space-y-1"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><UserCheck className="h-3 w-3" /> Returning Legends</p><p className="text-2xl font-black text-green-600">{stats?.returningCount}</p></div>
            <Progress value={(stats?.returningCount || 0) / (stats?.total || 1) * 100} className="h-1.5 mt-4" />
          </Card>
          <Card className="border-none shadow-lg bg-card p-6 rounded-3xl flex flex-col justify-between">
            <div className="space-y-1"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><UserPlus className="h-3 w-3" /> New Faces</p><p className="text-2xl font-black text-blue-600">{stats?.newCount}</p></div>
            <Progress value={(stats?.newCount || 0) / (stats?.total || 1) * 100} className="h-1.5 mt-4" />
          </Card>
        </div>
      </section>

      <section className="mb-12">
        <Card className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-[3rem] shadow-2xl border-none overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <CardContent className="p-10 flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="bg-white/20 p-6 rounded-[2rem] shadow-inner"><Brain className="h-12 w-12 text-accent" /></div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] opacity-70">AI Strategy Engine</h3>
              <p className="text-3xl font-black font-lora leading-tight">{selectedEventId === "all" ? "Analyze the entire community's feedback history." : "Generate deep insights from this session's feedback."}</p>
            </div>
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-black rounded-2xl h-16 px-8 shadow-2xl group" onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}>
              {analyzeMutation.isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...</> : <><Sparkles className="mr-2 h-5 w-5" /> {aiInsights ? "Refresh AI Analysis" : "Run AI Analysis"}</>}
            </Button>
          </CardContent>
        </Card>

        {aiInsights && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 animate-fade-in-up">
            <Card className="rounded-[2.5rem] shadow-xl border-none p-8 bg-card">
              <CardTitle className="text-xl font-black font-lora flex items-center gap-2 mb-6"><CheckCircle2 className="h-5 w-5 text-green-500" /> Top Highlights</CardTitle>
              <ul className="space-y-4">{aiInsights.top_highlights.map((h: string, i: number) => (<li key={i} className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-2xl text-sm font-bold">{h}</li>))}</ul>
            </Card>
            <Card className="rounded-[2.5rem] shadow-xl border-none p-8 bg-card">
              <CardTitle className="text-xl font-black font-lora flex items-center gap-2 mb-6"><AlertTriangle className="h-5 w-5 text-destructive" /> Critical Friction</CardTitle>
              <ul className="space-y-4">{aiInsights.critical_friction.map((f: string, i: number) => (<li key={i} className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl text-sm font-bold">{f}</li>))}</ul>
            </Card>
            <Card className="md:col-span-2 rounded-[2.5rem] shadow-xl border-none p-10 bg-accent text-accent-foreground">
              <CardTitle className="text-2xl font-black font-lora flex items-center gap-3 mb-4"><Zap className="h-6 w-6" /> Strategic Advice for Daniele</CardTitle>
              <p className="text-xl font-medium leading-relaxed italic">"{aiInsights.strategic_advice}"</p>
            </Card>
          </div>
        )}
      </section>

      {loadingFeedback ? (
        <div className="p-20 text-center"><Loader2 className="animate-spin h-12 w-12 mx-auto text-primary" /></div>
      ) : !feedback || feedback.length === 0 ? (
        <Card className="p-24 text-center border-dashed border-4 rounded-[3rem]"><Quote className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-10" /><p className="text-xl font-bold text-muted-foreground">No feedback found.</p></Card>
      ) : (
        <div className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="rounded-[2.5rem] shadow-xl border-none p-8 bg-card">
              <CardTitle className="text-xl font-black font-lora flex items-center gap-2 mb-6"><PieChart className="h-5 w-5 text-primary" /> Marketing Sources</CardTitle>
              <div className="space-y-4">{Object.entries(stats?.marketingSources || {}).sort((a, b) => b[1] - a[1]).map(([source, count]) => (<div key={source} className="space-y-1"><div className="flex justify-between text-xs font-bold"><span>{source}</span><span>{count}</span></div><Progress value={(count / stats!.total) * 100} className="h-1.5 bg-primary/10" /></div>))}</div>
            </Card>
            <Card className="rounded-[2.5rem] shadow-xl border-none p-8 bg-card">
              <CardTitle className="text-xl font-black font-lora flex items-center gap-2 mb-6"><BarChart3 className="h-5 w-5 text-primary" /> Attendance Frequency</CardTitle>
              <div className="space-y-4">{Object.entries(stats?.frequencies || {}).sort((a, b) => b[1] - a[1]).map(([freq, count]) => (<div key={freq} className="space-y-1"><div className="flex justify-between text-xs font-bold"><span>{freq}</span><span>{count}</span></div><Progress value={(count / stats!.total) * 100} className="h-1.5 bg-primary/10" /></div>))}</div>
            </Card>
            <Card className="rounded-[2.5rem] shadow-xl border-none p-8 bg-card">
              <CardTitle className="text-xl font-black font-lora flex items-center gap-2 mb-6"><Clock className="h-5 w-5 text-primary" /> Preferred Times</CardTitle>
              <div className="space-y-4">{Object.entries(stats?.ongoingTimes || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([time, count]) => (<div key={time} className="space-y-1"><div className="flex justify-between text-xs font-bold"><span>{time}</span><span>{count}</span></div><Progress value={(count / stats!.total) * 100} className="h-1.5 bg-primary/10" /></div>))}</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[2.5rem] shadow-xl border-none overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4"><CardTitle className="text-xl font-black font-lora flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /> What they loved</CardTitle></CardHeader>
              <CardContent className="p-0"><ScrollArea className="h-[400px]"><div className="p-6 space-y-6">{feedback.map((f, i) => (<div key={i} className="group relative space-y-2 border-b border-border/50 pb-6 last:border-0"><p className="text-sm italic font-medium leading-relaxed pr-10">"{f.enjoyed_most}"</p><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">— {f.is_anonymous ? "Anonymous Member" : (f.profiles?.first_name || "Legacy Member")}</p></div>))}</div></ScrollArea></CardContent>
            </Card>
            <Card className="rounded-[2.5rem] shadow-xl border-none overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4"><CardTitle className="text-xl font-black font-lora flex items-center gap-2"><Music className="h-5 w-5 text-primary" /> Repertoire Demand</CardTitle></CardHeader>
              <CardContent className="p-0"><ScrollArea className="h-[400px]"><div className="p-6 space-y-4">{stats?.repertoire.filter(Boolean).map((rep, i) => (<div key={i} className="p-4 bg-muted/20 rounded-2xl border border-border/50 text-sm font-bold">{rep}</div>))}</div></ScrollArea></CardContent>
            </Card>
          </div>

          <Card className="rounded-[2.5rem] shadow-xl border-none overflow-hidden">
            <CardHeader className="bg-muted/30"><CardTitle className="text-xl font-black font-lora">Detailed Responses</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/20"><TableRow><TableHead className="pl-8">Member</TableHead><TableHead>Feeling</TableHead><TableHead>Venue</TableHead><TableHead>Repertoire</TableHead><TableHead>Score</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {feedback.map((f) => (
                      <TableRow key={f.id} className="hover:bg-muted/10 transition-colors">
                        <TableCell className="pl-8 font-bold">
                          {f.is_anonymous ? (
                            <div className="flex items-center gap-2 text-muted-foreground"><EyeOff className="h-3 w-3" /> Anonymous</div>
                          ) : (
                            f.profiles ? `${f.profiles.first_name} ${f.profiles.last_name}` : "Legacy"
                          )}
                        </TableCell>
                        <TableCell><Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest">{f.overall_feeling}</Badge></TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{f.venue_feedback}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{f.repertoire_feedback}</TableCell>
                        <TableCell><div className="flex items-center gap-1 font-black text-primary"><Star className="h-3 w-3 fill-current" /> {f.recommend_score}</div></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminEventFeedback;