"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Ticket, TrendingUp, Sparkles } from "lucide-react";

/** Same financial shape returned by the event workbench stats query. */
export interface EventFinancials {
  totalTickets: number;
  totalEarnings: number;
  totalExpenses: number;
}

interface BreakEvenIndicatorProps {
  financials: EventFinancials | null | undefined;
}

const BreakEvenIndicator: React.FC<BreakEvenIndicatorProps> = ({ financials }) => {
  const ticketsSold = financials?.totalTickets ?? 0;
  const earnings = financials?.totalEarnings ?? 0;
  const expenses = financials?.totalExpenses ?? 0;

  const hasCosts = expenses > 0;
  const surplus = earnings - expenses;
  const isProfitable = hasCosts ? surplus > 0 : earnings > 0;
  const isAtBreakEven = hasCosts && Math.abs(surplus) < 0.005;

  const pricePerTicket = ticketsSold > 0 ? earnings / ticketsSold : 0;
  const remainingToCover = Math.max(0, expenses - earnings);
  const ticketsToBreakEven = hasCosts ? Math.ceil(remainingToCover / Math.max(pricePerTicket, 0.0001)) : 0;
  const progressPct = hasCosts && ticketsToBreakEven > 0
    ? Math.min(100, Math.round((ticketsSold / (ticketsSold + ticketsToBreakEven)) * 100))
    : hasCosts
      ? 0
      : 100;

  const state: "free" | "profit" | "breakeven" | "needs" = !hasCosts
    ? "free"
    : isProfitable
      ? "profit"
      : isAtBreakEven
        ? "breakeven"
        : "needs";

  const tone =
    state === "profit"
      ? "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20"
      : state === "breakeven"
        ? "text-primary bg-primary/10 border-primary/20"
        : state === "free"
          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          : "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";

  const iconColor =
    state === "profit"
      ? "text-green-600 dark:text-green-400"
      : state === "breakeven"
        ? "text-primary"
        : state === "free"
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-amber-600 dark:text-amber-400";

  const cardBackground =
    state === "profit"
      ? "from-green-500/10 via-background to-green-500/5 border-green-500/20"
      : state === "breakeven"
        ? "from-primary/10 via-background to-primary/5 border-primary/20"
        : state === "free"
          ? "from-emerald-500/10 via-background to-emerald-500/5 border-emerald-500/20"
          : "from-amber-500/10 via-background to-amber-500/5 border-amber-500/20";

  return (
    <Card className={`rounded-[2.5rem] border shadow-sm bg-gradient-to-br ${cardBackground}`}>
      <CardHeader className="pb-2">
        <CardDescription className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
          {state === "profit" ? <TrendingUp className="h-3 w-3" /> : state === "free" ? <Sparkles className="h-3 w-3" /> : <Ticket className="h-3 w-3" />}
          Break-Even
        </CardDescription>
        <CardTitle className="text-4xl font-black font-lora flex items-center gap-3">
          <span className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-background/70">{state === "profit" ? <TrendingUp className="h-8 w-8" /> : <Ticket className="h-8 w-8" />}</span>
          {state === "profit" ? `$${Math.max(0, Math.round(surplus)).toFixed(0)}` : state === "free" ? `${ticketsSold}` : `${ticketsToBreakEven}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-6">
        <Badge variant="outline" className={`font-black rounded-full border-current/30 h-7 px-3 text-[10px] uppercase tracking-widest ${tone}`}>
          {state === "profit" ? "Past break-even" : state === "breakeven" ? "Break-even reached" : state === "free" ? "No costs logged" : "Ahead of break-even"}
        </Badge>
        <p className="text-sm font-medium text-muted-foreground leading-relaxed">
          {state === "profit" && (
            <>You've covered the ${expenses.toFixed(2)} in costs. You're banking <strong className="text-foreground">${surplus.toFixed(2)}</strong> from this session.</>
          )}
          {state === "needs" && (
            <>At roughly <strong className="text-foreground">${pricePerTicket.toFixed(2)}</strong>/ticket, you need <strong className="text-foreground">{ticketsToBreakEven}</strong> more ticket{ticketsToBreakEven === 1 ? "" : "s"} sold to break even — <strong className="text-foreground">${remainingToCover.toFixed(2)}</strong> of expenses remain uncovered.</>
          )}
          {state === "breakeven" && (
            <>Revenue exactly matched the ${expenses.toFixed(2)} in costs. No surplus — everything earned went straight back into the session.</>
          )}
          {state === "free" && (
            <>Nothing is owed yet — add expenses and the math will update the moment you have a ticket or two on the hook.</>
          )}
        </p>
        {state !== "profit" && (
          <div className="space-y-2">
            <Progress value={Math.round(progressPct)} className="h-3" />
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <span>{ticketsSold} sold</span>
              <span>{ticketsToBreakEven} to go</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BreakEvenIndicator;
