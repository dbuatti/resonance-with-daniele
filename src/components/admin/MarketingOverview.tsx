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
        .select("amount")
        .eq("event_id", eventId);
      if (error) throw error;
      return data;
    },
  });

  const { data: sales, isLoading: loadingSales } = useQuery({
    queryKey: ["ticketSales", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_ticket_sales")
        .select("*")
        .eq("event_id", eventId)
        .order("recorded_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0];
    },
  });

  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const totalRevenue = Number(sales?.revenue || 0);
  const netProfit = totalRevenue - totalExpenses;
  const ticketsSold = sales?.tickets_sold || 0;

  if (loadingExpenses || loadingSales) return <Skeleton className="h-64 w-full" />;

  const metrics = [
    { title: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: <DollarSign className="h-5 w-5" />, color: "text-green-600" },
    { title: "Total Expenses", value: `$${totalExpenses.toFixed(2)}`, icon: <TrendingUp className="h-5 w-5" />, color: "text-red-600" },
    { title: "Net Profit/Loss", value: `$${netProfit.toFixed(2)}`, icon: <Zap className="h-5 w-5" />, color: netProfit >= 0 ? "text-primary" : "text-destructive" },
    { title: "Tickets Sold", value: ticketsSold, icon: <Ticket className="h-5 w-5" />, color: "text-blue-600" },
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