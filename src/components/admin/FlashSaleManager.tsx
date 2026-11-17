"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Zap, Clock, Plus, Tag } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { format, isAfter, isBefore } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Section from "@/components/ui/section";
import EmptyState from "@/components/ui/empty-state";

const promoSchema = z.object({
  code: z.string().min(1, "Code is required"),
  discount_percent: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be a positive number"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  description: z.string().optional(),
});

type PromoFormData = z.infer<typeof promoSchema>;

interface FlashSaleManagerProps {
  eventId: string;
}

const FlashSaleManager: React.FC<FlashSaleManagerProps> = ({ eventId }) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<PromoFormData>({
    resolver: zodResolver(promoSchema),
    defaultValues: {
      code: "SING20",
      discount_percent: "20",
      start_date: "",
      end_date: "",
      description: "48-Hour Flash Sale",
    },
  });

  const { data: promos, isLoading } = useQuery({
    queryKey: ["marketingPromos", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_promos")
        .select("*")
        .eq("event_id", eventId)
        .order("end_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const openDialog = () => {
    form.reset({
      code: "SING20",
      discount_percent: "20",
      start_date: "",
      end_date: "",
      description: "48-Hour Flash Sale",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: PromoFormData) => {
    const { error } = await supabase.from("marketing_promos").upsert({
      event_id: eventId,
      code: data.code,
      discount_percent: parseInt(data.discount_percent),
      start_date: new Date(data.start_date).toISOString(),
      end_date: new Date(data.end_date).toISOString(),
      description: data.description,
    });

    if (error) showError("Failed to save promo.");
    else {
      showSuccess("Promotion saved!");
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["marketingPromos", eventId] });
    }
  };

  const createPromotionAction = (
    <Button onClick={openDialog} className="h-10 rounded-xl font-bold shadow-sm">
      <Plus className="h-4 w-4 mr-1.5" /> Create Promotion
    </Button>
  );

  return (
    <>
      <Section
        title="Promotions"
        description="Run time-boxed discount codes to drive a burst of ticket sales."
        icon={<Zap className="h-4 w-4" />}
        action={createPromotionAction}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !promos || promos.length === 0 ? (
          <EmptyState
            icon={<Tag className="h-7 w-7" />}
            title="No promotions yet"
            description="Create a discount code to reward your community and fill seats fast."
            action={{ label: "Create Promotion", onClick: openDialog, icon: <Plus className="h-4 w-4" /> }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promos.map((promo) => {
              const now = new Date();
              const start = new Date(promo.start_date);
              const end = new Date(promo.end_date);
              const isActive = isAfter(now, start) && isBefore(now, end);
              const isUpcoming = isBefore(now, start);

              return (
                <div
                  key={promo.id}
                  className={cn(
                    "rounded-2xl border p-5 space-y-3 transition-shadow",
                    isActive
                      ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/60 bg-card",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xl font-black font-mono tracking-tight">{promo.code}</span>
                        <Badge
                          variant={isActive ? "default" : isUpcoming ? "secondary" : "outline"}
                          className="text-[9px] font-black uppercase tracking-widest"
                        >
                          {isActive ? "Active" : isUpcoming ? "Upcoming" : "Expired"}
                        </Badge>
                      </div>
                      {promo.description && (
                        <p className="text-sm text-muted-foreground font-medium">{promo.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-3xl font-black text-primary leading-none">{promo.discount_percent}%</div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Off</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {format(start, "MMM d, h:mm a")}
                    <span className="opacity-50">→</span>
                    {format(end, "MMM d, h:mm a")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-lora font-black">Create a promotion</DialogTitle>
            <DialogDescription>
              Set a discount code and the window it's valid for. Share the code anywhere you promote the event.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Promo Code</FormLabel>
                      <FormControl>
                        <Input className="font-mono uppercase" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discount_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount (%)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date &amp; Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date &amp; Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 48-Hour Flash Sale" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="font-bold"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={form.formState.isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="font-bold rounded-xl" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    "Save Promotion"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FlashSaleManager;