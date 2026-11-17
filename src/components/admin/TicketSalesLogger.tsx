"use client";

import React, { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Upload, FileSpreadsheet, UserCheck, Ticket } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseCurrency, parseHumanitixDate, splitLine } from "@/utils/humanitix-csv";
import Section from "@/components/ui/section";
import EmptyState from "@/components/ui/empty-state";

interface TicketSalesLoggerProps {
  eventId: string;
}

const TicketSalesLogger: React.FC<TicketSalesLoggerProps> = ({ eventId }) => {
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

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

  // CRM Link: Fetch profiles to match with emails
  const { data: profiles } = useQuery({
    queryKey: ["allProfilesForMatching"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("email, avatar_url, first_name, last_name");
      if (error) throw error;
      return data || [];
    }
  });

  const profileMap = useMemo(() => {
    const map: Record<string, { avatar_url: string | null; first_name: string | null; last_name: string | null }> = {};
    profiles?.forEach(p => {
      if (p.email) map[p.email.toLowerCase().trim()] = p;
    });
    return map;
  }, [profiles]);

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
        setIsImportOpen(false);
        queryClient.invalidateQueries({ queryKey: ["eventOrders", eventId] });
      } catch (err: unknown) { showError(err instanceof Error ? err.message : "Failed to import file."); } finally { setIsImporting(false); }
    };
    reader.readAsText(file);
  }, [eventId, queryClient]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "text/csv": [".csv"], "text/tab-separated-values": [".tsv", ".txt"] }, multiple: false });

  const totalTickets = orders?.reduce((sum, o) => sum + (o.valid_tickets || 0), 0) || 0;
  const totalEarnings = orders?.reduce((sum, o) => sum + Number(o.your_earnings || 0), 0) || 0;
  const targetTickets = 125;
  const progress = (totalTickets / targetTickets) * 100;

  const importAction = (
    <Button onClick={() => setIsImportOpen(true)} className="h-10 rounded-xl font-bold shadow-sm">
      <Upload className="h-4 w-4 mr-1.5" /> Import Orders
    </Button>
  );

  return (
    <>
      <div className="space-y-6">
        {/* Live progress — the single glanceable summary */}
        <div className="rounded-[2rem] border border-border/60 bg-primary/5 p-5 md:p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Live Sales Progress</p>
              <div className="text-4xl font-black font-lora leading-none">
                {totalTickets} <span className="text-lg text-muted-foreground font-bold">/ {targetTickets} tickets</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Earnings</p>
              <p className="text-2xl font-black text-green-600 leading-none">${totalEarnings.toFixed(2)}</p>
            </div>
          </div>
          <Progress value={progress} className="h-2.5 mt-4" />
        </div>

        <Section
          title="Ticket Sales"
          description="Import your Humanitix Order Report to sync every sale and earning."
          icon={<Ticket className="h-4 w-4" />}
          action={importAction}
          badge={<Badge variant="secondary" className="text-[10px] font-black rounded-full">{orders?.length || 0} orders</Badge>}
        >
          {loadingOrders ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin h-6 w-6 text-primary" />
            </div>
          ) : !orders || orders.length === 0 ? (
            <EmptyState
              icon={<FileSpreadsheet className="h-7 w-7" />}
              title="No orders imported yet"
              description="Upload the Order Report exported from your Humanitix event page to see live sales here."
              action={{ label: "Import Orders", onClick: () => setIsImportOpen(true), icon: <Upload className="h-4 w-4" /> }}
              hint="Accepts .csv and .tsv files"
            />
          ) : (
            <div className="overflow-x-auto -mx-5 md:-mx-6">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5 md:pl-6 text-[10px] font-black uppercase tracking-widest">Customer</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                    <TableHead className="text-center text-[10px] font-black uppercase tracking-widest">Tickets</TableHead>
                    <TableHead className="text-right pr-5 md:pr-6 text-[10px] font-black uppercase tracking-widest">Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const member = order.email ? profileMap[order.email.toLowerCase().trim()] : null;
                    return (
                      <TableRow key={order.order_id}>
                        <TableCell className="pl-5 md:pl-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-border">
                              <AvatarImage src={member?.avatar_url || ""} />
                              <AvatarFallback className="text-[10px] font-bold">{(order.first_name || "U")[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm">{order.first_name} {order.last_name}</span>
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
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(order.order_date), "MMM d, h:mm a")}</TableCell>
                        <TableCell className="text-center font-bold">{order.valid_tickets}</TableCell>
                        <TableCell className="text-right pr-5 md:pr-6 font-bold text-green-600 tabular-nums">${Number(order.your_earnings).toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Section>
      </div>

      <Dialog open={isImportOpen} onOpenChange={(open) => !isImporting && setIsImportOpen(open)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-lora font-black">Import Humanitix orders</DialogTitle>
            <DialogDescription>
              Export the Order Report from your Humanitix event page, then drop it below. Existing orders are updated, not duplicated.
            </DialogDescription>
          </DialogHeader>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50",
              isImporting && "opacity-50 pointer-events-none",
            )}
          >
            <input {...getInputProps()} />
            {isImporting ? (
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            ) : (
              <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            )}
            <p className="text-sm font-medium">{isImporting ? "Importing orders…" : isDragActive ? "Drop the file here" : "Drag & drop Humanitix file"}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mt-1">or click to browse</p>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="ghost" className="font-bold" onClick={() => setIsImportOpen(false)} disabled={isImporting}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TicketSalesLogger;