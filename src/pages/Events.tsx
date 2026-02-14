"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, ExternalLink, PlusCircle, Edit, Trash2, Search, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { showSuccess, showError } from "@/utils/toast";
import { useSession } from "@/integrations/supabase/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EventDialog from "@/components/events/EventDialog";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const { user, loading: loadingUserSession } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const fetchEvents = async (currentSearchTerm: string): Promise<Event[]> => {
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
    if (error) throw new Error("Failed to load events.");
    return data || [];
  };

  const { data: events, isLoading, error: fetchError } = useQuery<Event[], Error>({
    queryKey: ['events', searchTerm],
    queryFn: () => fetchEvents(searchTerm),
    enabled: !loadingUserSession,
    staleTime: 5 * 60 * 1000,
  });

  const handleDelete = async (eventId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId)
        .eq("user_id", user.id);

      if (error) throw error;
      showSuccess("Event deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingEvent'] });
    } catch (error) {
      showError("Failed to delete event.");
    }
  };

  const showSkeleton = isLoading && !events;

  return (
    <div className="space-y-6 py-8">
      <h1 className="text-4xl font-bold text-center font-lora">
        {showSkeleton ? <Skeleton className="h-10 w-3/4 mx-auto" /> : "Upcoming Events"}
      </h1>
      
      {!showSkeleton && (
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
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full"
            disabled={isLoading}
          />
        </div>
        
        {user && (
          <Button onClick={() => { setEditingEvent(null); setIsDialogOpen(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Event
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {showSkeleton ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="shadow-lg rounded-xl">
              <CardHeader><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader>
              <CardContent className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-10 w-full" /></CardContent>
            </Card>
          ))
        ) : events && events.length === 0 ? (
          <div className="col-span-full text-center p-8 bg-card rounded-xl shadow-lg flex flex-col items-center justify-center space-y-4">
            <CalendarDays className="h-16 w-16 text-muted-foreground" />
            <p className="text-xl text-muted-foreground font-semibold font-lora">No events found yet!</p>
            {!user && <Button asChild className="mt-4"><Link to="/login">Login to Add Events</Link></Button>}
          </div>
        ) : (
          events?.map((event) => (
            <Card key={event.id} className="shadow-lg rounded-xl hover:shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-medium font-lora">{event.title}</CardTitle>
                <CalendarDays className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Date: {format(new Date(event.date), "PPP")}</p>
                {event.location && <p className="text-sm text-muted-foreground">Location: {event.location}</p>}
                {event.description && <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>}
                {event.humanitix_link ? (
                  <Button asChild className="w-full">
                    <a href={event.humanitix_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" /> View on Humanitix
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>No Humanitix Link</Button>
                )}
                {user && user.id === event.user_id && (
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => { setEditingEvent(event); setIsDialogOpen(true); }}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(event.id)}>Delete</AlertDialogAction>
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

      {user && (
        <EventDialog 
          isOpen={isDialogOpen} 
          onClose={() => setIsDialogOpen(false)} 
          editingEvent={editingEvent} 
          userId={user.id} 
        />
      )}
    </div>
  );
};

export default Events;