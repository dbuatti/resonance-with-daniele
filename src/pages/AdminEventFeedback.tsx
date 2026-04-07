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
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, Star, TrendingUp, Users, Globe, Clock, DollarSign, UserCheck, 
  Music, Search, Zap, Sparkles, Brain, AlertTriangle, CheckCircle2, 
  PieChart as PieChartIcon, BarChart3, MapPin, LineChart as LineChartIcon, 
  UserPlus, EyeOff, ListMusic, Heart, Quote, BarChart, CalendarCheck,
  Calendar, Info, MessageSquare, ExternalLink, SearchCode
} from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import BackButton from "@/components/ui/BackButton";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import LegacyFeedbackImporter from "@/components/admin/LegacyFeedbackImporter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, 
  CartesianGrid, BarChart as ReBarChart, Bar, Cell, PieChart, Pie, Legend 
} from "recharts";

const COLORS = ["#13294b", "#4a5568", "#d53f8c", "#fefcbf", "#8884d8", "#82ca9d", "#ffc658"];
const SENTIMENT_COLORS: Record<string, string> = {
  "Loved It": "#10b981",
  "Good": "#3b82f6",
  "Neutral": "#94a3b8",
  "Not for me": "#ef4444"
};

const AdminEventFeedback: React.FC = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);

  // Fetch ALL feedback once to handle filtering and month derivation locally
  const { data: allFeedback, isLoading: loadingFeedback } = useQuery({
    queryKey: ["allEventFeedbackData"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_feedback")
        .select(`*, profiles (first_name, last_name, email), events (title, date)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !loading,
  });

  // Generate unique months from all feedback data
  const uniqueMonths = useMemo(() => {
    if (!allFeedback) return [];
    const months = new Set<string>();
    allFeedback.forEach((f: any) => {
      const eventDate = Array.isArray(f.events) ? f.events[0]?.date : f.events?.date;
      const dateStr = eventDate || f.created_at;
      if (dateStr) {
        months.add(format(parseISO(dateStr), "yyyy-MM"));
      }
    });
    return Array.from(months).sort().reverse();
  }, [allFeedback]);

  // Filter feedback based on selection
  const filteredFeedback = useMemo(() => {
    if (!allFeedback) return [];
    if (selectedFilter === "all") return allFeedback;

    if (selectedFilter.startsWith("month:")) {
      const monthStr = selectedFilter.split(":")[1]; // "2024-03"
      const start = startOfMonth(parseISO(`${monthStr}-01`));
      const end = endOfMonth(start);

      return allFeedback.filter((f: any) => {
        const eventDate = Array.isArray(f.events) ? f.events[0]?.date : f.events?.date;
        const dateStr = eventDate || f.created_at;
        if (!dateStr) return false;
        const date = parseISO(dateStr);
        return isWithinInterval(date, { start, end });
      });
    }

    return allFeedback;
  }, [allFeedback, selectedFilter]);

  const { data: savedAiSummary } = useQuery({
    queryKey: ["savedAiSummary", selectedFilter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_ai_summaries")
        .select("content")
        .eq("event_id", selectedFilter)
        .maybeSingle();
      if (error) return null;
      return data?.content || null;
    },
    enabled: !!selectedFilter,
  });

  useMemo(() => {
    if (savedAiSummary) setAiInsights(savedAiSummary);
  }, [savedAiSummary]);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('analyze-feedback', {
        body: { eventId: selectedFilter }
      });
      if (error) throw error;
      
      await supabase.from("event_ai_summaries").upsert({
        event_id: selectedFilter,
        summary_type: selectedFilter === "all" ? "global" : "month",
        content: data,
        updated_at: new Date().toISOString()
      }, { onConflict: 'event_id,summary_type' });

      return data;
    },
    onSuccess: (data) => {
      setAiInsights(data);
      showSuccess("AI Analysis Complete!");
      queryClient.invalidateQueries({ queryKey: ["savedAiSummary", selectedFilter] });
    },
    onError: (err: any) => showError(err.message)
  });

  const stats = useMemo(() => {
    if (!filteredFeedback || filteredFeedback.length === 0) return null;
    const total = filteredFeedback.length;
    const avgScore = filteredFeedback.reduce((acc, f) => acc + (f.recommend_score || 0), 0) / total;
    
    const feelings: Record<string, number> = {};
    const npsDistribution: Record<number, number> = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0, 10:0};
    const venueFeelings: Record<string, number> = {};
    const repertoireFeelings: Record<string, number> = {};
    const marketingSources: Record<string, number> = {};
    const frequencies: Record<string, number> = {};
    const ongoingTimes: Record<string, number> = {};
    const repertoire: string[] = [];
    const trendMap: Record<string, { sum: number, count: number }> = {};
    let returningCount = 0;
    let newCount = 0;

    filteredFeedback.forEach((f: any) => {
      if (f.overall_feeling) feelings[f.overall_feeling] = (feelings[f.overall_feeling] || 0) + 1;
      if (f.recommend_score) npsDistribution[f.recommend_score] = (npsDistribution[f.recommend_score] || 0) + 1;
      if (f.venue_feedback) venueFeelings[f.venue_feedback] = (venueFeelings[f.venue_feedback] || 0) + 1;
      if (f.repertoire_feedback) repertoireFeelings[f.repertoire_feedback] = (repertoireFeelings[f.repertoire_feedback] || 0) + 1;
      if (f.how_heard) marketingSources[f.how_heard] = (marketingSources[f.how_heard] || 0) + 1;
      if (f.attendance_frequency) frequencies[f.attendance_frequency] = (frequencies[f.attendance_frequency] || 0) + 1;
      
      if (f.future_repertoire) repertoire.push(f.future_repertoire);
      if (f.future_ideas) repertoire.push(f.future_ideas);
      
      (f.best_times_ongoing as string[] || []).forEach(time => ongoingTimes[time] = (ongoingTimes[time] || 0) + 1);

      const eventDate = (Array.isArray(f.events) ? f.events[0]?.date : f.events?.date) || f.created_at;
      const monthKey = format(startOfMonth(parseISO(eventDate)), "MMM yyyy");
      if (!trendMap[monthKey]) trendMap[monthKey] = { sum: 0, count: 0 };
      trendMap[monthKey].sum += (f.recommend_score || 0);
      trendMap[monthKey].count += 1;

      if (f.is_first_time === false) returningCount++;
      else newCount++;
    });

    const trendData = Object.entries(trendMap)
      .map(([name, data]) => ({ name, score: parseFloat((data.sum / data.count).toFixed(1)) }))
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

    const npsChartData = Object.entries(npsDistribution).map(([score, count]) => ({ score: `Score ${score}`, count }));
    const sentimentChartData = Object.entries(feelings).map(([name, value]) => ({ name, value }));

    const getMode = (obj: Record<string, number>) => {
      return Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
    };

    return { 
      total, avgScore, feelings, marketingSources, repertoire, trendData, returningCount, newCount,
      npsChartData, sentimentChartData, venueFeelings, repertoireFeelings,
      topPrice: getMode(Object.fromEntries(filteredFeedback.map(f => [f.price_point, 1]))),
      topTimeSlot: getMode(Object.fromEntries(filteredFeedback.map(f => [f.time_slot_rating, 1]))),
      topPreferredTime: getMode(ongoingTimes),
      topFrequency: getMode(frequencies),
      ongoingTimes,
      frequencies
    };
  }, [filteredFeedback]);

  if (loading || loadingFeedback) return <div className="p-20 text-center"><Loader2 className="animate-spin h-12 w-12 mx-auto text-primary" /></div>;
  if (!user?.is_admin) { navigate("/"); return null; }

  return (
    <div className="space-y-8 py-8 md:py-12 max-w-7xl mx-auto px-4">
      <BackButton to="/admin" />
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <h1 className="text-5xl font-black font-lora tracking-tighter">
            {selectedFilter === "all" ? "Global Feedback" : `Feedback: ${format(parseISO(`${selectedFilter.split(":")[1]}-01`), "MMMM yyyy")}`}
          </h1>
          <p className="text-xl text-muted-foreground">
            {selectedFilter === "all" ? "Aggregated insights from every session." : "Analyze how sessions landed during this month."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <LegacyFeedbackImporter eventId="all" />
          <div className="w-full md:w-72 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Timeframe</label>
            <Select value={selectedFilter} onValueChange={(val) => { setSelectedFilter(val); setAiInsights(null); }}>
              <SelectTrigger className="h-12 rounded-xl shadow-xl bg-card border-2 border-primary/10">
                <SelectValue placeholder="Choose a month..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-bold text-primary">
                  <div className="flex items-center gap-2"><Globe className="h-4 w-4" /> All Events</div>
                </SelectItem>
                {uniqueMonths.map((month) => (
                  <SelectItem key={month} value={`month:${month}`} className="font-bold">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(parseISO(`${month}-01`), "MMMM yyyy")}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-primary text-primary-foreground rounded-[2rem] shadow-xl border-none p-8">
          <div className="flex justify-between items-start"><div className="space-y-1"><p className="text-[10px] font-black uppercase tracking-widest opacity-70">Average NPS</p><p className="text-6xl font-black tracking-tighter">{stats?.avgScore.toFixed(1) || "0.0"}</p></div><Star className="h-8 w-8 text-accent fill-current" /></div>
        </Card>
        
        <Card className="rounded-[2.5rem] shadow-xl border-none p-8 bg-card md:col-span-2">
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

        <Card className="rounded-[2.5rem] shadow-xl border-none p-8 bg-accent text-accent-foreground">
          <div className="flex justify-between items-start"><div className="space-y-1"><p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Responses</p><p className="text-6xl font-black tracking-tighter">{stats?.total || 0}</p></div><Users className="h-8 w-8 opacity-40" /></div>
        </Card>
      </div>

      {/* Advanced Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-[2.5rem] shadow-xl border-none p-8 bg-card">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-black font-lora flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" /> Overall Sentiment
            </CardTitle>
            <CardDescription>How the sessions felt for everyone.</CardDescription>
          </CardHeader>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.sentimentChartData || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(stats?.sentimentChartData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-[2.5rem] shadow-xl border-none p-8 bg-card">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-black font-lora flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> NPS Score Spread
            </CardTitle>
            <CardDescription>Count of each recommendation score (1-10).</CardDescription>
          </CardHeader>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={stats?.npsChartData || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="score" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* AI Strategy Engine */}
      <section className="mb-12">
        <Card className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-[3rem] shadow-2xl border-none overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <CardContent className="p-10 flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="bg-white/20 p-6 rounded-[2rem] shadow-inner"><Brain className="h-12 w-12 text-accent" /></div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] opacity-70">AI Strategy Engine</h3>
              <p className="text-3xl font-black font-lora leading-tight">
                {selectedFilter === "all" ? "Analyze the entire community's feedback history." : "Generate deep insights from this month's feedback."}
              </p>
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
            
            <Card className="md:col-span-2 rounded-[2.5rem] shadow-xl border-none p-8 bg-card border-t-4 border-primary">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl font-black font-lora flex items-center gap-3">
                  <Music className="h-6 w-6 text-primary" /> AI Repertoire Intelligence
                </CardTitle>
                <CardDescription className="text-base font-medium">Deciphered from messy long-form feedback and corrected for spelling.</CardDescription>
              </CardHeader>
              <CardContent className="px-0 space-y-8">
                {typeof aiInsights.repertoire_analysis === 'object' ? (
                  <>
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <ListMusic className="h-4 w-4" /> Specific Requests Identified
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {aiInsights.repertoire_analysis.specific_requests?.map((req: string, i: number) => (
                          <Badge key={i} variant="secondary" className="px-4 py-2 rounded-xl text-sm font-bold bg-primary/5 text-primary border-primary/10">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Zap className="h-4 w-4" /> Thematic Patterns
                        </h4>
                        <ul className="space-y-2">
                          {aiInsights.repertoire_analysis.thematic_patterns?.map((pattern: string, i: number) => (
                            <li key={i} className="flex items-center gap-2 text-sm font-bold">
                              <div className="w-1.5 h-1.5 rounded-full bg-accent" /> {pattern}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Brain className="h-4 w-4" /> Community Appetite
                        </h4>
                        <p className="text-lg font-medium leading-relaxed text-muted-foreground italic">
                          "{aiInsights.repertoire_analysis.summary}"
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-lg font-medium leading-relaxed text-muted-foreground italic">
                    {aiInsights.repertoire_analysis || "No specific repertoire patterns identified yet."}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2 rounded-[2.5rem] shadow-xl border-none p-10 bg-accent text-accent-foreground">
              <CardTitle className="text-2xl font-black font-lora flex items-center gap-3 mb-4"><Zap className="h-6 w-6" /> Strategic Advice for Daniele</CardTitle>
              <p className="text-xl font-medium leading-relaxed italic">"{aiInsights.strategic_advice}"</p>
            </Card>
          </div>
        )}
      </section>

      {/* Logistics & Retention Snapshot */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-1.5 bg-primary rounded-full" />
          <h2 className="text-3xl font-black font-lora tracking-tight">Logistics & Retention</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-lg bg-card p-6 rounded-3xl flex flex-col justify-between">
            <div className="space-y-1"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><DollarSign className="h-3 w-3" /> Ideal Price Point</p><p className="text-2xl font-black text-primary">{stats?.topPrice || "N/A"}</p></div>
            <Badge variant="outline" className="mt-4 w-fit bg-primary/5 border-primary/10 text-[10px] font-bold">Most Frequent Choice</Badge>
          </Card>
          <Card className="border-none shadow-lg bg-card p-6 rounded-3xl flex flex-col justify-between">
            <div className="space-y-1"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Clock className="h-3 w-3" /> Time Slot Fit</p><p className="text-2xl font-black text-primary">{stats?.topTimeSlot || "N/A"}</p></div>
            <Badge variant="outline" className="mt-4 w-fit bg-primary/5 border-primary/10 text-[10px] font-bold">Current 10am-1pm Slot</Badge>
          </Card>
          <Card className="border-none shadow-lg bg-card p-6 rounded-3xl flex flex-col justify-between">
            <div className="space-y-1"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><UserCheck className="h-3 w-3" /> Returning Legends</p><p className="text-2xl font-black text-green-600">{stats?.returningCount || 0}</p></div>
            <Progress value={(stats?.returningCount || 0) / (stats?.total || 1) * 100} className="h-1.5 mt-4" />
          </Card>
          <Card className="border-none shadow-lg bg-card p-6 rounded-3xl flex flex-col justify-between">
            <div className="space-y-1"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><UserPlus className="h-3 w-3" /> New Faces</p><p className="text-2xl font-black text-blue-600">{stats?.newCount || 0}</p></div>
            <Progress value={(stats?.newCount || 0) / (stats?.total || 1) * 100} className="h-1.5 mt-4" />
          </Card>
        </div>
      </section>

      {loadingFeedback ? (
        <div className="p-20 text-center"><Loader2 className="animate-spin h-12 w-12 mx-auto text-primary" /></div>
      ) : !filteredFeedback || filteredFeedback.length === 0 ? (
        <Card className="p-24 text-center border-dashed border-4 rounded-[3rem]"><Quote className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-10" /><p className="text-xl font-bold text-muted-foreground">No feedback found for this timeframe.</p></Card>
      ) : (
        <div className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="rounded-[2.5rem] shadow-xl border-none p-8 bg-card">
              <CardTitle className="text-xl font-black font-lora flex items-center gap-2 mb-6"><PieChartIcon className="h-5 w-5 text-primary" /> Marketing Sources</CardTitle>
              <div className="space-y-4">{Object.entries(stats?.marketingSources || {}).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([source, count]) => (<div key={source} className="space-y-1"><div className="flex justify-between text-xs font-bold"><span>{source}</span><span>{count as React.ReactNode}</span></div><Progress value={((count as number) / stats!.total) * 100} className="h-1.5 bg-primary/10" /></div>))}</div>
            </Card>
            <Card className="rounded-[2.5rem] shadow-xl border-none p-8 bg-card">
              <CardTitle className="text-xl font-black font-lora flex items-center gap-2 mb-6"><BarChart3 className="h-5 w-5 text-primary" /> Preferred Times</CardTitle>
              <div className="space-y-4">{Object.entries(stats?.ongoingTimes || {}).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5).map(([time, count]) => (<div key={time} className="space-y-1"><div className="flex justify-between text-xs font-bold"><span>{time}</span><span>{count as React.ReactNode}</span></div><Progress value={((count as number) / stats!.total) * 100} className="h-1.5 bg-primary/10" /></div>))}</div>
            </Card>
            <Card className="rounded-[2.5rem] shadow-xl border-none p-8 bg-card">
              <CardTitle className="text-xl font-black font-lora flex items-center gap-2 mb-6"><Clock className="h-5 w-5 text-primary" /> Attendance Frequency</CardTitle>
              <div className="space-y-4">{Object.entries(stats?.frequencies || {}).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([freq, count]) => (<div key={freq} className="space-y-1"><div className="flex justify-between text-xs font-bold"><span>{freq}</span><span>{count as React.ReactNode}</span></div><Progress value={((count as number) / stats!.total) * 100} className="h-1.5 bg-primary/10" /></div>))}</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[2.5rem] shadow-xl border-none overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4"><CardTitle className="text-xl font-black font-lora flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /> What they loved</CardTitle></CardHeader>
              <CardContent className="p-0"><ScrollArea className="h-[400px]"><div className="p-6 space-y-6">{filteredFeedback.map((f, i) => (<div key={i} className="group relative space-y-2 border-b border-border/50 pb-6 last:border-0"><p className="text-sm italic font-medium leading-relaxed pr-10">"{f.enjoyed_most}"</p><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">— {f.is_anonymous ? "Anonymous Member" : (f.profiles?.first_name || "Legacy Member")}</p></div>))}</div></ScrollArea></CardContent>
            </Card>
            <Card className="rounded-[2.5rem] shadow-xl border-none overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4"><CardTitle className="text-xl font-black font-lora flex items-center gap-2"><Music className="h-5 w-5 text-primary" /> Repertoire Demand</CardTitle></CardHeader>
              <CardContent className="p-0"><ScrollArea className="h-[400px]"><div className="p-6 space-y-4">{stats?.repertoire.filter(Boolean).map((rep, i) => (<div key={i} className="p-4 bg-muted/20 rounded-2xl border border-border/50 text-sm font-bold">{rep}</div>))}</div></ScrollArea></CardContent>
            </Card>
          </div>

          <Card className="rounded-[2.5rem] shadow-xl border-none overflow-hidden">
            <CardHeader className="bg-muted/30 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-black font-lora">Detailed Responses</CardTitle>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Click any row to view full details</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/20"><TableRow><TableHead className="pl-8">Member</TableHead><TableHead>Feeling</TableHead><TableHead>Venue</TableHead><TableHead>Repertoire</TableHead><TableHead>Score</TableHead><TableHead className="text-right pr-8">Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredFeedback.map((f) => (
                      <TableRow key={f.id} className="hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => setSelectedResponse(f)}>
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
                        <TableCell className="text-right pr-8">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><ExternalLink className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Response Dialog */}
      <Dialog open={!!selectedResponse} onOpenChange={(open) => !open && setSelectedResponse(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0 border-none shadow-2xl">
          {selectedResponse && (
            <>
              <DialogHeader className="p-8 bg-primary text-primary-foreground">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <DialogTitle className="text-3xl font-black font-lora">Full Response Details</DialogTitle>
                    <DialogDescription className="text-primary-foreground/70 font-medium">
                      Submitted on {format(parseISO(selectedResponse.created_at), "PPPP 'at' p")}
                    </DialogDescription>
                  </div>
                  <Badge className="bg-accent text-accent-foreground text-xl font-black px-4 py-2 rounded-2xl shadow-lg">
                    {selectedResponse.recommend_score}/10
                  </Badge>
                </div>
              </DialogHeader>
              
              <div className="p-8 space-y-10">
                {/* Identity Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Member</p>
                    <p className="text-lg font-bold flex items-center gap-2">
                      {selectedResponse.is_anonymous ? <><EyeOff className="h-4 w-4 text-primary" /> Anonymous Member</> : (selectedResponse.profiles ? `${selectedResponse.profiles.first_name} ${selectedResponse.profiles.last_name}` : "Legacy Import")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">First Time?</p>
                    <p className="text-lg font-bold">{selectedResponse.is_first_time ? "Yes, first session!" : "No, returning member."}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">How they heard</p>
                    <p className="text-lg font-bold flex items-center gap-2">
                      <SearchCode className="h-4 w-4 text-primary" /> {selectedResponse.how_heard || "N/A"}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* The Experience Section */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> The Experience
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <p className="text-sm font-black">Overall Feeling</p>
                      <Badge className={cn("px-4 py-1 rounded-xl font-black", SENTIMENT_COLORS[selectedResponse.overall_feeling] ? `bg-[${SENTIMENT_COLORS[selectedResponse.overall_feeling]}]` : "bg-primary")}>
                        {selectedResponse.overall_feeling}
                      </Badge>
                      {selectedResponse.overall_feeling_other && (
                        <p className="text-sm italic text-muted-foreground mt-2">"{selectedResponse.overall_feeling_other}"</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-black">Enjoyed Most</p>
                      <p className="text-sm leading-relaxed text-muted-foreground italic">"{selectedResponse.enjoyed_most}"</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-black">Improvements</p>
                      <p className="text-sm leading-relaxed text-muted-foreground italic">"{selectedResponse.improvements || "No suggestions provided."}"</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-black">Additional Comments</p>
                      <p className="text-sm leading-relaxed text-muted-foreground italic">"{selectedResponse.additional_comments || "None."}"</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Logistics Section */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Logistics & Repertoire
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <p className="text-sm font-black">Venue Feedback</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">"{selectedResponse.venue_feedback}"</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-black">Repertoire Feedback</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">"{selectedResponse.repertoire_feedback}"</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-black">Time Slot (10am-1pm)</p>
                      <p className="text-sm font-bold text-primary">{selectedResponse.time_slot_rating}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-black">Price Point ($35)</p>
                      <p className="text-sm font-bold text-primary">{selectedResponse.price_point}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Future Planning Section */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4" /> Future Planning
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <p className="text-sm font-black">Future Repertoire Ideas</p>
                      <p className="text-sm leading-relaxed text-muted-foreground italic">"{selectedResponse.future_repertoire || selectedResponse.future_ideas || "None."}"</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-black">Interest in Next Month</p>
                      <div className="flex flex-wrap gap-2">
                        {(selectedResponse.interest_next_month as string[] || []).map((date: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px] font-bold border-primary/20">{date}</Badge>
                        ))}
                        {(!selectedResponse.interest_next_month || selectedResponse.interest_next_month.length === 0) && (
                          <p className="text-sm text-muted-foreground italic">No dates selected.</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-black">Regular Attendance Interest</p>
                      <p className="text-sm font-bold text-primary">{selectedResponse.regular_attendance_interest}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-black">Preferred Frequency</p>
                      <p className="text-sm font-bold text-primary">{selectedResponse.attendance_frequency}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-black">Best Times (Ongoing)</p>
                      <div className="flex flex-wrap gap-2">
                        {(selectedResponse.best_times_ongoing as string[] || []).map((time: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[10px] font-bold">{time}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-8 bg-muted/30 flex justify-end">
                <Button onClick={() => setSelectedResponse(null)} className="rounded-xl font-bold">Close Details</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEventFeedback;