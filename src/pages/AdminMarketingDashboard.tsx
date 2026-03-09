"use client";

import React, { useState } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, DollarSign, Ticket, Zap, ArrowLeft } from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import ExpenseLogger from "@/components/admin/ExpenseLogger";
import TicketSalesLogger from "@/components/admin/TicketSalesLogger";
import FlashSaleManager from "@/components/admin/FlashSaleManager";
import MarketingOverview from "@/components/admin/MarketingOverview";

const AdminMarketingDashboard: React.FC = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (!user?.is_admin) {
    navigate("/");
    return null;
  }

  return (
    <div className="space-y-8 py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4">
        <BackButton className="mb-6" to="/admin" />
        
        <header className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold font-lora">Marketing & Finance Hub</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track your event's financial health and manage the "Resonance Flash Sale" momentum.
          </p>
        </header>

        <Tabs defaultValue="overview" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-2xl grid-cols-4 rounded-xl">
              <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
              <TabsTrigger value="tickets" className="rounded-lg">Tickets</TabsTrigger>
              <TabsTrigger value="expenses" className="rounded-lg">Expenses</TabsTrigger>
              <TabsTrigger value="promos" className="rounded-lg">Promos</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <MarketingOverview />
          </TabsContent>

          <TabsContent value="tickets">
            <TicketSalesLogger />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpenseLogger />
          </TabsContent>

          <TabsContent value="promos">
            <FlashSaleManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminMarketingDashboard;