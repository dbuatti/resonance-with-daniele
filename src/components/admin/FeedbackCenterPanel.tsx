"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquareQuote, Copy, ExternalLink, Calendar, CheckCircle2, Link2, Mail, ClipboardList } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import { format, parseISO } from "date-fns";
import GlobalFeedbackPanel from "@/components/admin/GlobalFeedbackPanel";
import FeedbackEmailModal from "@/components/admin/FeedbackEmailModal";
import SurveyMetricsCard from "@/components/admin/SurveyMetricsCard";
import Section from "@/components/ui/section";
import EmptyState from "@/components/ui/empty-state";

/**
 * The global Feedback Center, extracted from the old standalone page so it can
 * live as a tab inside the Inbox. Generates per-event feedback links and
 * surfaces survey + comment insights.
 */
const FeedbackCenterPanel: React.FC = () => {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<{ id: string; title: string; date: string } | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: events, isLoading } = useQuery({
    queryKey: ["eventsForFeedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, date")
        .order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["adminProfilesForSurvey"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const getFeedbackLink = (eventId: string) => `${window.location.origin}/feedback/${eventId}`;

  const copyLink = (eventId: string) => {
    navigator.clipboard.writeText(getFeedbackLink(eventId));
    setCopied(true);
    showSuccess("Feedback link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectEvent = (event: { id: string; title: string; date: string }) => {
    setSelectedEvent(event);
    setSelectedEventId(event.id);
  };

  return (
    <div className="space-y-8">
      <Section
        title="Feedback Links"
        description="Generate a shareable feedback form for any session and send it to attendees."
        icon={<Link2 className="h-4 w-4" />}
      >
        {isLoading ? null : !events || events.length === 0 ? (
          <EmptyState
            icon={<MessageSquareQuote className="h-7 w-7" />}
            title="No events to collect feedback for"
            description="Create an event first, then generate its feedback link here."
          />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {events.map((event) => (
                <Card
                  key={event.id}
                  className={cnCard(selectedEventId === event.id)}
                  onClick={() => handleSelectEvent(event)}
                >
                  <div className="p-4 flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <p className="font-bold truncate">{event.title}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(event.date), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
                      aria-label="Copy feedback link"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyLink(event.id);
                      }}
                    >
                      {copied && selectedEventId === event.id ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {selectedEvent && (
              <div className="p-4 md:p-5 bg-muted/30 rounded-2xl space-y-4 border border-border/50">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black font-lora">{selectedEvent.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(selectedEvent.date), "EEEE, MMMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-lg font-bold" asChild>
                      <a href={getFeedbackLink(selectedEvent.id)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Preview
                      </a>
                    </Button>
                    <Button size="sm" className="rounded-lg font-bold" onClick={() => setEmailModalOpen(true)}>
                      <Mail className="h-4 w-4 mr-2" />
                      Request Feedback
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input value={getFeedbackLink(selectedEvent.id)} readOnly className="font-mono text-sm h-10" />
                  <Button variant="secondary" className="h-10 rounded-lg font-bold shrink-0" onClick={() => copyLink(selectedEvent.id)}>
                    {copied && selectedEventId === selectedEvent.id ? "Copied!" : "Copy Link"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      <GlobalFeedbackPanel />

      <Section
        title="Signup Survey"
        description="Aggregated answers from the new-member signup survey."
        icon={<ClipboardList className="h-4 w-4" />}
      >
        <SurveyMetricsCard profiles={profiles || []} loading={profilesLoading} />
      </Section>

      {selectedEvent && (
        <FeedbackEmailModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.title}
          eventDate={format(parseISO(selectedEvent.date), "EEEE, MMMM d, yyyy")}
        />
      )}
    </div>
  );
};

/** Small helper to keep the selectable-card styling readable. */
function cnCard(active: boolean) {
  return [
    "rounded-xl border cursor-pointer transition-all text-left",
    active
      ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20 shadow-sm"
      : "border-border/60 hover:border-primary/30 hover:shadow-sm",
  ].join(" ");
}

export default FeedbackCenterPanel;