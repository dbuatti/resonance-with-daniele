"use client";

import React, { useState } from "react";
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
import { Loader2, Ticket, TrendingUp, ClipboardPaste, Sparkles, Info } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { format, isValid } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const ticketSchema = z.object({
  tickets_sold: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Must be a number"),
  revenue: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Must be a number"),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface TicketSalesLoggerProps {
  eventId: string;
}

const TicketSalesLogger: React.FC<TicketSalesLoggerProps> = ({ eventId }) => {
  const queryClient = useQueryClient();
  const [isPasteDialogOpen, setIsPasteDialogOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [currentBreakdown, setCurrentBreakdown] = useState<any[] | null>(null);
  
  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { tickets_sold: "", revenue: "" },
  });

  const { data: sales, isLoading } = useQuery({
    queryKey: ["eventTicketSales", eventId], // Updated key
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_ticket_sales")
        .select("*")
        .eq("event_id", eventId)
        .order("recorded_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleSmartPaste = () => {
    // 1. Extract Totals
    const soldMatch = pasteText.match(/Tickets sold\s*(\d+)/i);
    const revenueMatch = pasteText.match(/(?:Total earnings|Your earnings:)\s*\$([\d,.]+)/i);

    // 2. Extract Breakdown
    const breakdown: any[] = [];
    const lines = pasteText.split('\n');
    let inBreakdownSection = false;

    for (const line of lines) {
      if (line.includes("Earnings by ticket type")) {
        inBreakdownSection = true;
        continue;
      }
      if (inBreakdownSection && line.includes('$')) {
        // Match: Type Name [Tab/Space] $Amount [Tab/Space] Sold/Total
        const match = line.match(/^(.+?)\s+\$([\d,.]+)\s+(\d+)\/\d+/);
        if (match) {
          breakdown.push({
            type: match[1].trim(),
            earnings: parseFloat(match[2].replace(/,/g, '')),
            sold: parseInt(match[3])
          });
        }
      }
    }

    if (soldMatch && revenueMatch) {
      const sold = soldMatch[1];
      const revenue = revenueMatch[1].replace(/,/g, '');
      
      form.setValue("tickets_sold", sold);
      form.setValue("revenue", revenue);
      setCurrentBreakdown(breakdown.length > 0 ? breakdown : null);
      
      showSuccess(`Extracted ${sold} tickets and ${breakdown.length} ticket types!`);
      setIsPasteDialogOpen(false);
      setPasteText("");
    } else {
      showError("Could not find ticket or revenue data. Please check the format.");
    }
  };

  const onSubmit = async (data: TicketFormData) => {
    const { error } = await supabase.from("event_ticket_sales").insert({
      event_id: eventId,
      tickets_sold: parseInt(data.tickets_sold),
      revenue: parseFloat(data.revenue),
      breakdown: currentBreakdown // Save the parsed breakdown
    });

    if (error) showError("Failed to log sales.");
    else {
      showSuccess("Sales snapshot recorded!");
      form.reset();
      setCurrentBreakdown(null);
      queryClient.invalidateQueries({ queryKey: ["eventTicketSales", eventId] });
    }
  };

  const latestSale = sales?.[0];
  const targetTickets = 125;
  const progress = latestSale ? (latestSale.tickets_sold / targetTickets) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1 shadow-lg border-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Update Sales
            </CardTitle>
            
            <Dialog open={isPasteDialogOpen} onOpenChange={setIsPasteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs font-bold border-primary/30 text-primary hover:bg-primary/5">
                  <Sparkles className="h-3 w-3" /> Smart Paste
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Paste from Humanitix</DialogTitle>
                  <CardDescription>
                    Copy the dashboard summary from Humanitix and paste it here. We'll extract the totals and the ticket type breakdown.
                  </CardDescription>
                </DialogHeader>
                <div className="py-4">
                  <Textarea 
                    placeholder="Paste Humanitix text here..." 
                    className="min-h-[200px] font-mono text-xs"
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsPasteDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSmartPaste} disabled={!pasteText.trim()}>
                    <ClipboardPaste className="mr-2 h-4 w-4" /> Extract Data
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
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
              
              {currentBreakdown && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Breakdown Preview</p>
                  {currentBreakdown.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="font-medium">{item.type}</span>
                      <span className="text-muted-foreground">{item.sold} sold (${item.earnings.toFixed(2)})</span>
                    </div>
                  ))}
                </div>
              )}

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
                <p className="text-xs font-bold text-muted-foreground uppercase">Net Revenue</p>
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
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales?.map((s) => {
                  const date = new Date(s.recorded_at);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs">
                        {isValid(date) ? format(date, "MMM d, h:mm a") : "N/A"}
                      </TableCell>
                      <TableCell className="text-center font-bold">{s.tickets_sold}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">${Number(s.revenue).toFixed(2)}</TableCell>
                      <TableCell>
                        {s.breakdown && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="w-64 p-3">
                                <div className="space-y-2">
                                  <p className="text-xs font-bold uppercase tracking-widest border-b pb-1">Ticket Breakdown</p>
                                  {s.breakdown.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between text-[11px]">
                                      <span>{item.type}</span>
                                      <span className="font-mono">{item.sold} sold (${item.earnings.toFixed(2)})</span>
                                    </div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TicketSalesLogger;