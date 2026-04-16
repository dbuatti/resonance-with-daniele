"use client";

import React, { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { format, parse, isValid } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

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
    if (!dateStr) return null;
    // Clean quotes and extra spaces, then normalize AM/PM to lowercase for consistency
    const cleanStr = dateStr.trim().replace(/^"|"$/g, "").toLowerCase();
    
    const formats = [
      "dd/MM/yyyy h:mm a",
      "d/MM/yyyy h:mm a",
      "dd/MM/yyyy hh:mm a",
      "d/M/yyyy hh:mm a",
      "dd/MM/yyyy HH:mm",
      "d/M/yyyy HH:mm",
      "yyyy-MM-dd HH:mm:ss",
      "MM/dd/yyyy h:mm a",
      "dd/MM/yyyy",
      "d/M/yyyy"
    ];

    for (const fmt of formats) {
      try {
        const parsed = parse(cleanStr, fmt, new Date());
        if (isValid(parsed)) return parsed.toISOString();
      } catch (e) {
        continue;
      }
    }

    const fallback = new Date(cleanStr);
    return isValid(fallback) ? fallback.toISOString() : null;
  };

  // Robust CSV/TSV line splitter that handles quotes and empty fields
  const splitLine = (line: string, delimiter: string) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        if (lines.length < 2) throw new Error("File is empty or invalid.");

        const firstLine = lines[0];
        const delimiter = firstLine.includes('\t') ? '\t' : ',';
        
        const headers = splitLine(firstLine, delimiter).map(h => h.replace(/^"|"$/g, "").trim().toLowerCase());
        
        const findIdx = (possibleNames: string[]) => 
          headers.findIndex(h => possibleNames.some(name => h === name.toLowerCase() || h.includes(name.toLowerCase())));

        const h = {
          id: findIdx(["order id"]),
          firstName: findIdx(["first name"]),
          lastName: findIdx(["last name"]),
          email: findIdx(["email"]),
          mobile: findIdx(["mobile"]),
          date: findIdx(["order date"]),
          tickets: findIdx(["valid tickets"]),
          sales: findIdx(["ticket sales"]),
          earnings: findIdx(["your earnings"]),
          discount: findIdx(["discount code"]),
          status: findIdx(["status"]),
          type: findIdx(["type"]),
        };

        if (h.id === -1 || h.date === -1) {
          throw new Error("Required columns (Order id, Order date) not found. Please ensure your file has the correct headers.");
        }

        const ordersToUpsert = lines.slice(1)
          .map((line, lineIdx) => {
            const values = splitLine(line, delimiter);
            
            const clean = (idx: number) => {
              const val = values[idx];
              return val?.replace(/^"|"$/g, "").trim() || "";
            };

            const orderId = clean(h.id);
            const orderDate = parseHumanitixDate(clean(h.date));

            if (!orderId || !orderDate) {
              console.warn(`[TicketSalesLogger] Skipping line ${lineIdx + 2}: Missing ID or Date`, { orderId, orderDate, rawDate: clean(h.date) });
              return null;
            }

            return {
              order_id: orderId,
              event_id: eventId,
              first_name: clean(h.firstName),
              last_name: clean(h.lastName),
              email: clean(h.email),
              mobile: clean(h.mobile),
              order_date: orderDate,
              valid_tickets: parseInt(clean(h.tickets)) || 0,
              ticket_sales: parseCurrency(clean(h.sales)),
              your_earnings: parseCurrency(clean(h.earnings)),
              discount_code: clean(h.discount),
              status: clean(h.status),
              order_type: h.type !== -1 ? clean(h.type) : null,
            };
          })
          .filter(o => o !== null);

        if (ordersToUpsert.length === 0) {
          throw new Error("No valid orders could be parsed. Please check that your file matches the expected format.");
        }

        const { error } = await supabase
          .from("event_orders")
          .upsert(ordersToUpsert, { onConflict: "order_id" });

        if (error) throw error;

        showSuccess(`Successfully imported ${ordersToUpsert.length} orders!`);
        queryClient.invalidateQueries({ queryKey: ["eventOrders", eventId] });
        queryClient.invalidateQueries({ queryKey: ["eventExpenses", eventId] });
      } catch (err: any) {
        console.error("Import error:", err);
        showError(err.message || "Failed to import file.");
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsText(file);
  }, [eventId, queryClient]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "text/tab-separated-values": [".tsv", ".txt"] },
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
            <CardDescription>Upload your Humanitix Order Report (CSV or TSV)</CardDescription>
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
                {isDragActive ? "Drop the file here" : "Drag & drop Humanitix file, or click to select"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Supports .csv, .tsv, and .txt</p>
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