"use client";

import React, { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { format, parse } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface TicketSalesLoggerProps {
  eventId: string;
}

const TicketSalesLogger: React.FC<TicketSalesLoggerProps> = ({ eventId }) => {
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["eventOrders", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_orders")
        .select("*")
        .eq("event_id", eventId)
        .order("order_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const parseCurrency = (val: string) => {
    if (!val) return 0;
    return parseFloat(val.replace(/[$,]/g, ""));
  };

  const parseHumanitixDate = (dateStr: string) => {
    try {
      // Format: 08/03/2026 6:45 pm
      return parse(dateStr, "dd/MM/yyyy h:mm a", new Date()).toISOString();
    } catch (e) {
      console.error("Date parsing error:", dateStr, e);
      return new Date().toISOString();
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/);
      const headers = lines[0].split(",");
      
      // Map headers to indices
      const h = {
        id: headers.indexOf("Order id"),
        firstName: headers.indexOf("First name"),
        lastName: headers.indexOf("Last name"),
        email: headers.indexOf("Email"),
        mobile: headers.indexOf("Mobile"),
        date: headers.indexOf("Order date"),
        tickets: headers.indexOf("Valid tickets"),
        sales: headers.indexOf("Ticket sales"),
        earnings: headers.indexOf("Your earnings"),
        discount: headers.indexOf("Discount code used"),
        status: headers.indexOf("Status"),
      };

      const ordersToUpsert = lines.slice(1)
        .filter(line => line.trim() !== "")
        .map(line => {
          // Handle commas inside quotes (standard CSV behavior)
          const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
          const clean = (val: string) => val?.replace(/^"|"$/g, "").trim();

          return {
            order_id: clean(values[h.id]),
            event_id: eventId,
            first_name: clean(values[h.firstName]),
            last_name: clean(values[h.lastName]),
            email: clean(values[h.email]),
            mobile: clean(values[h.mobile]),
            order_date: parseHumanitixDate(clean(values[h.date])),
            valid_tickets: parseInt(clean(values[h.tickets])) || 0,
            ticket_sales: parseCurrency(clean(values[h.sales])),
            your_earnings: parseCurrency(clean(values[h.earnings])),
            discount_code: clean(values[h.discount]),
            status: clean(values[h.status]),
          };
        })
        .filter(o => o.order_id); // Remove empty rows

      try {
        const { error } = await supabase
          .from("event_orders")
          .upsert(ordersToUpsert, { onConflict: "order_id" });

        if (error) throw error;

        showSuccess(`Successfully imported ${ordersToUpsert.length} orders!`);
        queryClient.invalidateQueries({ queryKey: ["eventOrders", eventId] });
        queryClient.invalidateQueries({ queryKey: ["eventExpenses", eventId] });
      } catch (err: any) {
        console.error("Import error:", err);
        showError("Failed to import CSV: " + err.message);
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsText(file);
  }, [eventId, queryClient]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: false,
  });

  const totalTickets = orders?.reduce((sum, o) => sum + (o.valid_tickets || 0), 0) || 0;
  const totalEarnings = orders?.reduce((sum, o) => sum + Number(o.your_earnings || 0), 0) || 0;
  const targetTickets = 125;
  const progress = (totalTickets / targetTickets) * 100;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 shadow-lg border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" /> Import Orders
            </CardTitle>
            <CardDescription>Upload your Humanitix Order Report CSV</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50",
                isImporting && "opacity-50 pointer-events-none"
              )}
            >
              <input {...getInputProps()} />
              {isImporting ? (
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
              ) : (
                <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              )}
              <p className="text-sm font-medium">
                {isDragActive ? "Drop the CSV here" : "Drag & drop Humanitix CSV, or click to select"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Only .csv files are supported</p>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg border-none bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Live Sales Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="text-4xl font-bold">
                  {totalTickets} <span className="text-lg text-muted-foreground font-normal">/ {targetTickets} tickets</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-600">${totalEarnings.toFixed(2)}</p>
                </div>
              </div>
              <Progress value={progress} className="h-3" />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-lg border-none overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle>Order History</CardTitle>
          <CardDescription>Showing {orders?.length || 0} individual orders</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Tickets</TableHead>
                  <TableHead className="text-right pr-6">Earnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></TableCell></TableRow>
                ) : orders?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No orders imported yet.</TableCell></TableRow>
                ) : (
                  orders?.map((order) => (
                    <TableRow key={order.order_id}>
                      <TableCell className="pl-6 font-mono text-xs">{order.order_id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{order.first_name} {order.last_name}</span>
                          <span className="text-xs text-muted-foreground">{order.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(order.order_date), "MMM d, h:mm a")}
                      </TableCell>
                      <TableCell className="text-center font-bold">{order.valid_tickets}</TableCell>
                      <TableCell className="text-right pr-6 font-bold text-green-600">
                        ${Number(order.your_earnings).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketSalesLogger;