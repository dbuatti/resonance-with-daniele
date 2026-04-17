"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarDays, PlusCircle, Search, AlertCircle, MapPin, Clock, Share2, Sparkles, Calendar as CalendarIcon, ArrowRight, ExternalLink, Info, Edit, ShieldCheck, Loader2 } from "lucide-react";
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

  useEffect(() => {
    if (!loadingUserSession && (!user || !user.is_admin)) {
      navigate("/");
      showError("Access Denied: This page is for administrators only.");
    }
  }, [user, loadingUserSession, navigate]);

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
    enabled: !loadingUserSession && !!user?.is_admin,
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

  const handleFeedback = (event: Event) => {
    setSelectedEventForFeedback(event);
    setIsFeedbackModalOpen(true);
  };

  if (loadingUserSession || !user?.is_admin) {
    return <div className="p-20 text-center"><Loader2 className="animate-spin h-12 w-12 mx-auto text-primary" /></div>;
  }

  return (
    <div className="py-2 space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck className="h-3 w-3" />
            <span>Event Operations</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black font-lora tracking-tighter leading-none">
            Manage Sessions
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl font-medium">
            Create new sessions, manage logistics, and access AI planning tools.
          </p>
        </div>
        <Button onClick={() => { setEditingEvent(null); setIsDialogOpen(true); }} size="lg" className="rounded-xl font-black shadow-xl h-14 px-8">
          <PlusCircle className="mr-2 h-6 w-6" /> Create New Event
        </Button>
      </header>

      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{fetchError.message}</AlertDescription>
        </Alert>
      )}

      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black font-lora flex items-center gap-3">
              <CalendarIcon className="h-6 w-6 text-primary" /> Event Registry
            </h2>
            <p className="text-sm font-medium text-muted-foreground">Search and manage all past and upcoming sessions.</p>
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
          ) : events?.length === 0 ? (
            <div className="text-center py-20 bg-muted/10 rounded-[2rem] border-4 border-dashed border-border/50">
              <CalendarDays className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-10" />
              <p className="text-xl font-bold text-muted-foreground font-lora">No events found matching your search.</p>
            </div>
          ) : (
            events?.map((event) => (
              <EventHorizontalCard
                key={event.id}
                event={event}
                isAdmin={true}
                onEdit={(e) => { setEditingEvent(e); setIsDialogOpen(true); }}
                onDelete={handleDelete}
                onShare={handleShare}
                onFeedback={handleFeedback}
              />
            ))
          )}
        </div>
      </section>

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
          eventDate={format(parseISO(selectedEventForFeedback.date), "EEEE, MMM do")}
        />
      )}
    </div>
  );
};

export default Events;