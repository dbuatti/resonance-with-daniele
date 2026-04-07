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
import { Loader2, MessageSquare, Star, TrendingUp, Users, Calendar, Download, Quote, Heart } from "lucide-react";
import { format } from "date-fns";
import BackButton from "@/components/ui/BackButton";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";

const AdminEventFeedback: React.FC = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

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
      if (!selectedEventId) return [];
      const { data, error } = await supabase
        .from("event_feedback")
        .select(`
          *,
          profiles (first_name, last_name, email)
        `)
        .eq("event_id", selectedEventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedEventId,
  });

  // Set default event
  React.useEffect(() => {
    if (events && events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

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
      ["Name", "Email", "Feeling", "Enjoyed Most", "Improvements", "Score", "Comments"].join(","),
      ...feedback.map(f => [
        `"${f.profiles?.first_name} ${f.profiles?.last_name}"`,
        `"${f.profiles?.email}"`,
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
    a.setAttribute('download', `feedback-${selectedEventId}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showSuccess("Exported to CSV!");
  };

  if (loading || loadingEvents) return <div className="p-20 text-center"><Loader2 className="animate-spin h-12 w-12 mx-auto text-primary" /></div>;
  if (!user?.is_admin) { navigate("/"); return null; }

  return (
    <div className="space-y-8 py-8 md:py-12 max-w-7xl mx-auto px-4">
      <BackButton to="/admin" />
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <h1 className="text-5xl font-black font-lora tracking-tighter">Event Feedback</h1>
          <p className="text-xl text-muted-foreground">Analyze how your sessions are landing with the community.</p>
        </div>
        <div className="w-full md:w-72 space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Event</label>
          <Select value={selectedEventId || ""} onValueChange={setSelectedEventId}>
            <SelectTrigger className="h-12 rounded-xl shadow-xl bg-card border-2 border-primary/10">
              <SelectValue placeholder="Choose an event..." />
            </SelectTrigger>
            <SelectContent>
              {events?.map((event) => (
                <SelectItem key={event.id} value={event.id} className="font-bold">
                  {event.title} ({format(new Date(event.date), "MMM d")})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {!selectedEventId ? (
        <Card className="p-24 text-center border-dashed border-4 rounded-[3rem]">
          <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-10" />
          <p className="text-xl font-bold text-muted-foreground">Select an event to view feedback.</p>
        </Card>
      ) : loadingFeedback ? (
        <div className="p-20 text-center"><Loader2 className="animate-spin h-12 w-12 mx-auto text-primary" /></div>
      ) : !feedback || feedback.length === 0 ? (
        <Card className="p-24 text-center border-dashed border-4 rounded-[3rem]">
          <Quote className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-10" />
          <p className="text-xl font-bold text-muted-foreground">No feedback submitted for this event yet.</p>
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
              <p className="mt-4 text-sm font-medium opacity-80">Out of 10 based on {stats?.total} responses.</p>
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
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Response Rate</p>
                  <p className="text-6xl font-black tracking-tighter">{stats?.total}</p>
                </div>
                <Users className="h-8 w-8 opacity-40" />
              </div>
              <Button variant="ghost" className="mt-4 w-full bg-white/20 hover:bg-white/30 font-black rounded-xl" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" /> Export CSV
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
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="p-6 space-y-6">
                    {feedback.map((f, i) => (
                      <div key={i} className="space-y-2 border-b border-border/50 pb-6 last:border-0">
                        <p className="text-sm italic font-medium leading-relaxed">"{f.enjoyed_most}"</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">— {f.profiles?.first_name}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] shadow-xl border-none overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-xl font-black font-lora flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Improvements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="p-6 space-y-6">
                    {feedback.filter(f => f.improvements).map((f, i) => (
                      <div key={i} className="space-y-2 border-b border-border/50 pb-6 last:border-0">
                        <p className="text-sm italic font-medium leading-relaxed">"{f.improvements}"</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">— {f.profiles?.first_name}</p>
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
                        <TableCell className="pl-8 font-bold">{f.profiles?.first_name} {f.profiles?.last_name}</TableCell>
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