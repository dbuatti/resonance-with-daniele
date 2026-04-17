"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Clock, 
  DollarSign, 
  Zap, 
  TrendingUp, 
  UserCheck, 
  UserPlus, 
  Percent,
  Target,
  Loader2,
  Globe,
  Info,
  Tag,
  ChevronRight,
  Heart,
  Sparkles,
  Trophy,
  Ticket,
  BarChart3,
  AlertTriangle,
  Activity,
  Music,
  Brain,
  CheckCircle2
} from "lucide-react";
import { differenceInDays, parseISO, startOfDay, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MarketingInsightsProps {
  eventId: string;
}

const MarketingInsights: React.FC<MarketingInsightsProps> = ({ eventId }) => {
  const isGlobal = eventId === "all";

  // 1. Fetch Event Details
  const { data: event } = useQuery({
    queryKey: ["eventDetailsForInsights", eventId],
    queryFn: async () => {
      if (isGlobal) return null;
      const { data, error } = await supabase.from("events").select("*").eq("id", eventId).single();
      if (error) throw error;
      return data;
    },
    enabled: !isGlobal,
  });

  // 2. Fetch Orders
  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ["eventOrdersForInsights", eventId],
    queryFn: async () => {
      let query = supabase.from("event_orders").select("*");
      if (!isGlobal) query = query.eq("event_id", eventId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // 3. Fetch ALL orders ever
  const { data: allOrders } = useQuery({
    queryKey: ["allOrdersForRetention"],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_orders").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // 4. Fetch Profiles
  const { data: profiles } = useQuery({
    queryKey: ["allProfilesForCRM"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data || [];
    }
  });

  // 5. Fetch Engagement Data (Suggestions & Votes)
  const { data: suggestions } = useQuery({
    queryKey: ["allSuggestionsForEngagement"],
    queryFn: async () => {
      const { data } = await supabase.from("song_suggestions").select("user_id");
      return data || [];
    }
  });

  const { data: votes } = useQuery({
    queryKey: ["allVotesForEngagement"],
    queryFn: async () => {
      const { data } = await supabase.from("user_song_votes").select("user_id");
      return data || [];
    }
  });

  // 6. Fetch All Events
  const { data: allEvents } = useQuery({
    queryKey: ["allEventsForLeadTime"],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*").order("date", { ascending: false });
      return data || [];
    }
  });

  const profileMap = useMemo(() => {
    const map: Record<string, any> = {};
    profiles?.forEach(p => { if (p.email) map[p.email.toLowerCase().trim()] = p; });
    return map;
  }, [profiles]);

  const insights = useMemo(() => {
    if (!orders || !allOrders || (!isGlobal && !event)) return null;

    const totalTickets = orders.reduce((sum, o) => sum + (o.valid_tickets || 0), 0);
    const totalEarnings = orders.reduce((sum, o) => sum + Number(o.your_earnings || 0), 0);

    // Retention & Churn Logic
    const peopleMap: Record<string, { name: string, events: Set<string>, email: string, ltv: number }> = {};
    allOrders.forEach(o => {
      if (!o.email) return;
      const email = o.email.toLowerCase().trim();
      if (!peopleMap[email]) {
        peopleMap[email] = { email, name: `${o.first_name || ''} ${o.last_name || ''}`.trim() || email, events: new Set(), ltv: 0 };
      }
      peopleMap[email].events.add(o.event_id);
      peopleMap[email].ltv += Number(o.your_earnings || 0);
    });

    let returningPeople: any[] = [];
    let newPeople: any[] = [];
    let churnRisk: any[] = [];

    if (isGlobal) {
      const uniqueEmails = Object.keys(peopleMap);
      returningPeople = uniqueEmails.filter(e => peopleMap[e].events.size > 1).map(e => ({ ...peopleMap[e], count: peopleMap[e].events.size, member: profileMap[e] })).sort((a, b) => b.count - a.count);
      newPeople = uniqueEmails.filter(e => peopleMap[e].events.size === 1).map(e => ({ ...peopleMap[e], member: profileMap[e] }));
    } else {
      const currentEmails = new Set(orders.map(o => o.email?.toLowerCase().trim()).filter(Boolean));
      const previousEmails = new Set(allOrders.filter(o => o.event_id !== eventId).map(o => o.email?.toLowerCase().trim()).filter(Boolean));
      
      returningPeople = Array.from(currentEmails).filter(e => previousEmails.has(e!)).map(e => ({ ...peopleMap[e!], member: profileMap[e!] }));
      newPeople = Array.from(currentEmails).filter(e => !previousEmails.has(e!)).map(e => ({ ...peopleMap[e!], member: profileMap[e!] }));
      
      // Churn Risk: People who attended 2+ sessions in the past but NOT this one
      churnRisk = Array.from(previousEmails)
        .filter(e => !currentEmails.has(e!) && peopleMap[e!].events.size >= 2)
        .map(e => ({ ...peopleMap[e!], member: profileMap[e!] }))
        .sort((a, b) => b.events.size - a.events.size);
    }

    // Lead Time Breakdown
    let earlyBirds = 0;
    let lastMinute = 0;
    const eventDateMap = Object.fromEntries(allEvents?.map(e => [e.id, startOfDay(parseISO(e.date))]) || []);
    
    const relevantOrders = isGlobal ? allOrders : orders;
    relevantOrders.forEach(o => {
      const eDate = eventDateMap[o.event_id];
      if (!eDate) return;
      const lead = differenceInDays(eDate, startOfDay(parseISO(o.order_date)));
      if (lead >= 7) earlyBirds++;
      else lastMinute++;
    });

    // Engagement Score
    const engagementScores = Object.keys(peopleMap).map(email => {
      const p = peopleMap[email];
      const member = profileMap[email];
      let score = p.events.size * 10; // 10 pts per session
      if (member) {
        score += (suggestions?.filter(s => s.user_id === member.id).length || 0) * 5; // 5 pts per suggestion
        score += (votes?.filter(v => v.user_id === member.id).length || 0) * 2; // 2 pts per vote
      }
      return { ...p, score, member };
    }).sort((a, b) => b.score - a.score).slice(0, 10);

    // Repertoire Impact
    const repertoireImpact = allEvents?.map(e => {
      const attendance = allOrders.filter(o => o.event_id === e.id).reduce((sum, o) => sum + (o.valid_tickets || 0), 0);
      return { title: e.title, song: e.main_song || "Unknown", attendance };
    }).sort((a, b) => b.attendance - a.attendance).slice(0, 5);

    return {
      totalTickets,
      totalEarnings,
      returningPeople,
      newPeople,
      churnRisk,
      earlyBirds,
      lastMinute,
      engagementScores,
      repertoireImpact,
      retentionRate: isGlobal ? (returningPeople.length / Object.keys(peopleMap).length) * 100 : (returningPeople.length / (returningPeople.length + newPeople.length)) * 100
    };
  }, [orders, allOrders, event, isGlobal, profileMap, allEvents, suggestions, votes]);

  if (loadingOrders) return <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>;
  if (!insights) return null;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Top Row: Behavioral Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg bg-card rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5 text-primary" /> Community Loyalty
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="text-3xl font-black">{insights.retentionRate.toFixed(0)}%</div>
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-none font-bold">Retention</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
              <div className="flex items-center gap-1"><UserCheck className="h-3 w-3 text-primary" /> {insights.returningPeople.length} Legends</div>
              <div className="flex items-center gap-1"><UserPlus className="h-3 w-3 text-blue-500" /> {insights.newPeople.length} New</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-card rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-primary" /> Booking Speed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="text-3xl font-black">{((insights.earlyBirds / (insights.earlyBirds + insights.lastMinute)) * 100).toFixed(0)}%</div>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-none font-bold">Early Birds</Badge>
            </div>
            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
              {insights.earlyBirds} people booked 7+ days out. {insights.lastMinute} booked in the final week.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-card rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-primary" /> Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="text-3xl font-black">{insights.engagementScores[0]?.score || 0}</div>
              <Badge variant="secondary" className="bg-accent/10 text-accent-foreground border-none font-bold">Top Score</Badge>
            </div>
            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
              Based on attendance, song suggestions, and community voting.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-card rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Churn Risk
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="text-3xl font-black">{isGlobal ? "N/A" : insights.churnRisk.length}</div>
              <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-none font-bold">Missing</Badge>
            </div>
            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
              {isGlobal ? "Select an event to see missing regulars." : "Regulars who haven't booked for this session yet."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Churn Risk / Missing Regulars */}
        {!isGlobal && (
          <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-card">
            <CardHeader className="bg-red-500/5 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-black font-lora flex items-center gap-2">
                    <Target className="h-5 w-5 text-destructive" /> Outreach List
                  </CardTitle>
                  <CardDescription className="font-medium">Regulars missing from this session.</CardDescription>
                </div>
                <Badge variant="destructive" className="font-black">{insights.churnRisk.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[350px]">
                <div className="p-6 space-y-3">
                  {insights.churnRisk.length > 0 ? (
                    insights.churnRisk.map((person, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-background shadow-sm">
                            <AvatarImage src={person.member?.avatar_url || ""} />
                            <AvatarFallback className="text-[10px] font-bold">{(person.name || "U")[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{person.name}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{person.events.size} Past Sessions</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-primary" asChild>
                          <a href={`mailto:${person.email}`}><ChevronRight className="h-4 w-4" /></a>
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 space-y-2">
                      <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
                      <p className="text-sm font-bold">All regulars are accounted for!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Engagement Leaderboard */}
        <Card className={cn("rounded-[2rem] border-none shadow-xl overflow-hidden bg-card", isGlobal ? "lg:col-span-2" : "")}>
          <CardHeader className="bg-primary/5 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-black font-lora flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" /> Community Champions
                </CardTitle>
                <CardDescription className="font-medium">Most active members (Attendance + Activity).</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[350px]">
              <div className="p-6 space-y-3">
                {insights.engagementScores.map((person, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-black text-muted-foreground w-4">#{i+1}</div>
                      <Avatar className="h-8 w-8 border border-background shadow-sm">
                        <AvatarImage src={person.member?.avatar_url || ""} />
                        <AvatarFallback className="text-[10px] font-bold">{(person.name || "U")[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-bold text-sm">{person.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/10 text-primary border-none font-black">{person.score} pts</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Repertoire Impact */}
        <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-card">
          <CardHeader className="bg-accent/10 border-b border-border/50">
            <div className="space-y-1">
              <CardTitle className="text-xl font-black font-lora flex items-center gap-2">
                <Music className="h-5 w-5 text-accent-foreground" /> Repertoire Impact
              </CardTitle>
              <CardDescription className="font-medium">Which songs drive the most bookings?</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[350px]">
              <div className="p-6 space-y-4">
                {insights.repertoireImpact?.map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{item.title}</span>
                        <span className="font-bold text-sm line-clamp-1">{item.song}</span>
                      </div>
                      <span className="text-sm font-black text-primary">{item.attendance} singers</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent transition-all duration-1000" 
                        style={{ width: `${(item.attendance / 125) * 100}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Summary */}
      <Card className="border-none shadow-xl bg-primary text-primary-foreground rounded-[2.5rem] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <CardContent className="p-10 flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="bg-white/20 p-6 rounded-[2rem] shadow-inner">
            <Brain className="h-12 w-12 text-accent" />
          </div>
          <div className="flex-1 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] opacity-70">Strategic Learning</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-xl font-black font-lora">Booking Momentum</p>
                <p className="text-sm opacity-80 leading-relaxed">
                  {insights.earlyBirds > insights.lastMinute 
                    ? "Your community plans ahead! You can afford to announce songs earlier to lock in those Early Birds." 
                    : "You have a high 'Last Minute' culture. Focus your heaviest marketing spend in the final 72 hours."}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-black font-lora">Retention Strategy</p>
                <p className="text-sm opacity-80 leading-relaxed">
                  {isGlobal 
                    ? `You have ${insights.returningPeople.length} loyal Legends. Consider a 'Legend-only' early access window for popular sessions.`
                    : `There are ${insights.churnRisk.length} regulars who haven't booked yet. A personal 'Miss you in the circle' email could close the gap.`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingInsights;