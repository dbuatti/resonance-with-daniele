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
import { Loader2, Zap, Clock, CheckCircle2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { format, isAfter, isBefore } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const promoSchema = z.object({
  code: z.string().min(1, "Code is required"),
  discount_percent: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be a positive number"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  description: z.string().optional(),
});

type PromoFormData = z.infer<typeof promoSchema>;

const FlashSaleManager: React.FC = () => {
  const queryClient = useQueryClient();
  const form = useForm<PromoFormData>({
    resolver: zodResolver(promoSchema),
    defaultValues: { code: "SING20", discount_percent: "20", start_date: "", end_date: "", description: "48-Hour Flash Sale" },
  });

  const { data: promos, isLoading } = useQuery({
    queryKey: ["marketingPromos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("marketing_promos").select("*").order("end_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (data: PromoFormData) => {
    const { error } = await supabase.from("marketing_promos").upsert({
      code: data.code,
      discount_percent: parseInt(data.discount_percent),
      start_date: new Date(data.start_date).toISOString(),
      end_date: new Date(data.end_date).toISOString(),
      description: data.description,
    });

    if (error) showError("Failed to save promo.");
    else {
      showSuccess("Promotion saved!");
      queryClient.invalidateQueries({ queryKey: ["marketingPromos"] });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1 shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Manage Promo
          </CardTitle>
          <CardDescription>Set up your flash sale codes</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem><FormLabel>Promo Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="discount_percent" render={({ field }) => (
                <FormItem><FormLabel>Discount (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="start_date" render={({ field }) => (
                <FormItem><FormLabel>Start Date & Time</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="end_date" render={({ field }) => (
                <FormItem><FormLabel>End Date & Time</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Save Promotion"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="lg:col-span-2 space-y-6">
        {promos?.map((promo) => {
          const now = new Date();
          const start = new Date(promo.start_date);
          const end = new Date(promo.end_date);
          const isActive = isAfter(now, start) && isBefore(now, end);
          const isUpcoming = isBefore(now, start);
          const isExpired = isAfter(now, end);

          return (
            <Card key={promo.id} className={cn("shadow-lg border-none overflow-hidden", isActive && "ring-2 ring-primary")}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-bold font-mono">{promo.code}</h3>
                      <Badge variant={isActive ? "default" : isUpcoming ? "secondary" : "outline"}>
                        {isActive ? "Active Now" : isUpcoming ? "Upcoming" : "Expired"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{promo.description}</p>
                    <div className="flex items-center gap-4 text-sm font-medium">
                      <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> {format(start, "MMM d, h:mm a")}</div>
                      <div className="text-muted-foreground">to</div>
                      <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> {format(end, "MMM d, h:mm a")}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-primary">{promo.discount_percent}%</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Discount</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default FlashSaleManager;