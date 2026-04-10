"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarDays, Loader2, Sparkles, Music, StickyNote } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
  main_song: z.string().optional(),
  lesson_notes: z.string().optional(), // New field
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
  main_song?: string;
  lesson_notes?: string;
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
      location: "Armadale Baptist Church",
      description: "",
      main_song: "",
      lesson_notes: "",
      humanitix_link: "https://events.humanitix.com/resonance-melbourne-s-pop-up-choir-april-2026",
      ai_chat_link: "",
    },
  });

  useEffect(() => {
    if (editingEvent) {
      form.reset({
        title: editingEvent.title,
        date: new Date(editingEvent.date),
        location: editingEvent.location || "Armadale Baptist Church",
        description: editingEvent.description || "",
        main_song: editingEvent.main_song || "",
        lesson_notes: editingEvent.lesson_notes || "",
        humanitix_link: editingEvent.humanitix_link || "",
        ai_chat_link: editingEvent.ai_chat_link || "",
      });
    } else {
      form.reset({
        title: "",
        date: undefined,
        location: "Armadale Baptist Church",
        description: "",
        main_song: "",
        lesson_notes: "",
        humanitix_link: "https://events.humanitix.com/resonance-melbourne-s-pop-up-choir-april-2026",
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
        main_song: data.main_song || null,
        lesson_notes: data.lesson_notes || null,
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
      queryClient.invalidateQueries({ queryKey: ["lessonsHubData"] });
      onClose();
    } catch (error: any) {
      showError(`Failed to save event: ${error.message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="font-lora text-2xl font-black">{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
          <DialogDescription className="font-medium">
            {editingEvent ? "Update the details for this choir event." : "Create a new event for the choir community."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Event Title" {...field} className="rounded-xl font-bold" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-bold rounded-xl h-11",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden">
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
                name="main_song"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Music className="h-3 w-3 text-primary" /> Main Song
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. You Will Be Found" {...field} className="rounded-xl font-bold" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="lesson_notes"
              render={({ field }) => (
                <FormItem className="bg-yellow-50/50 dark:bg-yellow-950/10 p-4 rounded-2xl border border-yellow-200/50">
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
                    <StickyNote className="h-3 w-3" /> Lesson Notes (Public)
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Write your handwritten-style notes for the members here..." 
                      {...field} 
                      className="min-h-[120px] rounded-xl bg-background/50 font-medium border-yellow-200/30"
                    />
                  </FormControl>
                  <FormDescription className="text-[10px] text-yellow-700/60">
                    These notes will appear in the Lessons Hub for all members.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Venue Name" {...field} className="rounded-xl font-bold" />
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
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Details about the event..." {...field} className="rounded-xl font-medium" />
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
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Humanitix Link</FormLabel>
                  <FormControl>
                    <Input placeholder="https://events.humanitix.com/..." {...field} className="rounded-xl font-bold" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" className="w-full h-12 font-black rounded-xl shadow-lg" disabled={form.formState.isSubmitting}>
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