"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Ticket, TrendingUp } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

const ticketSchema = z.object({
  tickets_sold: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Must be a number"),
  revenue: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Must be a number"),
});

type TicketFormData = z.infer<typeof ticketSchema>;

const TicketSalesLogger: React.FC = () => {
  const queryClient = useQueryClient();
  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { tickets_sold: "", revenue: "" },
  });

  const { data: sales, isLoading } = useQuery({
    queryKey: ["ticketSales"],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_ticket_sales").select("*").order("recorded_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (data: TicketFormData) => {
    const { error } = await supabase.from("event_ticket_sales").insert({
      tickets_sold: parseInt(data.tickets_sold),
      revenue: parseFloat(data.revenue),
    });

    if (error) showError("Failed to log sales.");
    else {
      showSuccess("Sales updated!");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["ticketSales"] });
    }
  };

  const latestSale = sales?.[0];
  const targetTickets = 125;
  const progress = latestSale ? (latestSale.tickets_sold / targetTickets) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1 shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Update Sales
          </CardTitle>
          <CardDescription>Log current Humanitix numbers</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="tickets_sold" render={({ field }) => (
                <FormItem><FormLabel>Total Tickets Sold</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="revenue" render={({ field }) => (
                <FormItem><FormLabel>Total Revenue ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Log Snapshot"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="lg:col-span-2 space-y-6">
        <Card className="shadow-lg border-none bg-primary/5">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Sales Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="text-4xl font-bold">{latestSale?.tickets_sold || 0} <span className="text-lg text-muted-foreground font-normal">/ {targetTickets}</span></div>
              <div className="text-right">
                <p className="text-xs font-bold text-muted-foreground uppercase">Revenue</p>
                <p className="text-2xl font-bold text-green-600">${Number(latestSale?.revenue || 0).toFixed(2)}</p>
              </div>
            </div>
            <Progress value={progress} className="h-3" />
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle>Sales History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Tickets</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales?.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs">{format(new Date(s.recorded_at), "MMM d, h:mm a")}</TableCell>
                    <TableCell className="text-center font-bold">{s.tickets_sold}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">${Number(s.revenue).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TicketSalesLogger;