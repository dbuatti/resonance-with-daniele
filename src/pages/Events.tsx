"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Link as LinkIcon, PlusCircle, Edit, Trash2, Loader2, Search } from "lucide-react";
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
import { Link } from "react-router-dom";
// Removed: import { useDelayedLoading } from "@/hooks/use-delayed-loading"; // Import the new hook

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
  const [searchTerm, setSearchTerm] = useState("");

  // Removed: const showDelayedSkeleton = useDelayedLoading(loadingEvents); // Use the delayed loading hook

  console.log("[Events Page] User:", user ? user.id : 'null', "Loading User Session:", loadingUserSession);

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
    console.log("[Events Page] useEffect: Initial fetch events or search term changed.");
    const debounceTimeout = setTimeout(() => {
      fetchEvents(searchTerm);
    }, 300); // Debounce search to avoid too many requests

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, user]);

  useEffect(() => {
    if (editingEvent) {
      console.log("[Events Page] useEffect: Setting edit form defaults for event:", editingEvent.id);
      editForm.reset({
        title: editingEvent.title,
        date: new Date(editingEvent.date),
        location: editingEvent.location || "",
        description: editingEvent.description || "",
        humanitix_link: editingEvent.humanitix_link || "",
      });
    }
  }, [editingEvent, editForm]);

  const fetchEvents = async (currentSearchTerm: string) => {
    setLoadingEvents(true);
    console.log("[Events Page] Fetching all events from Supabase with search term:", currentSearchTerm);
    let query = supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true });

    if (currentSearchTerm) {
      query = query.or(
        `title.ilike.%${currentSearchTerm}%,description.ilike.%${currentSearchTerm}%,location.ilike.%${currentSearchTerm}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Events Page] Error fetching events:", error);
      showError("Failed to load events.");
    } else {
      setEvents(data || []);
      console.log("[Events Page] Events fetched successfully:", data?.length, "events.");
    }
    setLoadingEvents(false);
    console.log("[Events Page] Events loading state set to false.");
  };

  const onAddSubmit = async (data: EventFormData) => {
    console.log("[Events Page] Add form submitted. Data:", data);
    if (!user) {
      showError("You must be logged in to add events.");
      console.error("[Events Page] Attempted to add event without a user.");
      return;
    }

    const { title, date, location, description, humanitix_link } = data;
    console.log(`[Events Page] Inserting new event for user ${user.id}:`, { title, date, location });
    const { error } = await supabase.from("events").insert({
      user_id: user.id,
      title,
      date: format(date, "yyyy-MM-dd"),
      location,
      description,
      humanitix_link: humanitix_link || null,
    });

    if (error) {
      console.error("[Events Page] Error adding event:", error);
      showError("Failed to add event.");
    } else {
      showSuccess("Event added successfully!");
      addForm.reset();
      setIsAddDialogOpen(false);
      fetchEvents(searchTerm);
      console.log("[Events Page] Event added and list refreshed.");
    }
  };

  const onEditSubmit = async (data: EventFormData) => {
    console.log("[Events Page] Edit form submitted. Data:", data, "Editing Event ID:", editingEvent?.id);
    if (!user || !editingEvent) {
    showError("You must be logged in and select an event to edit.");
    console.error("[Events Page] Attempted to edit event without user or selected event.");
    return;
    }

    const { title, date, location, description, humanitix_link } = data;
    console.log(`[Events Page] Updating event ${editingEvent.id} for user ${user.id}:`, { title, date, location });
    const { error } = await supabase
      .from("events")
      .update({
        title,
        date: format(date, "yyyy-MM-dd"),
        location,
        description,
        humanitix_link: humanitix_link || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingEvent.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[Events Page] Error updating event:", error);
      showError("Failed to update event.");
    } else {
      showSuccess("Event updated successfully!");
      setIsEditDialogOpen(false);
      setEditingEvent(null);
      fetchEvents(searchTerm);
      console.log("[Events Page] Event updated and list refreshed.");
    }
  };

  const handleDelete = async (eventId: string) => {
    console.log("[Events Page] Delete requested for event ID:", eventId);
    if (!user) {
      showError("You must be logged in to delete events.");
      console.error("[Events Page] Attempted to delete event without a user.");
      return;
    }

    console.log(`[Events Page] Deleting event ${eventId} for user ${user.id}.`);
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId)
      .eq("user_id", user.id);

    if (error) {
      console.error("[Events Page] Error deleting event:", error);
      showError("Failed to delete event.");
    } else {
      showSuccess("Event deleted successfully!");
      fetchEvents(searchTerm);
      console.log("[Events Page] Event deleted and list refreshed.");
    }
  };

  console.log("[Events Page] Rendering Events component. Loading Events:", loadingEvents, "Events count:", events.length);

  return (
    <div className="space-y-6 py-8"> {/* Removed animate-fade-in-up */}
      <h1 className="text-4xl font-bold text-center font-lora">
        {loadingEvents ? <Skeleton className="h-10 w-3/4 mx-auto" /> : "Upcoming Events"}
      </h1>
      {loadingEvents ? (
        <div className="text-lg text-center text-muted-foreground">
          <Skeleton className="h-6 w-1/2 mx-auto" />
        </div>
      ) : (
        <p className="text-lg text-center text-muted-foreground">
          Stay up-to-date with all my choir's performances, rehearsals, and social gatherings.
        </p>
      )}

      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search events by title, description, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full"
            disabled={loadingEvents}
          />
        </div>
        {user ? (
          <>
            {console.log("[Events Page] User is logged in, showing 'Add New Event' button.")}
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
                      {addForm.formState.isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                        </>
                      ) : (
                        "Add Event"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <>
            {console.log("[Events Page] User is NOT logged in, showing 'Log in to add events' message.")}
            <p className="text-md text-muted-foreground">Log in to add new events.</p>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {loadingEvents ? (
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
          <>
            {console.log("[Events Page] No events found, displaying empty state.")}
            <div className="col-span-full text-center p-8 bg-card rounded-xl shadow-lg flex flex-col items-center justify-center space-y-4">
              <CalendarDays className="h-16 w-16 text-muted-foreground" />
              <p className="text-xl text-muted-foreground font-semibold font-lora">No events found yet!</p>
              <p className="text-md text-muted-foreground mt-2">
                {user
                  ? "Be the first to add one using the 'Add New Event' button above!"
                  : "Log in to add and view upcoming events."}
              </p>
              {!user && (
                <Button asChild className="mt-4">
                  <Link to="/login">Login to Add Events</Link>
                </Button>
              )}
              {user && (
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-4">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Event
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
                          {addForm.formState.isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                            </>
                          ) : (
                            "Add Event"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="shadow-lg rounded-xl transition-all duration-200 hover:shadow-xl hover:scale-[1.01]">
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
                        console.log("[Events Page] Editing event:", event.id);
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
                  {editForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
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