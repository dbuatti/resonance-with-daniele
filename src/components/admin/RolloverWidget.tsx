import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const RolloverWidget: React.FC = () => {
  const { data: financials, isLoading } = useQuery({
    queryKey: ["globalFinancials"],
    queryFn: async () => {
      const [ordersRes, expensesRes] = await Promise.all([
        supabase.from("event_orders").select("your_earnings"),
        supabase.from("event_expenses").select("amount")
      ]);

      const totalRevenue = ordersRes.data?.reduce((sum, o) => sum + Number(o.your_earnings || 0), 0) || 0;
      const totalExpenses = expensesRes.data?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;
      
      return {
        revenue: totalRevenue,
        expenses: totalExpenses,
        balance: totalRevenue - totalExpenses
      };
    }
  });

  if (isLoading) return <Skeleton className="h-24 w-full rounded-2xl" />;

  const isPositive = (financials?.balance || 0) >= 0;

  return (
    <Card className="border-none shadow-lg bg-primary/5 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Rollover Allowance
            </p>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black ${isPositive ? 'text-green-600' : 'text-destructive'}`}>
                ${financials?.balance.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-muted-foreground">Available</span>
            </div>
          </div>
          <div className="p-3 bg-background rounded-xl shadow-inner">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-primary/10">
          <div className="flex items-center gap-2">
            <DollarSign className="h-3 w-3 text-green-600" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Rev: ${financials?.revenue.toFixed(0)}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-destructive" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Exp: ${financials?.expenses.toFixed(0)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RolloverWidget;
