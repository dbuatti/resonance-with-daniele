"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, DollarSign, Ticket, Zap, Calendar, Target, Lightbulb } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackButton from "@/components/ui/BackButton";
import ExpenseLogger from "@/components/admin/ExpenseLogger";
import TicketSalesLogger from "@/components/admin/TicketSalesLogger";
import FlashSaleManager from "@/components/admin/FlashSaleManager";
import MarketingOverview from "@/components/admin/MarketingOverview";
import MarketingInsights from "@/components/admin/MarketingInsights";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const AdminMarketingDashboard: React.FC = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Fetch all events to populate the selector
  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ["allEventsForMarketing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, date")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Set the most recent event as default
  useEffect(() => {
    if (events && events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  if (loading || loadingEvents) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (!user?.is_admin) {
    navigate("/");
    return null;
  }

  return (
    <div className="space-y-8 py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4">
        <BackButton className="mb-6" to="/admin" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <header className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold font-lora">Marketing & Finance Hub</h1>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-mono">
                Ads ID: 775-287-8796
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground">
              Track financial health and manage promotions for your events.
            </p>
          </header>

          <div className="w-full md:w-72 space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Event</label>
            <Select value={selectedEventId || ""} onValueChange={setSelectedEventId}>
              <SelectTrigger className="h-12 rounded-xl shadow-sm">
                <SelectValue placeholder="Choose an event..." />
              </SelectTrigger>
              <SelectContent>
                {events?.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title} ({format(new Date(event.date), "MMM d, yyyy")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!selectedEventId ? (
          <Card className="p-12 text-center border-dashed border-2">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">Please select an event to view its marketing data.</p>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="space-y-8">
            <div className="flex justify-center">
              <TabsList className="grid w-full max-w-3xl grid-cols-5 rounded-xl">
                <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
                <TabsTrigger value="tickets" className="rounded-lg">Tickets</TabsTrigger>
                <TabsTrigger value="expenses" className="rounded-lg">Expenses</TabsTrigger>
                <TabsTrigger value="promos" className="rounded-lg">Promos</TabsTrigger>
                <TabsTrigger value="insights" className="rounded-lg flex items-center gap-2">
                  <Lightbulb className="h-3.5 w-3.5" /> Insights
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview">
              <MarketingOverview eventId={selectedEventId} />
            </TabsContent>

            <TabsContent value="tickets">
              <TicketSalesLogger eventId={selectedEventId} />
            </TabsContent>

            <TabsContent value="expenses">
              <ExpenseLogger eventId={selectedEventId} />
            </TabsContent>

            <TabsContent value="promos">
              <FlashSaleManager eventId={selectedEventId} />
            </TabsContent>

            <TabsContent value="insights">
              <MarketingInsights eventId={selectedEventId} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default AdminMarketingDashboard;