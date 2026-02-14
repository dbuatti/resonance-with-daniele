"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, ExternalLink, PlusCircle, Edit, Trash2, Search, AlertCircle, MapPin, Clock, ArrowRight, Share2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/ui/BackButton";

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
        .eq("id", eventId);

      if (error) throw error;
      showSuccess("Event deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingEvent'] });
    } catch (error) {
      showError("Failed to delete event.");
    }
  };

  const handleShare = (event: Event) => {
    const shareUrl = event.humanitix_link || window.location.href;
    navigator.clipboard.writeText(shareUrl);
    showSuccess(`Link for "${event.title}" copied to clipboard!`);
  };

  const showSkeleton = isLoading && !events;

  return (
    <div className="space-y-10 py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4">
        <BackButton className="mb-6" />
        
        <header className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold font-lora tracking-tight">
            Upcoming Events
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join us for rehearsals, performances, and social gatherings. We'd love to see you there!
          </p>
        </header>

        {fetchError && (
          <Alert variant="destructive" className="max-w-2xl mx-auto mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{fetchError.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-4xl mx-auto mb-12">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by title, location, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg rounded-xl shadow-sm border-muted-foreground/20 focus:border-primary"
              disabled={isLoading}
            />
          </div>
          
          {user?.is_admin && (
            <Button size="lg" onClick={() => { setEditingEvent(null); setIsDialogOpen(true); }} className="rounded-xl h-12 px-6 font-bold">
              <PlusCircle className="mr-2 h-5 w-5" /> Add Event
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {showSkeleton ? (
            [...Array(6)].map((_, i) => (
              <Card key={i} className="shadow-lg rounded-2xl overflow-hidden border-none">
                <div className="h-48 bg-muted animate-pulse" />
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))
          ) : events && events.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-muted-foreground/20">
              <CalendarDays className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-2xl font-bold font-lora text-muted-foreground">No events found</h3>
              <p className="text-muted-foreground mt-2">Try adjusting your search or check back later.</p>
            </div>
          ) : (
            events?.map((event) => {
              const eventDate = new Date(event.date);
              const isPast = eventDate < new Date();
              
              return (
                <Card key={event.id} className={cn(
                  "group flex flex-col overflow-hidden transition-all duration-300 border-none shadow-md hover:shadow-xl bg-card rounded-2xl",
                  isPast && "opacity-60 grayscale-[0.5]"
                )}>
                  {/* Date Header */}
                  <div className="bg-primary p-4 text-primary-foreground flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 opacity-80" />
                      <span className="text-sm font-bold uppercase tracking-widest">
                        {format(eventDate, "EEEE, MMM do")}
                      </span>
                    </div>
                    {isPast && <Badge variant="secondary" className="bg-white/20 text-white border-none">Past Event</Badge>}
                  </div>

                  <CardContent className="p-6 flex-grow flex flex-col gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-2xl font-bold font-lora leading-tight group-hover:text-primary transition-colors">
                          {event.title}
                        </CardTitle>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleShare(event)}>
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{event.location}</span>
                        </div>
                      )}
                    </div>

                    {event.description && (
                      <p className="text-muted-foreground line-clamp-3 leading-relaxed text-sm">
                        {event.description}
                      </p>
                    )}

                    <div className="mt-auto pt-4 flex flex-col gap-3">
                      {event.humanitix_link ? (
                        <Button asChild className="w-full font-bold group/btn" size="lg">
                          <a href={event.humanitix_link} target="_blank" rel="noopener noreferrer">
                            RSVP on Humanitix <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full" disabled>Details Coming Soon</Button>
                      )}

                      {user?.is_admin && (
                        <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingEvent(event); setIsDialogOpen(true); }} className="text-muted-foreground hover:text-primary">
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Event?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently remove "{event.title}".</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(event.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {user?.is_admin && (
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