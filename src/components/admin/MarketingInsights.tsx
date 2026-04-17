"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Sparkles
} from "lucide-react";
import { differenceInDays, parseISO, startOfDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MarketingInsightsProps {
  eventId: string;
}

const MarketingInsights: React.FC<MarketingInsightsProps> = ({ eventId }) => {
  const isGlobal = eventId === "all";

  // 1. Fetch Event Details (if not global)
  const { data: event } = useQuery({
    queryKey: ["eventDetailsForInsights", eventId],
    queryFn: async () => {
      if (isGlobal) return null;
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();
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

  // 3. Fetch ALL orders ever (needed for both modes)
  const { data: allOrders } = useQuery({
    queryKey: ["allOrdersForRetention"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_orders")
        .select("email, first_name, last_name, event_id, order_date, valid_tickets, your_earnings, discount_code");
      if (error) throw error;
      return data || [];
    },
  });

  // 4. Fetch Expenses
  const { data: expenses } = useQuery({
    queryKey: ["eventExpensesForInsights", eventId],
    queryFn: async () => {
      let query = supabase.from("event_expenses").select("*");
      if (!isGlobal) query = query.eq("event_id", eventId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const insights = useMemo(() => {
    if (!orders || !allOrders || ( !isGlobal && !event)) return null;

    const totalTickets = orders.reduce((sum, o) => sum + (o.valid_tickets || 0), 0);
    const totalEarnings = orders.reduce((sum, o) => sum + Number(o.your_earnings || 0), 0);
    const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    // Retention & People Logic
    let retentionRate = 0;
    let returningPeople: any[] = [];
    let newPeople: any[] = [];

    if (isGlobal) {
      const peopleMap: Record<string, { name: string, events: Set<string> }> = {};
      allOrders.forEach(o => {
        if (!o.email) return;
        const email = o.email.toLowerCase().trim();
        if (!peopleMap[email]) {
          peopleMap[email] = { 
            name: `${o.first_name || ''} ${o.last_name || ''}`.trim() || email, 
            events: new Set() 
          };
        }
        peopleMap[email].events.add(o.event_id);
      });
      
      const uniqueEmails = Object.keys(peopleMap);
      returningPeople = uniqueEmails
        .filter(email => peopleMap[email].events.size > 1)
        .map(email => ({ email, name: peopleMap[email].name, count: peopleMap[email].events.size }))
        .sort((a, b) => b.count - a.count);
        
      newPeople = uniqueEmails
        .filter(email => peopleMap[email].events.size === 1)
        .map(email => ({ email, name: peopleMap[email].name }));

      retentionRate = uniqueEmails.length > 0 ? (returningPeople.length / uniqueEmails.length) * 100 : 0;
    } else {
      const currentAttendees = orders.map(o => ({
        email: o.email?.toLowerCase().trim(),
        name: `${o.first_name || ''} ${o.last_name || ''}`.trim() || o.email
      })).filter(p => p.email);

      const otherEventsOrders = allOrders.filter(o => o.event_id !== eventId);
      const previousEmails = new Set(otherEventsOrders.map(o => o.email?.toLowerCase().trim()).filter(Boolean));
      
      returningPeople = currentAttendees.filter(p => previousEmails.has(p.email!));
      newPeople = currentAttendees.filter(p => !previousEmails.has(p.email!));
      retentionRate = currentAttendees.length > 0 ? (returningPeople.length / currentAttendees.length) * 100 : 0;
    }

    // Booking Lead Time
    let avgLeadTime = 0;
    if (!isGlobal && event) {
      const eventDate = startOfDay(parseISO(event.date));
      const leadTimes = orders.map(o => {
        const orderDate = startOfDay(parseISO(o.order_date));
        return differenceInDays(eventDate, orderDate);
      });
      avgLeadTime = leadTimes.length > 0 ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length : 0;
    }

    // Financial Efficiency
    const costPerHead = totalTickets > 0 ? totalExpenses / totalTickets : 0;
    const revenuePerHead = totalTickets > 0 ? totalEarnings / totalTickets : 0;
    const suggestedPrice = Math.ceil(costPerHead + 20);

    // Discount Impact
    const discountedOrders = orders.filter(o => o.discount_code && o.discount_code !== "");
    const discountUsageRate = orders.length > 0 ? (discountedOrders.length / orders.length) * 100 : 0;

    return {
      totalTickets,
      totalEarnings,
      totalExpenses,
      returningPeople,
      newPeople,
      retentionRate,
      avgLeadTime,
      costPerHead,
      revenuePerHead,
      suggestedPrice,
      discountUsageRate,
      discountedCount: discountedOrders.length
    };
  }, [orders, event, allOrders, expenses, eventId, isGlobal]);

  if (loadingOrders) return <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>;
  if (!insights) return null;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Retention Card */}
        <Card className="border-none shadow-lg bg-card rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <UserCheck className="h-3.5 w-3.5 text-primary" /> 
                {isGlobal ? "Community Stickiness" : "Community Loyalty"}
              </CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-4 rounded-xl">
                    <p className="text-xs leading-relaxed">
                      <strong>Legends</strong>: People who have attended at least one other session.<br/><br/>
                      <strong>New</strong>: People whose email address has never appeared in your Humanitix imports before.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="text-3xl font-black">{insights.retentionRate.toFixed(0)}%</div>
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-none font-bold">
                {isGlobal ? "Loyal Base" : "Returning"}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
              <div className="flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-primary" /> 
                {insights.returningPeople.length} Legends
              </div>
              <div className="flex items-center gap-1">
                <UserPlus className="h-3 w-3 text-blue-500" /> 
                {insights.newPeople.length} New
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Strategy Card */}
        <Card className="border-none shadow-lg bg-card rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-primary" /> Pricing Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="text-3xl font-black">${insights.suggestedPrice}</div>
              <Badge variant="secondary" className="bg-accent/10 text-accent-foreground border-none font-bold">
                Suggested
              </Badge>
            </div>
            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
              Based on your current expenses, this price maintains a healthy $20 profit margin per singer.
            </p>
          </CardContent>
        </Card>

        {/* Efficiency Card */}
        <Card className="border-none shadow-lg bg-card rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-primary" /> {isGlobal ? "Lifetime Efficiency" : "Cost Efficiency"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="text-3xl font-black">${insights.costPerHead.toFixed(2)}</div>
              <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 border-none font-bold">
                Per Head
              </Badge>
            </div>
            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
              {isGlobal 
                ? "Your historical average cost to host one singer."
                : `It costs you $${insights.costPerHead.toFixed(2)} in expenses for every singer in the room.`}
            </p>
          </CardContent>
        </Card>

        {/* Discount Card */}
        <Card className="border-none shadow-lg bg-card rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Percent className="h-3.5 w-3.5 text-primary" /> {isGlobal ? "Lifetime Discounts" : "Discount Impact"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="text-3xl font-black">{insights.discountUsageRate.toFixed(0)}%</div>
              <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-none font-bold">
                Usage
              </Badge>
            </div>
            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
              {isGlobal 
                ? "Percentage of all historical orders that used a promo code."
                : `${insights.discountedCount} orders used a promo code for this event.`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Community Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-card">
          <CardHeader className="bg-primary/5 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-black font-lora flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" /> 
                  {isGlobal ? "Top Legends" : "Returning Legends"}
                </CardTitle>
                <CardDescription className="font-medium">
                  {isGlobal ? "Members who have attended multiple sessions." : "People at this session who have joined us before."}
                </CardDescription>
              </div>
              <Badge className="bg-primary text-primary-foreground font-black">{insights.returningPeople.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <div className="p-6 space-y-3">
                {insights.returningPeople.length > 0 ? (
                  insights.returningPeople.map((person, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Heart className="h-4 w-4 text-primary fill-current" />
                        </div>
                        <span className="font-bold text-sm">{person.name}</span>
                      </div>
                      {isGlobal && (
                        <Badge variant="outline" className="text-[10px] font-black border-primary/20 text-primary">
                          {person.count} Sessions
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center py-12 text-muted-foreground italic text-sm">No returning members identified yet.</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-card">
          <CardHeader className="bg-blue-500/5 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-black font-lora flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-blue-500" /> 
                  {isGlobal ? "One-Time Visitors" : "New Faces"}
                </CardTitle>
                <CardDescription className="font-medium">
                  {isGlobal ? "People who have only attended one session so far." : "People joining the circle for the very first time!"}
                </CardDescription>
              </div>
              <Badge className="bg-blue-500 text-white font-black">{insights.newPeople.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <div className="p-6 space-y-3">
                {insights.newPeople.length > 0 ? (
                  insights.newPeople.map((person, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                      <div className="bg-blue-500/10 p-2 rounded-lg">
                        <Sparkles className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="font-bold text-sm">{person.name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-12 text-muted-foreground italic text-sm">No new members identified yet.</p>
                )}
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
            <Zap className="h-12 w-12 text-accent" />
          </div>
          <div className="flex-1 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] opacity-70">
              {isGlobal ? "Lifetime Strategic Learning" : "Strategic Learning"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-xl font-black font-lora">Revenue vs. Cost</p>
                <p className="text-sm opacity-80 leading-relaxed">
                  Your average revenue per head is <span className="font-bold text-accent">${insights.revenuePerHead.toFixed(2)}</span>. 
                  After expenses, you are making <span className="font-bold text-accent">${(insights.revenuePerHead - insights.costPerHead).toFixed(2)}</span> profit per attendee.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-black font-lora">Growth Opportunity</p>
                <p className="text-sm opacity-80 leading-relaxed">
                  {insights.retentionRate > 50 
                    ? "You have a very loyal core community! Focus on 'Bring a Friend' incentives to reach new people." 
                    : "You're attracting a lot of new faces. Focus on post-event follow-ups to turn them into regulars."}
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