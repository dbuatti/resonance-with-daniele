"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarDays, ExternalLink, PlusCircle, Edit, Trash2, Search, AlertCircle, MapPin, Clock, Share2, Sparkles, Calendar as CalendarIcon, MessageSquareQuote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { showSuccess, showError } from "@/utils/toast";
import { useSession } from "@/integrations/supabase/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EventDialog from "@/components/events/EventDialog";
import FeedbackEmailModal from "@/components/admin/FeedbackEmailModal";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/ui/BackButton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

const Events: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEventForFeedback, setSelectedEventForFeedback] = useState<Event | null>(null);
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
    } catch (error) {
      showError("Failed to delete event.");
    }
  };

  const handleShare = (event: Event) => {
    const shareUrl = event.humanitix_link || window.location.href;
    navigator.clipboard.writeText(shareUrl);
    showSuccess(`Link for "${event.title}" copied to clipboard!`);
  };

  return (
    <div className="py-8 space-y-12">
      <BackButton to="/" />
      
      <header className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-black font-lora tracking-tighter">Upcoming Events</h1>
        <p className="text-xl text-muted-foreground max-w-2xl font-medium">
          Join us for rehearsals, performances, and social gatherings.
        </p>
      </header>

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{fetchError.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 rounded-xl font-bold"
          />
        </div>
        {user?.is_admin && (
          <Button size="lg" onClick={() => { setEditingEvent(null); setIsDialogOpen(true); }} className="rounded-xl h-12 px-6 font-bold">
            <PlusCircle className="mr-2 h-5 w-5" /> Add Event
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)
        ) : events && events.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
            <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-xl font-bold text-muted-foreground font-lora">No events found.</p>
          </div>
        ) : (
          events?.map((event) => {
            const eventDate = new Date(event.date);
            const isPast = eventDate < new Date();
            
            return (
              <div key={event.id} className={cn(
                "group flex flex-col p-8 rounded-[2rem] border-2 transition-all duration-500",
                isPast ? "opacity-60 bg-muted/30 border-transparent" : "bg-card border-primary/5 hover:border-primary/20 hover:shadow-xl"
              )}>
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary mb-2">
                      {format(eventDate, "EEEE, MMM do")}
                    </Badge>
                    <h3 className="text-2xl font-black font-lora leading-tight group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => handleShare(event)}>
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  {event.location && (
                    <div className="flex items-center gap-3 text-muted-foreground font-bold">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span className="text-sm">{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-muted-foreground font-bold">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-sm">10:00 am – 1:00 pm</span>
                  </div>
                </div>

                <p className="text-muted-foreground font-medium leading-relaxed mb-8 line-clamp-3">
                  {event.description || "Join us for a morning of harmony and connection."}
                </p>

                <div className="mt-auto space-y-4">
                  {event.humanitix_link ? (
                    <Button asChild className="w-full h-14 font-black text-lg rounded-xl shadow-lg" size="lg">
                      <a href={event.humanitix_link} target="_blank" rel="noopener noreferrer">
                        Book Your Spot <ExternalLink className="ml-2 h-5 w-5" />
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full h-14 font-bold rounded-xl" disabled>Details Coming Soon</Button>
                  )}

                  {user?.is_admin && (
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingEvent(event); setIsDialogOpen(true); }} className="font-bold">
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="font-bold text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[2rem]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-2xl font-black font-lora">Delete Event?</AlertDialogTitle>
                              <AlertDialogDescription className="text-lg font-medium">This will permanently remove "{event.title}".</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(event.id)} className="bg-destructive hover:bg-destructive/90 rounded-xl font-bold">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      {isPast && (
                        <Button variant="secondary" size="sm" onClick={() => { setSelectedEventForFeedback(event); setIsFeedbackModalOpen(true); }} className="font-bold">
                          <MessageSquareQuote className="h-4 w-4 mr-2" /> Feedback
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {user?.is_admin && (
        <>
          <EventDialog 
            isOpen={isDialogOpen} 
            onClose={() => setIsDialogOpen(false)} 
            editingEvent={editingEvent} 
            userId={user.id} 
          />
          {selectedEventForFeedback && (
            <FeedbackEmailModal 
              isOpen={isFeedbackModalOpen}
              onClose={() => setIsFeedbackModalOpen(false)}
              eventId={selectedEventForFeedback.id}
              eventTitle={selectedEventForFeedback.title}
              eventDate={format(new Date(selectedEventForFeedback.date), "EEEE, MMM do")}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Events;