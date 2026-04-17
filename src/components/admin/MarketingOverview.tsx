"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Ticket, TrendingUp, Zap, ChartLine } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format, parseISO, startOfDay, addDays, startOfToday, isBefore, isEqual } from "date-fns";

interface MarketingOverviewProps {
  eventId: string;
}

const MarketingOverview: React.FC<MarketingOverviewProps> = ({ eventId }) => {
  // Fetch event details to get the event date
  const { data: event } = useQuery({
    queryKey: ["eventDetailsForChart", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("date")
        .eq("id", eventId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: expenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ["eventExpenses", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_expenses")
        .select("*")
        .eq("event_id", eventId);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ["eventOrders", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_orders")
        .select("*")
        .eq("event_id", eventId)
        .order("order_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const totalEarnings = orders?.reduce((sum, o) => sum + Number(o.your_earnings || 0), 0) || 0;
  const totalTickets = orders?.reduce((sum, o) => sum + (o.valid_tickets || 0), 0) || 0;
  const netProfit = totalEarnings - totalExpenses;

  // Process chart data: Daily ticket sales with zero-filling
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    // 1. Group tickets by day
    const salesByDay: Record<string, number> = {};
    let minDate = new Date();
    
    orders.forEach(order => {
      const date = parseISO(order.order_date);
      const dateKey = format(date, "yyyy-MM-dd");
      salesByDay[dateKey] = (salesByDay[dateKey] || 0) + (order.valid_tickets || 0);
      
      if (date < minDate) minDate = date;
    });

    // 2. Determine the end date for the chart
    const today = startOfToday();
    const eventDate = event?.date ? startOfDay(parseISO(event.date)) : today;
    
    // If the event is in the past, stop at the event date.
    // If the event is in the future, stop at today.
    const maxDate = isBefore(eventDate, today) ? eventDate : today;

    // 3. Fill in the gaps from first sale to maxDate
    const data = [];
    let current = startOfDay(minDate);
    const end = startOfDay(maxDate);

    while (isBefore(current, end) || isEqual(current, end)) {
      const dateKey = format(current, "yyyy-MM-dd");
      data.push({
        displayDate: format(current, "MMM d"),
        fullDate: format(current, "EEEE, MMMM do"),
        tickets: salesByDay[dateKey] || 0,
      });
      current = addDays(current, 1);
    }

    return data;
  }, [orders, event]);

  if (loadingExpenses || loadingOrders) return <Skeleton className="h-64 w-full rounded-2xl" />;

  const metrics = [
    { title: "Total Earnings", value: `$${totalEarnings.toFixed(2)}`, icon: <DollarSign className="h-5 w-5" />, color: "text-green-600" },
    { title: "Total Expenses", value: `$${totalExpenses.toFixed(2)}`, icon: <TrendingUp className="h-5 w-5" />, color: "text-red-600" },
    { title: "Net Profit/Loss", value: `$${netProfit.toFixed(2)}`, icon: <Zap className="h-5 w-5" />, color: netProfit >= 0 ? "text-primary" : "text-destructive" },
    { title: "Tickets Sold", value: totalTickets, icon: <Ticket className="h-5 w-5" />, color: "text-blue-600" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <Card key={i} className="shadow-lg border-none rounded-2xl hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{m.title}</CardTitle>
              <div className={cn("p-2 rounded-lg bg-muted/50", m.color)}>{m.icon}</div>
            </CardHeader>
            <CardContent>
              <div className={cn("text-3xl font-black", m.color)}>{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-xl border-none rounded-[2.5rem] overflow-hidden bg-card">
        <CardHeader className="p-8 pb-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ChartLine className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black font-lora">Daily Sales Momentum</CardTitle>
              <CardDescription className="font-medium">Tracking daily ticket volume to identify peaks and troughs.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="h-[350px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis 
                    dataKey="displayDate" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fontWeight: 'bold', fill: 'hsl(var(--muted-foreground))' }}
                    dy={10}
                    minTickGap={30}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fontWeight: 'bold', fill: 'hsl(var(--muted-foreground))' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                      padding: '12px'
                    }}
                    labelStyle={{ fontWeight: 'black', marginBottom: '4px' }}
                    labelFormatter={(value, payload) => payload[0]?.payload?.fullDate || value}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tickets" 
                    name="Tickets Sold"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorTickets)" 
                    dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center bg-muted/20 rounded-[2rem] border-4 border-dashed border-border/50">
                <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-lg font-bold text-muted-foreground font-lora">No sales data to visualize yet.</p>
                <p className="text-sm text-muted-foreground">Import your Humanitix file in the Tickets tab.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingOverview;