"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquareQuote, Copy, ExternalLink, Calendar, CheckCircle2, ClipboardList } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import { format, parseISO } from "date-fns";
import GlobalFeedbackPanel from "@/components/admin/GlobalFeedbackPanel";
import FeedbackEmailModal from "@/components/admin/FeedbackEmailModal";
import SurveyMetricsCard from "@/components/admin/SurveyMetricsCard";

const AdminFeedback: React.FC = () => {
  const navigate = useNavigate();
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: events } = useQuery({
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

  const getFeedbackLink = (eventId: string) => {
    return `${window.location.origin}/feedback/${eventId}`;
  };

  const copyLink = (eventId: string) => {
    navigator.clipboard.writeText(getFeedbackLink(eventId));
    setCopied(true);
    showSuccess("Feedback link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setSelectedEventId(event.id);
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black font-lora tracking-tight flex items-center gap-3">
            <MessageSquareQuote className="h-8 w-8 text-primary" />
            Feedback Center
          </h1>
          <p className="text-muted-foreground mt-2">Consolidated feedback view and link generation</p>
        </div>
      </div>

      <Tabs defaultValue="event-feedback" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="event-feedback" className="flex items-center gap-2">
            <MessageSquareQuote className="h-4 w-4" />
            Event Feedback
          </TabsTrigger>
          <TabsTrigger value="signup-survey" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Signup Survey
          </TabsTrigger>
        </TabsList>

        <TabsContent value="event-feedback" className="space-y-8">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Generate Feedback Links</CardTitle>
          <CardDescription>Create shareable feedback links for specific events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {events?.map((event) => (
              <Card key={event.id} className="p-4 hover:border-primary/50 cursor-pointer transition-colors" onClick={() => handleSelectEvent(event)}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-bold">{event.title}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(parseISO(event.date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
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
            <div className="p-4 bg-muted/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">{selectedEvent.title}</p>
                  <p className="text-sm text-muted-foreground">{format(parseISO(selectedEvent.date), "EEEE, MMMM d, yyyy")}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={getFeedbackLink(selectedEvent.id)} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Preview
                    </a>
                  </Button>
                  <Button size="sm" onClick={() => setEmailModalOpen(true)}>
                    Request Feedback
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input value={getFeedbackLink(selectedEvent.id)} readOnly className="font-mono text-sm" />
                <Button onClick={() => copyLink(selectedEvent.id)}>
                  {copied && selectedEventId === selectedEvent.id ? "Copied!" : "Copy Link"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <GlobalFeedbackPanel />
        </TabsContent>

        <TabsContent value="signup-survey">
          <SurveyMetricsCard profiles={profiles || []} loading={profilesLoading} />
        </TabsContent>
      </Tabs>

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

export default AdminFeedback;
