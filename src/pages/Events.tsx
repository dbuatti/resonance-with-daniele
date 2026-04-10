"use client";

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarDays, PlusCircle, Search, AlertCircle, MapPin, Clock, Share2, Sparkles, Calendar as CalendarIcon, ArrowRight, ExternalLink, Info, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { format, parseISO, isAfter, startOfToday } from "date-fns";
import { showSuccess, showError } from "@/utils/toast";
import { useSession } from "@/integrations/supabase/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EventDialog from "@/components/events/EventDialog";
import FeedbackEmailModal from "@/components/admin/FeedbackEmailModal";
import EventHorizontalCard from "@/components/events/EventHorizontalCard";
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
  ai_chat_link?: string;
  main_song?: string;
}

const Events: React.FC = () => {
  const navigate = useNavigate();
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
      .order("date", { ascending: false });

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

  const { featuredEvent, otherEvents } = useMemo(() => {
    if (!events) return { featuredEvent: null, otherEvents: [] };
    
    const today = startOfToday();
    const upcoming = events
      .filter(e => !isAfter(today, parseISO(e.date)))
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    
    const past = events
      .filter(e => isAfter(today, parseISO(e.date)))
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

    const featured = upcoming.length > 0 ? upcoming[0] : null;
    const others = upcoming.length > 0 
      ? [...upcoming.slice(1), ...past] 
      : past;

    return { featuredEvent: featured, otherEvents: others };
  }, [events]);

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

  const handleFeedback = (event: Event) => {
    if (user?.is_admin) {
      setSelectedEventForFeedback(event);
      setIsFeedbackModalOpen(true);
    } else {
      navigate(`/feedback?eventId=${event.id}`);
    }
  };

  return (
    <div className="py-8 space-y-12 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <BackButton to="/" />
        {user?.is_admin && (
          <Button onClick={() => { setEditingEvent(null); setIsDialogOpen(true); }} className="rounded-xl font-bold shadow-lg">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Event
          </Button>
        )}
      </div>

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{fetchError.message}</AlertDescription>
        </Alert>
      )}

      {/* Featured Event Section */}
      <section className="space-y-6">
        {isLoading ? (
          <Skeleton className="h-[400px] w-full rounded-[3rem]" />
        ) : featuredEvent ? (
          <div className="relative group overflow-hidden rounded-[3rem] bg-primary text-primary-foreground shadow-2xl border-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center">
              <div className="flex-1 space-y-6 text-center md:text-left">
                <div className="space-y-2">
                  <Badge className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Next Session</Badge>
                  <h1 className="text-4xl md:text-7xl font-black font-lora tracking-tighter leading-none">
                    {featuredEvent.title}
                  </h1>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-6">
                  <div className="flex items-center gap-3 text-lg font-bold">
                    <CalendarIcon className="h-6 w-6 text-accent" />
                    <span>{format(parseISO(featuredEvent.date), "EEEE, MMMM do")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-lg font-bold">
                    <MapPin className="h-6 w-6 text-accent" />
                    <span>{featuredEvent.location || "Armadale Baptist Church"}</span>
                  </div>
                </div>

                <p className="text-xl opacity-90 font-medium leading-relaxed max-w-2xl">
                  {featuredEvent.description || "Join us for a morning of harmony and connection. No auditions, no experience needed—just bring your voice!"}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                  <Button asChild size="lg" className="h-16 px-10 text-xl font-black rounded-2xl bg-white text-primary hover:bg-white/90 shadow-2xl group/btn w-full sm:w-auto">
                    <a href={featuredEvent.humanitix_link} target="_blank" rel="noopener noreferrer">
                      Book Your Spot <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover/btn:translate-x-2" />
                    </a>
                  </Button>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <Button variant="ghost" className="text-white hover:bg-white/10 font-bold" onClick={() => handleShare(featuredEvent)}>
                      <Share2 className="h-5 w-5 mr-2" /> Share
                    </Button>
                    {user?.is_admin && (
                      <>
                        <Button 
                          variant="ghost" 
                          className="text-white hover:bg-white/10 font-bold" 
                          onClick={() => { setEditingEvent(featuredEvent); setIsDialogOpen(true); }}
                        >
                          <Edit className="h-5 w-5 mr-2" /> Edit
                        </Button>
                        {featuredEvent.ai_chat_link && (
                          <Button variant="ghost" className="text-accent hover:bg-accent/10 font-bold" asChild>
                            <a href={featuredEvent.ai_chat_link} target="_blank" rel="noopener noreferrer">
                              <Sparkles className="h-5 w-5 mr-2" /> AI Chat
                            </a>
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="hidden lg:block w-72 h-72 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/20 rotate-3">
                <img src="/images/choir-session-2.jpg" alt="Choir session" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        ) : !searchTerm && (
          <div className="text-center py-20 bg-muted/20 rounded-[3rem] border-4 border-dashed border-border">
            <CalendarDays className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h2 className="text-3xl font-black font-lora text-muted-foreground">No upcoming sessions scheduled</h2>
            <p className="text-muted-foreground font-medium mt-2">Check back soon for new dates in Armadale!</p>
          </div>
        )}
      </section>

      {/* Search and List Section */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black font-lora flex items-center gap-3">
              <CalendarIcon className="h-6 w-6 text-primary" /> Past & Other Events
            </h2>
            <p className="text-sm font-medium text-muted-foreground">Browse our history and catch up on feedback.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl font-bold bg-muted/30 border-none focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
          ) : otherEvents.length === 0 ? (
            <div className="text-center py-12 bg-muted/10 rounded-2xl border-2 border-dashed border-border/50">
              <p className="text-muted-foreground font-medium">No other events found.</p>
            </div>
          ) : (
            otherEvents.map((event) => (
              <EventHorizontalCard
                key={event.id}
                event={event}
                isAdmin={!!user?.is_admin}
                onEdit={(e) => { setEditingEvent(e); setIsDialogOpen(true); }}
                onDelete={handleDelete}
                onShare={handleShare}
                onFeedback={handleFeedback}
              />
            ))
          )}
        </div>
      </section>

      {user?.is_admin && (
        <EventDialog 
          isOpen={isDialogOpen} 
          onClose={() => setIsDialogOpen(false)} 
          editingEvent={editingEvent} 
          userId={user.id} 
        />
      )}

      {selectedEventForFeedback && (
        <FeedbackEmailModal 
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          eventId={selectedEventForFeedback.id}
          eventTitle={selectedEventForFeedback.title}
          eventDate={format(parseISO(selectedEventForFeedback.date), "EEEE, MMM do")}
        />
      )}
    </div>
  );
};

export default Events;