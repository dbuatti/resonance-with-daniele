"use client";

import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, Star, TrendingUp, Users, Sparkles, Brain, AlertTriangle,
  CheckCircle2, PieChart as PieChartIcon, BarChart3, UserCheck, UserPlus,
  Heart, Frown, EyeOff, ExternalLink, Music, MessageSquareText,
  MapPin, CalendarCheck, Calendar, SearchCode, Zap, ListMusic,
} from "lucide-react";
import { parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip,
  CartesianGrid, BarChart as ReBarChart, Bar, Cell, PieChart, Pie, Legend,
} from "recharts";

const COLORS = ["#13294b", "#4a5568", "#d53f8c", "#fefcbf", "#8884d8", "#82ca9d", "#ffc658"];
const SENTIMENT_COLORS: Record<string, string> = {
  "Loved It": "#10b981",
  "Good": "#3b82f6",
  "Neutral": "#94a3b8",
  "Not for me": "#ef4444",
};

interface EventFeedbackPanelProps {
  eventId: string;
}

interface FeedbackRow {
  id: string;
  created_at: string;
  recommend_score: number;
  overall_feeling: string | null;
  overall_feeling_other: string | null;
  enjoyed_most: string | null;
  improvements: string | null;
  additional_comments: string | null;
  venue_feedback: string | null;
  repertoire_feedback: string | null;
  time_slot_rating: string | null;
  price_point: string | null;
  future_repertoire: string | null;
  future_ideas: string | null;
  is_first_time: boolean | null;
  is_anonymous: boolean | null;
  how_heard: string | null;
  attendance_frequency: string | null;
  regular_attendance_interest: string | null;
  interest_next_month: string[] | null;
  best_times_ongoing: string[] | null;
  profiles: { first_name: string | null; last_name: string | null; email: string | null } | null;
  events: { title: string; date: string } | null;
}

const EventFeedbackPanel: React.FC<EventFeedbackPanelProps> = ({ eventId }) => {
  const queryClient = useQueryClient();
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [selectedResponse, setSelectedResponse] = useState<FeedbackRow | null>(null);

  const { data: feedback, isLoading } = useQuery<FeedbackRow[]>({
    queryKey: ["eventFeedback", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_feedback")
        .select(`*, profiles (first_name, last_name, email), events (title, date)`)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as FeedbackRow[]) || [];
    },
    enabled: !!eventId,
  });

  const { data: savedAiSummary } = useQuery({
    queryKey: ["savedAiSummary", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_ai_summaries")
        .select("content")
        .eq("event_id", eventId)
        .maybeSingle();
      if (error) return null;
      return data?.content || null;
    },
    enabled: !!eventId,
  });

  useEffect(() => { if (savedAiSummary) setAiInsights(savedAiSummary); }, [savedAiSummary]);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("analyze-feedback", {
        body: { eventId },
      });
      if (error) throw error;
      await supabase.from("event_ai_summaries").upsert({
        event_id: eventId,
        summary_type: "feedback",
        content: data,
        updated_at: new Date().toISOString(),
      }, { onConflict: "event_id,summary_type" });
      return data;
    },
    onSuccess: (data) => {
      setAiInsights(data);
      showSuccess("AI Analysis Complete!");
      queryClient.invalidateQueries({ queryKey: ["savedAiSummary", eventId] });
    },
    onError: (err: Error) => showError(err.message),
  });

  const stats = useMemo(() => {
    if (!feedback || feedback.length === 0) return null;
    const total = feedback.length;
    const avgScore = feedback.reduce((acc, f) => acc + (f.recommend_score || 0), 0) / total;
    const feelings: Record<string, number> = {};
    const npsDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
    const marketingSources: Record<string, number> = {};
    const frequencies: Record<string, number> = {};
    const ongoingTimes: Record<string, number> = {};
    let returningCount = 0;
    let newCount = 0;

    feedback.forEach((f) => {
      if (f.overall_feeling) feelings[f.overall_feeling] = (feelings[f.overall_feeling] || 0) + 1;
      if (f.recommend_score) npsDistribution[f.recommend_score] = (npsDistribution[f.recommend_score] || 0) + 1;
      if (f.how_heard) marketingSources[f.how_heard] = (marketingSources[f.how_heard] || 0) + 1;
      if (f.attendance_frequency) frequencies[f.attendance_frequency] = (frequencies[f.attendance_frequency] || 0) + 1;
      (f.best_times_ongoing as string[] || []).forEach((t) => ongoingTimes[t] = (ongoingTimes[t] || 0) + 1);
      if (f.is_first_time === false) returningCount++; else newCount++;
    });

    const npsChartData = Object.entries(npsDistribution).map(([score, count]) => ({ score: `Score ${score}`, count }));
    const sentimentChartData = Object.entries(feelings).map(([name, value]) => ({ name, value }));

    return {
      total, avgScore, npsChartData, sentimentChartData,
      marketingSources, frequencies, ongoingTimes, returningCount, newCount,
    };
  }, [feedback]);

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="animate-spin h-10 w-10 mx-auto text-primary" />
      </div>
    );
  }

  if (!feedback || feedback.length === 0) {
    return (
      <div className="py-16 text-center border-2 border-dashed border-border/50 rounded-[2rem] bg-muted/10">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
        <p className="text-lg font-bold text-muted-foreground font-lora">No feedback collected for this event yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary text-primary-foreground rounded-[2rem] shadow-xl border-none p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Average NPS</p>
              <p className="text-5xl font-black tracking-tighter">{stats?.avgScore.toFixed(1) || "0.0"}</p>
            </div>
            <Star className="h-7 w-7 text-accent fill-current" />
          </div>
        </Card>
        <Card className="rounded-[2.5rem] shadow-xl border-none p-6 bg-card">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base font-black font-lora flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" /> Overall Sentiment
            </CardTitle>
          </CardHeader>
          <div className="h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats?.sentimentChartData || []} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                  {(stats?.sentimentChartData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={28} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="rounded-[2rem] shadow-xl border-none p-6 bg-accent text-accent-foreground">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Responses</p>
              <p className="text-5xl font-black tracking-tighter">{stats?.total || 0}</p>
            </div>
            <Users className="h-7 w-7 opacity-40" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-[2.5rem] shadow-xl border-none p-6 bg-card">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base font-black font-lora flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> NPS Score Spread
            </CardTitle>
          </CardHeader>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={stats?.npsChartData || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="score" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: "bold" }} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <RechartsTooltip cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-[2.5rem] shadow-xl border-none p-6 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <CardContent className="p-0 relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-3 rounded-xl"><Brain className="h-5 w-5 text-accent" /></div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">AI Strategy Engine</h3>
                <p className="text-sm font-bold">Run AI analysis on this event's feedback.</p>
              </div>
            </div>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-black rounded-xl" onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}>
              {analyzeMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : <><Sparkles className="mr-2 h-4 w-4" /> {aiInsights ? "Refresh AI Analysis" : "Run AI Analysis"}</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      {aiInsights && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
          <Card className="rounded-[2.5rem] shadow-xl border-none p-6 bg-card">
            <CardTitle className="text-base font-black font-lora flex items-center gap-2 mb-4"><CheckCircle2 className="h-4 w-4 text-green-500" /> Top Highlights</CardTitle>
            {aiInsights.top_highlights?.length
              ? <ul className="space-y-3">{aiInsights.top_highlights.map((h: string, i: number) => (<li key={i} className="p-3 bg-green-50 dark:bg-green-950/20 rounded-xl text-sm font-bold">{h}</li>))}</ul>
              : <p className="text-sm text-muted-foreground italic">No highlights extracted.</p>}
          </Card>
          <Card className="rounded-[2.5rem] shadow-xl border-none p-6 bg-card">
            <CardTitle className="text-base font-black font-lora flex items-center gap-2 mb-4"><AlertTriangle className="h-4 w-4 text-destructive" /> Critical Friction</CardTitle>
            {aiInsights.critical_friction?.length
              ? <ul className="space-y-3">{aiInsights.critical_friction.map((f: string, i: number) => (<li key={i} className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl text-sm font-bold">{f}</li>))}</ul>
              : <p className="text-sm text-muted-foreground italic">No friction points extracted.</p>}
          </Card>
          {aiInsights.strategic_advice && (
            <Card className="md:col-span-2 rounded-[2.5rem] shadow-xl border-none p-6 bg-accent text-accent-foreground">
              <CardTitle className="text-base font-black font-lora flex items-center gap-2 mb-3"><Zap className="h-4 w-4" /> Strategic Advice</CardTitle>
              <p className="text-sm font-medium leading-relaxed italic">"{aiInsights.strategic_advice}"</p>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-[2.5rem] shadow-xl border-none overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4"><CardTitle className="text-base font-black font-lora flex items-center gap-2"><Heart className="h-4 w-4 text-primary" /> What they loved</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[320px]">
              <div className="p-6 space-y-5">
                {feedback.map((f, i) => (
                  <div key={i} className="space-y-1 border-b border-border/50 pb-5 last:border-0">
                    <p className="text-sm italic font-medium leading-relaxed">"{f.enjoyed_most}"</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">— {f.is_anonymous ? "Anonymous Member" : (f.profiles?.first_name || "Community")}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card className="rounded-[2.5rem] shadow-xl border-none overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4"><CardTitle className="text-base font-black font-lora flex items-center gap-2"><Frown className="h-4 w-4 text-primary" /> Constructive Feedback</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[320px]">
              <div className="p-6 space-y-5">
                {feedback.filter(f => f.improvements).map((f, i) => (
                  <div key={i} className="space-y-1 border-b border-border/50 pb-5 last:border-0">
                    <p className="text-sm italic font-medium leading-relaxed">"{f.improvements}"</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">— {f.is_anonymous ? "Anonymous Member" : (f.profiles?.first_name || "Community")}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2.5rem] shadow-xl border-none overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4"><CardTitle className="text-base font-black font-lora">Detailed Responses</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="pl-8">Member</TableHead>
                  <TableHead>Feeling</TableHead>
                  <TableHead>Enjoyed Most</TableHead>
                  <TableHead>Improvements</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right pr-8">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedback.map((f) => (
                  <TableRow key={f.id} className="hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => setSelectedResponse(f)}>
                    <TableCell className="pl-8 font-bold">
                      {f.is_anonymous
                        ? <div className="flex items-center gap-2 text-muted-foreground"><EyeOff className="h-3 w-3" /> Anonymous</div>
                        : f.profiles ? `${f.profiles.first_name} ${f.profiles.last_name}` : "Community"}
                    </TableCell>
                    <TableCell><Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest">{f.overall_feeling}</Badge></TableCell>
                    <TableCell className="text-xs max-w-[220px] truncate italic">{f.enjoyed_most}</TableCell>
                    <TableCell className="text-xs max-w-[220px] truncate italic text-destructive">{f.improvements || "—"}</TableCell>
                    <TableCell><div className="flex items-center gap-1 font-black text-primary"><Star className="h-3 w-3 fill-current" /> {f.recommend_score}</div></TableCell>
                    <TableCell className="text-right pr-8"><Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><ExternalLink className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedResponse} onOpenChange={(open) => !open && setSelectedResponse(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0 border-none shadow-2xl">
          {selectedResponse && (
            <>
              <DialogHeader className="p-8 bg-primary text-primary-foreground">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <DialogTitle className="text-2xl font-black font-lora">Full Response Details</DialogTitle>
                    <DialogDescription className="text-primary-foreground/70 font-medium">
                      Submitted {parseISO(selectedResponse.created_at).toLocaleString()}
                    </DialogDescription>
                  </div>
                  <Badge className="bg-accent text-accent-foreground text-lg font-black px-3 py-2 rounded-2xl shadow-lg">
                    {selectedResponse.recommend_score}/10
                  </Badge>
                </div>
              </DialogHeader>
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Member</p>
                    <p className="text-base font-bold">
                      {selectedResponse.is_anonymous ? "Anonymous Member" : (selectedResponse.profiles ? `${selectedResponse.profiles.first_name} ${selectedResponse.profiles.last_name}` : "Community")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">First Time?</p>
                    <p className="text-base font-bold">{selectedResponse.is_first_time ? "Yes" : "No, returning"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">How they heard</p>
                    <p className="text-base font-bold flex items-center gap-2"><SearchCode className="h-4 w-4 text-primary" /> {selectedResponse.how_heard || "N/A"}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-black">Overall Feeling</p>
                    <Badge style={SENTIMENT_COLORS[selectedResponse.overall_feeling || ""] ? { backgroundColor: SENTIMENT_COLORS[selectedResponse.overall_feeling || ""] } : undefined}>{selectedResponse.overall_feeling}</Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-black flex items-center gap-2"><Heart className="h-4 w-4 text-primary" /> Enjoyed Most</p>
                    <p className="text-sm leading-relaxed text-muted-foreground italic bg-muted/30 p-3 rounded-xl">"{selectedResponse.enjoyed_most}"</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-black flex items-center gap-2"><Frown className="h-4 w-4 text-destructive" /> Improvements</p>
                    <p className="text-sm leading-relaxed text-muted-foreground italic bg-red-50 dark:bg-red-950/20 p-3 rounded-xl">"{selectedResponse.improvements || "No suggestions."}"</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-black flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-primary" /> Additional Comments</p>
                    <p className="text-sm leading-relaxed text-muted-foreground italic bg-muted/30 p-3 rounded-xl">"{selectedResponse.additional_comments || "None."}"</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-black">Venue Feedback</p>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-xl">"{selectedResponse.venue_feedback || "N/A"}"</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-black">Repertoire Feedback</p>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-xl">"{selectedResponse.repertoire_feedback || "N/A"}"</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-black">Future Repertoire Ideas</p>
                    <p className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded-xl">"{selectedResponse.future_repertoire || selectedResponse.future_ideas || "None."}"</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-black flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Interest in Next Month</p>
                    <div className="flex flex-wrap gap-2 bg-muted/30 p-3 rounded-xl">
                      {(selectedResponse.interest_next_month as string[] || []).map((d, i) => (<Badge key={i} variant="outline" className="text-[10px] font-bold border-primary/20 bg-background">{d}</Badge>))}
                      {(!selectedResponse.interest_next_month || selectedResponse.interest_next_month.length === 0) && <p className="text-sm text-muted-foreground italic">No dates selected.</p>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-muted/30 flex justify-end">
                <Button onClick={() => setSelectedResponse(null)} className="rounded-xl font-black">Close Details</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventFeedbackPanel;