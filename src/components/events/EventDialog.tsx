"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarDays, Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useQueryClient } from "@tanstack/react-query";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.date({ required_error: "Date is required" }),
  location: z.string().optional(),
  description: z.string().optional(),
  humanitix_link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  ai_chat_link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type EventFormData = z.infer<typeof eventSchema>;

interface Event {
  id: string;
  user_id: string;
  title: string;
  date: string;
  location?: string;
  description?: string;
  humanitix_link?: string;
  ai_chat_link?: string;
}

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingEvent: Event | null;
  userId: string;
}

const EventDialog: React.FC<EventDialogProps> = ({ isOpen, onClose, editingEvent, userId }) => {
  const queryClient = useQueryClient();
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      date: undefined,
      location: "",
      description: "",
      humanitix_link: "https://events.humanitix.com/resonance-choir",
      ai_chat_link: "",
    },
  });

  useEffect(() => {
    if (editingEvent) {
      form.reset({
        title: editingEvent.title,
        date: new Date(editingEvent.date),
        location: editingEvent.location || "",
        description: editingEvent.description || "",
        humanitix_link: editingEvent.humanitix_link || "",
        ai_chat_link: editingEvent.ai_chat_link || "",
      });
    } else {
      form.reset({
        title: "",
        date: undefined,
        location: "",
        description: "",
        humanitix_link: "https://events.humanitix.com/resonance-choir",
        ai_chat_link: "",
      });
    }
  }, [editingEvent, form, isOpen]);

  const onSubmit = async (data: EventFormData) => {
    try {
      const payload = {
        user_id: userId,
        title: data.title,
        date: format(data.date, "yyyy-MM-dd"),
        location: data.location || null,
        description: data.description || null,
        humanitix_link: data.humanitix_link || null,
        ai_chat_link: data.ai_chat_link || null,
      };

      let error;
      if (editingEvent) {
        const { error: updateError } = await supabase
          .from("events")
          .update(payload)
          .eq("id", editingEvent.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from("events").insert(payload);
        error = insertError;
      }

      if (error) throw error;

      showSuccess(`Event ${editingEvent ? "updated" : "added"} successfully!`);
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["upcomingEvent"] });
      onClose();
    } catch (error: any) {
      showError(`Failed to save event: ${error.message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-lora">{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Event Title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Venue Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Details about the event..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="humanitix_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Humanitix Link (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://events.humanitix.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ai_chat_link"
              render={({ field }) => (
                <FormItem className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <FormLabel className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-4 w-4" /> Admin AI Chat Link (Private)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://gemini.google.com/..." {...field} />
                  </FormControl>
                  <FormDescription>
                    This link is only visible to administrators.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  editingEvent ? "Save Changes" : "Add Event"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EventDialog;