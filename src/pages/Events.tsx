"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Link as LinkIcon, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { useSession } from "@/integrations/supabase/auth";
import { Skeleton } from "@/components/ui/skeleton";

// Define the schema for an event
const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.date({ required_error: "Date is required" }),
  location: z.string().optional(),
  description: z.string().optional(),
  humanitix_link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type EventFormData = z.infer<typeof eventSchema>;

interface Event {
  id: string;
  title: string;
  date: string; // ISO date string
  location?: string;
  description?: string;
  humanitix_link?: string;
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user, loading: loadingUserSession } = useSession();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      date: undefined,
      location: "",
      description: "",
      humanitix_link: "",
    },
  });

  useEffect(() => {
    fetchEvents(); // Fetch events regardless of user login status
  }, []);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching events:", error);
      showError("Failed to load events.");
    } else {
      setEvents(data || []);
    }
    setLoadingEvents(false);
  };

  const onSubmit = async (data: EventFormData) => {
    if (!user) {
      showError("You must be logged in to add events.");
      return;
    }

    const { title, date, location, description, humanitix_link } = data;
    const { error } = await supabase.from("events").insert({
      user_id: user.id,
      title,
      date: format(date, "yyyy-MM-dd"),
      location,
      description,
      humanitix_link: humanitix_link || null,
    });

    if (error) {
      console.error("Error adding event:", error);
      showError("Failed to add event.");
    } else {
      showSuccess("Event added successfully!");
      form.reset();
      setIsDialogOpen(false);
      fetchEvents();
    }
  };

  if (loadingEvents) { // Only check for loading events, not user session for initial display
    return (
      <Layout>
        <div className="text-center text-lg py-8">
          <p className="mb-4">Loading events...</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="shadow-lg rounded-xl">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-10 w-full mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 py-8">
        <h1 className="text-4xl font-bold text-center">Upcoming Events</h1>
        <p className="text-lg text-center text-muted-foreground">
          Stay up-to-date with all our choir's performances, rehearsals, and social gatherings.
        </p>

        <div className="flex justify-center">
          {user ? ( // Only show "Add New Event" button if user is logged in
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Event</DialogTitle>
                  <CardDescription>Fill in the details for your upcoming choir event.</CardDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
                  <div className="space-y-2">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" {...form.register("title")} />
                      {form.formState.errors.title && (
                        <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="date">Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !form.watch("date") && "text-muted-foreground"
                            )}
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {form.watch("date") ? format(form.watch("date"), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={form.watch("date")}
                            onSelect={(date) => form.setValue("date", date!)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {form.formState.errors.date && (
                        <p className="text-red-500 text-sm">{form.formState.errors.date.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="grid gap-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" {...form.register("location")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" {...form.register("description")} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="humanitix_link">Humanitix Link (Optional)</Label>
                    <Input id="humanitix_link" {...form.register("humanitix_link")} />
                    {form.formState.errors.humanitix_link && (
                      <p className="text-red-500 text-sm">{form.formState.errors.humanitix_link.message}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? "Adding..." : "Add Event"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <p className="text-md text-muted-foreground">Log in to add new events.</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length === 0 ? (
            <div className="col-span-full text-center p-8 bg-card rounded-xl shadow-lg">
              <p className="text-xl text-muted-foreground font-semibold">No events found.</p>
              {!user && <p className="text-md text-muted-foreground mt-2">Log in to add new events.</p>}
              {user && <p className="text-md text-muted-foreground mt-2">Be the first to add one using the button above!</p>}
            </div>
          ) : (
            events.map((event) => (
              <Card key={event.id} className="shadow-lg rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-2xl font-medium">
                    {event.title}
                  </CardTitle>
                  <CalendarDays className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">Date: {format(new Date(event.date), "PPP")}</p>
                  {event.location && <p className="text-sm text-muted-foreground">Location: {event.location}</p>}
                  {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                  {event.humanitix_link ? (
                    <Button asChild className="w-full">
                      <a href={event.humanitix_link} target="_blank" rel="noopener noreferrer">
                        <LinkIcon className="mr-2 h-4 w-4" /> View on Humanitix
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      No Humanitix Link
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Events;