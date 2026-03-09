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
import { Loader2, Plus, Trash2, DollarSign } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be a positive number"),
  category: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const ExpenseLogger: React.FC = () => {
  const queryClient = useQueryClient();
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { description: "", amount: "", category: "General" },
  });

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["eventExpenses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_expenses").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    const { error } = await supabase.from("event_expenses").insert({
      description: data.description,
      amount: parseFloat(data.amount),
      category: data.category,
    });

    if (error) showError("Failed to log expense.");
    else {
      showSuccess("Expense logged!");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["eventExpenses"] });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("event_expenses").delete().eq("id", id);
    if (error) showError("Failed to delete.");
    else {
      showSuccess("Expense deleted.");
      queryClient.invalidateQueries({ queryKey: ["eventExpenses"] });
    }
  };

  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1 shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" /> Log Expense
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="e.g. Venue Hire" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Amount ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g. Marketing" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Add Expense"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 shadow-lg border-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Expense History</CardTitle>
            <CardDescription>Total: ${totalExpenses.toFixed(2)}</CardDescription>
          </div>
          <DollarSign className="h-8 w-8 text-primary opacity-20" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses?.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs">{format(new Date(e.created_at), "MMM d")}</TableCell>
                  <TableCell className="font-medium">{e.description}</TableCell>
                  <TableCell><span className="text-xs bg-muted px-2 py-1 rounded-full">{e.category}</span></TableCell>
                  <TableCell className="text-right font-bold">${Number(e.amount).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseLogger;