"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Plus, Trash2, Wallet, Receipt } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { format, isValid } from "date-fns";
import Section from "@/components/ui/section";
import EmptyState from "@/components/ui/empty-state";
import OverflowMenu from "@/components/ui/overflow-menu";
import ConfirmDialog from "@/components/ui/confirm-dialog";

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be a positive number"),
  category: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseLoggerProps {
  eventId: string;
}

const ExpenseLogger: React.FC<ExpenseLoggerProps> = ({ eventId }) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { description: "", amount: "", category: "General" },
  });

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["eventExpenses", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_expenses")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const openDialog = () => {
    form.reset({ description: "", amount: "", category: "General" });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: ExpenseFormData) => {
    const { error } = await supabase.from("event_expenses").insert({
      event_id: eventId,
      description: data.description,
      amount: parseFloat(data.amount),
      category: data.category,
    });

    if (error) showError("Failed to log expense.");
    else {
      showSuccess("Expense logged!");
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["eventExpenses", eventId] });
    }
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    setIsDeleting(true);
    const { error } = await supabase.from("event_expenses").delete().eq("id", pendingDeleteId);
    setIsDeleting(false);
    if (error) showError("Failed to delete expense.");
    else {
      showSuccess("Expense deleted.");
      setPendingDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["eventExpenses", eventId] });
    }
  };

  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  const addExpenseAction = (
    <Button onClick={openDialog} className="h-10 rounded-xl font-bold shadow-sm">
      <Plus className="h-4 w-4 mr-1.5" /> Add Expense
    </Button>
  );

  return (
    <>
      <Section
        title="Expenses"
        description="Log everything you spend on this session so break-even stays accurate."
        icon={<Wallet className="h-4 w-4" />}
        action={addExpenseAction}
        mutedHeader
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !expenses || expenses.length === 0 ? (
          <EmptyState
            icon={<Receipt className="h-7 w-7" />}
            title="No expenses logged yet"
            description="Add venue hire, printing, sheet music and ad spend to see your true break-even point."
            action={{ label: "Add Expense", onClick: openDialog, icon: <Plus className="h-4 w-4" /> }}
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">
                <span className="font-black text-foreground">{expenses.length}</span> expense{expenses.length === 1 ? "" : "s"}
              </p>
              <p className="text-sm font-medium text-muted-foreground">
                Total <span className="font-black text-foreground">${totalExpenses.toFixed(2)}</span>
              </p>
            </div>
            <div className="overflow-x-auto -mx-5 md:-mx-6">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5 md:pl-6 text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Description</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Category</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Amount</TableHead>
                    <TableHead className="w-12 pr-5 md:pr-6">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((e) => {
                    const date = new Date(e.created_at);
                    return (
                      <TableRow key={e.id} className="group">
                        <TableCell className="pl-5 md:pl-6 text-xs text-muted-foreground whitespace-nowrap">
                          {isValid(date) ? format(date, "MMM d") : "N/A"}
                        </TableCell>
                        <TableCell className="font-medium">{e.description}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] font-bold rounded-full bg-muted text-muted-foreground">
                            {e.category || "General"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-black tabular-nums">
                          ${Number(e.amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="pr-5 md:pr-6 text-right">
                          <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
                            <OverflowMenu
                              label="Expense"
                              triggerLabel="Expense actions"
                              actions={[
                                {
                                  label: "Delete expense",
                                  icon: <Trash2 className="h-4 w-4" />,
                                  destructive: true,
                                  onSelect: () => setPendingDeleteId(e.id),
                                },
                              ]}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Section>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-lora font-black">Log an expense</DialogTitle>
            <DialogDescription>
              Record a cost for this session. It counts toward break-even immediately.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Venue Hire" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Marketing" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                    "Add Expense"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        title="Delete this expense?"
        description="This permanently removes the expense and recalculates your break-even point. This can't be undone."
        confirmLabel="Delete Expense"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default ExpenseLogger;