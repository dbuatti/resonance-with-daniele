"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Link as LinkIcon, PlusCircle, Edit, Trash2 } from "lucide-react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
  user_id: string; // Added user_id to identify event creator
  title: string;
  date: string; // ISO date string
  location?: string;
  description?: string;
  humanitix_link?: string;
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const { user, loading: loadingUserSession } = useSession();

  const addForm = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      date: undefined,
      location: "",
      description: "",
      humanitix_link: "",
    },
  });

  const editForm = useForm<EventFormData>({
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
    fetchEvents();
  }, []);

  useEffect(() => {
    if (editingEvent) {
      editForm.reset({
        title: editingEvent.title,
        date: new Date(editingEvent.date),
        location: editingEvent.location || "",
        description: editingEvent.description || "",
        humanitix_link: editingEvent.humanitix_link || "",
      });
    }
  }, [editingEvent, editForm]);

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

  const onAddSubmit = async (data: EventFormData) => {
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
      addForm.reset();
      setIsAddDialogOpen(false);
      fetchEvents();
    }
  };

  const onEditSubmit = async (data: EventFormData) => {
    if (!user || !editingEvent) {
      showError("You must be logged in and select an event to edit.");
      return;
    }

    const { title, date, location, description, humanitix_link } = data;
    const { error } = await supabase
      .from("events")
      .update({
        title,
        date: format(date, "yyyy-MM-dd"),
        location,
        description,
        humanitix_link: humanitix_link || null,
        updated_at: new Date().toISOString(), // Add updated_at for tracking changes
      })
      .eq("id", editingEvent.id)
      .eq("user_id", user.id); // Ensure only the owner can update

    if (error) {
      console.error("Error updating event:", error);
      showError("Failed to update event.");
    } else {
      showSuccess("Event updated successfully!");
      setIsEditDialogOpen(false);
      setEditingEvent(null);
      fetchEvents();
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!user) {
      showError("You must be logged in to delete events.");
      return;
    }

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId)
      .eq("user_id", user.id); // Ensure only the owner can delete

    if (error) {
      console.error("Error deleting event:", error);
      showError("Failed to delete event.");
    } else {
      showSuccess("Event deleted successfully!");
      fetchEvents();
    }
  };

  return (
    <div className="space-y-6 py-8 animate-fade-in-up"> {/* Added fade-in-up */}
      <h1 className="text-4xl font-bold text-center font-lora">
        {loadingEvents ? <Skeleton className="h-10 w-3/4 mx-auto" /> : "Upcoming Events"}
      </h1>
      <p className="text-lg text-center text-muted-foreground">
        {loadingEvents ? <Skeleton className="h-6 w-1/2 mx-auto" /> : "Stay up-to-date with all my choir's performances, rehearsals, and social gatherings."}
      </p>

      <div className="flex justify-center">
        {loadingEvents ? (
          <Skeleton className="h-10 w-48" />
        ) : user ? (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-lora">Add New Event</DialogTitle>
                <CardDescription>Fill in the details for your upcoming choir event.</CardDescription>
              </DialogHeader>
              <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="grid gap-6 py-4">
                <div className="space-y-2">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" {...addForm.register("title")} />
                    {addForm.formState.errors.title && (
                      <p className="text-red-500 text-sm">{addForm.formState.errors.title.message}</p>
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
                            !addForm.watch("date") && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {addForm.watch("date") ? format(addForm.watch("date"), "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={addForm.watch("date")}
                          onSelect={(date) => addForm.setValue("date", date!)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {addForm.formState.errors.date && (
                      <p className="text-red-500 text-sm">{addForm.formState.errors.date.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" {...addForm.register("location")} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" {...addForm.register("description")} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="humanitix_link">Humanitix Link (Optional)</Label>
                  <Input id="humanitix_link" {...addForm.register("humanitix_link")} />
                  {addForm.formState.errors.humanitix_link && (
                    <p className="text-red-500 text-sm">{addForm.formState.errors.humanitix_link.message}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={addForm.formState.isSubmitting}>
                    {addForm.formState.isSubmitting ? "Adding..." : "Add Event"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : (
          <p className="text-md text-muted-foreground">Log in to add new events.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {loadingEvents ? (
          // Render skeleton cards when loading
          [...Array(3)].map((_, i) => (
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
          ))
        ) : events.length === 0 ? (
          <div className="col-span-full text-center p-8 bg-card rounded-xl shadow-lg flex flex-col items-center justify-center space-y-4">
            <CalendarDays className="h-16 w-16 text-muted-foreground" />
            <p className="text-xl text-muted-foreground font-semibold font-lora">No events found.</p>
            {!user && <p className="text-md text-muted-foreground mt-2">Log in to add new events.</p>}
            {user && (
              <p className="text-md text-muted-foreground mt-2">
                Be the first to add one using the "Add New Event" button above!
              </p>
            )}
          </div>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="shadow-lg rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-medium font-lora">
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
                {user && user.id === event.user_id && (
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingEvent(event);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your event.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(event.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Event Dialog */}
      {editingEvent && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-lora">Edit Event</DialogTitle>
              <CardDescription>Update the details for your choir event.</CardDescription>
            </DialogHeader>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="grid gap-6 py-4">
              <div className="space-y-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input id="edit-title" {...editForm.register("title")} />
                  {editForm.formState.errors.title && (
                    <p className="text-red-500 text-sm">{editForm.formState.errors.title.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editForm.watch("date") && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {editForm.watch("date") ? format(editForm.watch("date"), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editForm.watch("date")}
                        onSelect={(date) => editForm.setValue("date", date!)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {editForm.formState.errors.date && (
                    <p className="text-red-500 text-sm">{editForm.formState.errors.date.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input id="edit-location" {...editForm.register("location")} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea id="edit-description" {...editForm.register("description")} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-humanitix_link">Humanitix Link (Optional)</Label>
                <Input id="edit-humanitix_link" {...editForm.register("humanitix_link")} />
                {editForm.formState.errors.humanitix_link && (
                  <p className="text-red-500 text-sm">{editForm.formState.errors.humanitix_link.message}</p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={editForm.formState.isSubmitting}>
                  {editForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Events;