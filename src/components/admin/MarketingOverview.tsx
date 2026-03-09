"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Ticket, TrendingUp, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MarketingOverviewProps {
  eventId: string;
}

const MarketingOverview: React.FC<MarketingOverviewProps> = ({ eventId }) => {
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
        .eq("event_id", eventId);
      if (error) throw error;
      return data || [];
    },
  });

  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const totalEarnings = orders?.reduce((sum, o) => sum + Number(o.your_earnings || 0), 0) || 0;
  const totalTickets = orders?.reduce((sum, o) => sum + (o.valid_tickets || 0), 0) || 0;
  const netProfit = totalEarnings - totalExpenses;

  if (loadingExpenses || loadingOrders) return <Skeleton className="h-64 w-full" />;

  const metrics = [
    { title: "Total Earnings", value: `$${totalEarnings.toFixed(2)}`, icon: <DollarSign className="h-5 w-5" />, color: "text-green-600" },
    { title: "Total Expenses", value: `$${totalExpenses.toFixed(2)}`, icon: <TrendingUp className="h-5 w-5" />, color: "text-red-600" },
    { title: "Net Profit/Loss", value: `$${netProfit.toFixed(2)}`, icon: <Zap className="h-5 w-5" />, color: netProfit >= 0 ? "text-primary" : "text-destructive" },
    { title: "Tickets Sold", value: totalTickets, icon: <Ticket className="h-5 w-5" />, color: "text-blue-600" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((m, i) => (
        <Card key={i} className="shadow-lg border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{m.title}</CardTitle>
            <div className={m.color}>{m.icon}</div>
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", m.color)}>{m.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MarketingOverview;