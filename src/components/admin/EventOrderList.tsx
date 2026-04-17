"use client";

import React, { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Upload, FileSpreadsheet, UserCheck, Search } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { format, parse, isValid } from "date-fns";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface EventOrderListProps {
  eventId: string;
}

const EventOrderList: React.FC<EventOrderListProps> = ({ eventId }) => {
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: orders, isLoading: loadingOrders } = useQuery({
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

  const { data: profiles } = useQuery({
    queryKey: ["allProfilesForMatching"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("email, avatar_url, first_name, last_name");
      if (error) throw error;
      return data || [];
    }
  });

  const profileMap = useMemo(() => {
    const map: Record<string, any> = {};
    profiles?.forEach(p => {
      if (p.email) map[p.email.toLowerCase().trim()] = p;
    });
    return map;
  }, [profiles]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (!searchTerm) return orders;
    const s = searchTerm.toLowerCase();
    return orders.filter(o => 
      o.first_name?.toLowerCase().includes(s) || 
      o.last_name?.toLowerCase().includes(s) || 
      o.email?.toLowerCase().includes(s)
    );
  }, [orders, searchTerm]);

  const parseCurrency = (val: string) => {
    if (!val) return 0;
    return parseFloat(val.replace(/[$,]/g, ""));
  };

  const parseHumanitixDate = (dateStr: string) => {
    if (!dateStr) return null;
    const cleanStr = dateStr.trim().replace(/^"|"$/g, "").toLowerCase();
    const formats = ["dd/MM/yyyy h:mm a", "d/MM/yyyy h:mm a", "dd/MM/yyyy hh:mm a", "d/M/yyyy hh:mm a", "dd/MM/yyyy HH:mm", "d/M/yyyy HH:mm", "yyyy-MM-dd HH:mm:ss", "MM/dd/yyyy h:mm a", "dd/MM/yyyy", "d/M/yyyy"];
    for (const fmt of formats) {
      try {
        const parsed = parse(cleanStr, fmt, new Date());
        if (isValid(parsed)) return parsed.toISOString();
      } catch (e) { continue; }
    }
    const fallback = new Date(cleanStr);
    return isValid(fallback) ? fallback.toISOString() : null;
  };

  const splitLine = (line: string, delimiter: string) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === delimiter && !inQuotes) { result.push(current.trim()); current = ""; }
      else current += char;
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
        const findIdx = (possibleNames: string[]) => headers.findIndex(h => possibleNames.some(name => h === name.toLowerCase() || h.includes(name.toLowerCase())));
        const h = { id: findIdx(["order id"]), firstName: findIdx(["first name"]), lastName: findIdx(["last name"]), email: findIdx(["email"]), mobile: findIdx(["mobile"]), date: findIdx(["order date"]), tickets: findIdx(["valid tickets"]), sales: findIdx(["ticket sales"]), earnings: findIdx(["your earnings"]), discount: findIdx(["discount code"]), status: findIdx(["status"]), type: findIdx(["type"]) };
        if (h.id === -1 || h.date === -1) throw new Error("Required columns not found.");
        const ordersToUpsert = lines.slice(1).map((line) => {
          const values = splitLine(line, delimiter);
          const clean = (idx: number) => values[idx]?.replace(/^"|"$/g, "").trim() || "";
          const orderId = clean(h.id);
          const orderDate = parseHumanitixDate(clean(h.date));
          if (!orderId || !orderDate) return null;
          return { order_id: orderId, event_id: eventId, first_name: clean(h.firstName), last_name: clean(h.lastName), email: clean(h.email), mobile: clean(h.mobile), order_date: orderDate, valid_tickets: parseInt(clean(h.tickets)) || 0, ticket_sales: parseCurrency(clean(h.sales)), your_earnings: parseCurrency(clean(h.earnings)), discount_code: clean(h.discount), status: clean(h.status), order_type: h.type !== -1 ? clean(h.type) : null };
        }).filter(o => o !== null);
        if (ordersToUpsert.length === 0) throw new Error("No valid orders parsed.");
        const { error } = await supabase.from("event_orders").upsert(ordersToUpsert, { onConflict: "order_id" });
        if (error) throw error;
        showSuccess(`Successfully imported ${ordersToUpsert.length} orders!`);
        queryClient.invalidateQueries({ queryKey: ["eventOrders", eventId] });
      } catch (err: any) { showError(err.message || "Failed to import file."); } finally { setIsImporting(false); }
    };
    reader.readAsText(file);
  }, [eventId, queryClient]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "text/csv": [".csv"], "text/tab-separated-values": [".tsv", ".txt"] }, multiple: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search attendees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 rounded-xl font-bold bg-muted/30 border-none focus-visible:ring-primary"
          />
        </div>
        <div {...getRootProps()} className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed cursor-pointer transition-all text-sm font-bold",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50",
          isImporting && "opacity-50 pointer-events-none"
        )}>
          <input {...getInputProps()} />
          {isImporting ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
          <span>{isDragActive ? "Drop CSV here" : "Import Humanitix CSV"}</span>
        </div>
      </div>

      <Card className="shadow-lg border-none overflow-hidden rounded-2xl">
        <CardHeader className="bg-muted/30 border-b py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black font-lora">Attendee List</CardTitle>
              <CardDescription className="text-xs font-medium">Showing {filteredOrders.length} of {orders?.length || 0} total orders</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/50">
                  <TableHead className="pl-6 text-[10px] font-black uppercase tracking-widest">Customer</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Order Date</TableHead>
                  <TableHead className="text-center text-[10px] font-black uppercase tracking-widest">Tickets</TableHead>
                  <TableHead className="text-right pr-6 text-[10px] font-black uppercase tracking-widest">Earnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingOrders ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground font-medium">No orders found.</TableCell></TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const member = order.email ? profileMap[order.email.toLowerCase().trim()] : null;
                    return (
                      <TableRow key={order.order_id} className="border-b border-border/30 last:border-0">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                              <AvatarImage src={member?.avatar_url || ""} />
                              <AvatarFallback className="text-[10px] font-black bg-primary/10 text-primary">{(order.first_name || "U")[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-sm">{order.first_name} {order.last_name}</span>
                                {member && (
                                  <Badge variant="secondary" className="h-4 px-1.5 text-[8px] font-black uppercase tracking-widest bg-primary/10 text-primary border-none">
                                    <UserCheck className="h-2 w-2 mr-1" /> Member
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground font-mono">{order.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-muted-foreground">
                          {format(new Date(order.order_date), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-black rounded-md border-primary/20 text-primary">
                            {order.valid_tickets}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 font-black text-green-600">
                          ${Number(order.your_earnings).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventOrderList;