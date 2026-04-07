"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Star, TrendingUp, Users, Calendar, Download, Quote, Heart, Copy, History, Globe } from "lucide-react";
import { format } from "date-fns";
import BackButton from "@/components/ui/BackButton";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";
import LegacyFeedbackImporter from "@/components/admin/LegacyFeedbackImporter";

const AdminEventFeedback: React.FC = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const [selectedEventId, setSelectedEventId] = useState<string>("all"); // Default to 'all'

  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ["allEventsForFeedbackAdmin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, date")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: feedback, isLoading: loadingFeedback } = useQuery({
    queryKey: ["eventFeedbackData", selectedEventId],
    queryFn: async () => {
      let query = supabase
        .from("event_feedback")
        .select(`
          *,
          profiles (first_name, last_name, email),
          events (title, date)
        `)
        .order("created_at", { ascending: false });
      
      if (selectedEventId !== "all") {
        query = query.eq("event_id", selectedEventId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: true,
  });

  const stats = useMemo(() => {
    if (!feedback || feedback.length === 0) return null;
    
    const total = feedback.length;
    const avgScore = feedback.reduce((acc, f) => acc + (f.recommend_score || 0), 0) / total;
    
    const feelings: Record<string, number> = {};
    feedback.forEach(f => {
      feelings[f.overall_feeling] = (feelings[f.overall_feeling] || 0) + 1;
    });

    return { total, avgScore, feelings };
  }, [feedback]);

  const handleExport = () => {
    if (!feedback) return;
    const csv = [
      ["Event", "Date", "Name", "Email", "Feeling", "Enjoyed Most", "Improvements", "Score", "Comments"].join(","),
      ...feedback.map(f => [
        `"${f.events?.title || 'Unknown'}"`,
        `"${f.events?.date || ''}"`,
        f.profiles ? `"${f.profiles.first_name} ${f.profiles.last_name}"` : '"Legacy/Anonymous"',
        f.profiles ? `"${f.profiles.email}"` : '""',
        `"${f.overall_feeling}"`,
        `"${f.enjoyed_most?.replace(/"/g, '""')}"`,
        `"${f.improvements?.replace(/"/g, '""')}"`,
        f.recommend_score,
        `"${f.additional_comments?.replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `resonance-feedback-${selectedEventId}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showSuccess("Exported to CSV!");
  };

  const copyQuote = (text: string, author: string, eventTitle?: string) => {
    const formatted = `"${text}" — ${author}${eventTitle ? ` (${eventTitle})` : ''}, Resonance Participant`;
    navigator.clipboard.writeText(formatted);
    showSuccess("Quote copied for social media!");
  };

  if (loading || loadingEvents) return <div className="p-20 text-center"><Loader2 className="animate-spin h-12 w-12 mx-auto text-primary" /></div>;
  if (!user?.is_admin) { navigate("/"); return null; }

  return (
    <div className="space-y-8 py-8 md:py-12 max-w-7xl mx-auto px-4">
      <BackButton to="/admin" />
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <h1 className="text-5xl font-black font-lora tracking-tighter">
            {selectedEventId === "all" ? "Global Feedback" : "Event Feedback"}
          </h1>
          <p className="text-xl text-muted-foreground">
            {selectedEventId === "all" 
              ? "Aggregated insights from every session in Resonance history." 
              : "Analyze how this specific session landed with the community."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {selectedEventId !== "all" && <LegacyFeedbackImporter eventId={selectedEventId} />}
          <div className="w-full md:w-72 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select View</label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="h-12 rounded-xl shadow-xl bg-card border-2 border-primary/10">
                <SelectValue placeholder="Choose an event..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-bold text-primary">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" /> All Events (Aggregated)
                  </div>
                </SelectItem>
                {events?.map((event) => (
                  <SelectItem key={event.id} value={event.id} className="font-bold">
                    {event.title} ({format(new Date(event.date), "MMM d")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {loadingFeedback ? (
        <div className="p-20 text-center"><Loader2 className="animate-spin h-12 w-12 mx-auto text-primary" /></div>
      ) : !feedback || feedback.length === 0 ? (
        <Card className="p-24 text-center border-dashed border-4 rounded-[3rem]">
          <Quote className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-10" />
          <p className="text-xl font-bold text-muted-foreground">No feedback found for this selection.</p>
        </Card>
      ) : (
        <div className="space-y-10">
          {/* High Level Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-primary text-primary-foreground rounded-[2rem] shadow-xl border-none p-8">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Average NPS</p>
                  <p className="text-6xl font-black tracking-tighter">{stats?.avgScore.toFixed(1)}</p>
                </div>
                <Star className="h-8 w-8 text-accent fill-current" />
              </div>
              <p className="mt-4 text-sm font-medium opacity-80">Out of 10 based on {stats?.total} total responses.</p>
            </Card>

            <Card className="rounded-[2rem] shadow-xl border-none p-8 bg-card">
              <div className="flex justify-between items-start mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Overall Sentiment</p>
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div className="space-y-4">
                {Object.entries(stats?.feelings || {}).map(([feeling, count]) => (
                  <div key={feeling} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{feeling}</span>
                      <span>{Math.round((count / stats!.total) * 100)}%</span>
                    </div>
                    <Progress value={(count / stats!.total) * 100} className="h-1.5" />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-[2rem] shadow-xl border-none p-8 bg-accent text-accent-foreground">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Responses</p>
                  <p className="text-6xl font-black tracking-tighter">{stats?.total}</p>
                </div>
                <Users className="h-8 w-8 opacity-40" />
              </div>
              <Button variant="ghost" className="mt-4 w-full bg-white/20 hover:bg-white/30 font-black rounded-xl" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" /> Export Full Dataset
              </Button>
            </Card>
          </div>

          {/* Qualitative Feedback */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[2.5rem] shadow-xl border-none overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-xl font-black font-lora flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" /> What they loved
                </CardTitle>
                <CardDescription>Aggregated highlights from all selected sessions.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="p-6 space-y-6">
                    {feedback.map((f, i) => (
                      <div key={i} className="group relative space-y-2 border-b border-border/50 pb-6 last:border-0">
                        <p className="text-sm italic font-medium leading-relaxed pr-10">"{f.enjoyed_most}"</p>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            — {f.profiles?.first_name || "Legacy Member"} 
                            {selectedEventId === "all" && ` (${f.events?.title})`}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyQuote(f.enjoyed_most || "", f.profiles?.first_name || "Member", f.events?.title)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] shadow-xl border-none overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-xl font-black font-lora flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Improvements & Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="p-6 space-y-6">
                    {feedback.filter(f => f.improvements).map((f, i) => (
                      <div key={i} className="space-y-2 border-b border-border/50 pb-6 last:border-0">
                        <p className="text-sm italic font-medium leading-relaxed">"{f.improvements}"</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          — {f.profiles?.first_name || "Legacy Member"}
                          {selectedEventId === "all" && ` (${f.events?.title})`}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Full Table */}
          <Card className="rounded-[2.5rem] shadow-xl border-none overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-xl font-black font-lora">Detailed Responses</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow>
                      <TableHead className="pl-8">Member</TableHead>
                      {selectedEventId === "all" && <TableHead>Event</TableHead>}
                      <TableHead>Feeling</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Time Slot</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="pr-8">Regular?</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedback.map((f) => (
                      <TableRow key={f.id} className="hover:bg-muted/10 transition-colors">
                        <TableCell className="pl-8 font-bold">
                          {f.profiles ? `${f.profiles.first_name} ${f.profiles.last_name}` : (
                            <div className="flex items-center gap-2 text-muted-foreground italic">
                              <History className="h-3 w-3" /> Legacy
                            </div>
                          )}
                        </TableCell>
                        {selectedEventId === "all" && (
                          <TableCell className="text-xs font-bold text-primary">
                            {f.events?.title || "Unknown"}
                          </TableCell>
                        )}
                        <TableCell>
                          <Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest">{f.overall_feeling}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-black text-primary">
                            <Star className="h-3 w-3 fill-current" /> {f.recommend_score}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium">{f.time_slot_rating}</TableCell>
                        <TableCell className="text-xs font-medium">{f.price_point}</TableCell>
                        <TableCell className="pr-8">
                          <Badge className={cn(
                            "font-black text-[10px] uppercase tracking-widest",
                            f.regular_attendance_interest === "Yes" ? "bg-green-500" : "bg-muted text-muted-foreground"
                          )}>
                            {f.regular_attendance_interest}
                          </Badge>
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
    </div>
  );
};

export default AdminEventFeedback;