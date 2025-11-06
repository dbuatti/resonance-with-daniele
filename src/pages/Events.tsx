"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Link as LinkIcon, PlusCircle, Edit, Trash2, Loader2, Search, AlertCircle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useQueryClient } from "@tanstack/react-query"; // Import useQueryClient

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
  user_id: string;
  title: string;
  date: string;
  location?: string;
  description?: string;
  humanitix_link?: string;
}

const Events: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const { user, loading: loadingUserSession } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient(); // Initialize query client

  const addForm = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      date: undefined,
      location: "",
      description: "",
      humanitix_link: "https://events.humanitix.com/resonance-choir", // Updated default link
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

  // Query function for fetching events
  const fetchEvents = async (currentSearchTerm: string): Promise<Event[]> => {
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
      throw new Error("Failed to load events.");
    }
    console.log("[Events Page] Events fetched successfully:", data?.length, "events.");
    return data || [];
  };

  // Use react-query for events data
  const { data: events, isLoading, isFetching, error: fetchError } = useQuery<
    Event[], // TQueryFnData
    Error,          // TError
    Event[], // TData (the type of the 'data' property)
    ['events', string] // TQueryKey
  >({
    queryKey: ['events', searchTerm], // Query key includes search term
    queryFn: () => fetchEvents(searchTerm),
    enabled: !loadingUserSession, // Only fetch if user session is not loading
    staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Data stays in cache for 10 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

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

  const onAddSubmit = async (data: EventFormData) => {
    if (!user) {
      showError("You must be logged in to add events.");
      return;
    }

    try {
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
        showError("Failed to add event. Please try again.");
      } else {
        showSuccess("Event added successfully!");
        addForm.reset();
        setIsAddDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ['events'] }); // Invalidate to refetch and update UI
        queryClient.invalidateQueries({ queryKey: ['currentEvent'] }); // Also invalidate current event
      }
    } catch (error) {
      console.error("Unexpected error adding event:", error);
      showError("An unexpected error occurred while adding the event.");
    }
  };

  const onEditSubmit = async (data: EventFormData) => {
    if (!user || !editingEvent) {
      showError("You must be logged in and select an event to edit.");
      return;
    }

    try {
      const { title, date, location, description, humanitix_link } = data;
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
        console.error("Error updating event:", error);
        showError("Failed to update event. Please try again.");
      } else {
        showSuccess("Event updated successfully!");
        setIsEditDialogOpen(false);
        setEditingEvent(null);
        queryClient.invalidateQueries({ queryKey: ['events'] }); // Invalidate to refetch and update UI
        queryClient.invalidateQueries({ queryKey: ['currentEvent'] }); // Also invalidate current event
      }
    } catch (error) {
      console.error("Unexpected error updating event:", error);
      showError("An unexpected error occurred while updating the event.");
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!user) {
      showError("You must be logged in to delete events.");
      return;
    }

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting event:", error);
        showError("Failed to delete event. Please try again.");
      } else {
        showSuccess("Event deleted successfully!");
        queryClient.invalidateQueries({ queryKey: ['events'] }); // Invalidate to refetch and update UI
        queryClient.invalidateQueries({ queryKey: ['currentEvent'] }); // Also invalidate current event
      }
    } catch (error) {
      console.error("Unexpected error deleting event:", error);
      showError("An unexpected error occurred while deleting the event.");
    }
  };

  // Determine if skeleton should be shown: only if loading AND no data is available
  const showSkeleton = isLoading && !events;

  return (
    <div className="space-y-6 py-8">
      <h1 className="text-4xl font-bold text-center font-lora">
        {showSkeleton ? <Skeleton className="h-10 w-3/4 mx-auto" /> : "Upcoming Events"}
      </h1>
      
      {showSkeleton ? (
        <div className="text-lg text-center text-muted-foreground">
          <Skeleton className="h-6 w-1/2 mx-auto" />
        </div>
      ) : (
        <p className="text-lg text-center text-muted-foreground">
          Stay up-to-date with all my choir's performances, rehearsals, and social gatherings.
        </p>
      )}

      {fetchError && (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{fetchError.message}</AlertDescription>
        </Alert>
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
            disabled={isLoading}
          />
        </div>
        
        {user ? (
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
                  <Input id="humanitix_link" {...addForm.register("humanitix_link")} placeholder="https://events.humanitix.com/resonance-choir" />
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
        ) : (
          <p className="text-md text-muted-foreground">Log in to add new events.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {showSkeleton ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="shadow-lg rounded-xl">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : events && events.length === 0 ? (
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
          </div>
        ) : (
          events?.map((event) => (
            <Card key={event.id} className="shadow-lg rounded-xl hover:shadow-xl">
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
                <Input id="edit-humanitix_link" {...editForm.register("humanitix_link")} placeholder="https://events.humanitix.com/resonance-choir" />
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