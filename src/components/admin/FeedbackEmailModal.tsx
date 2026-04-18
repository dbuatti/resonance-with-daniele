"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, CheckCircle2, Mail, Loader2, ExternalLink, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { showSuccess } from "@/utils/toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface FeedbackEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  eventDate: string;
}

const FeedbackEmailModal: React.FC<FeedbackEmailModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  eventDate,
}) => {
  const [copiedEmails, setCopiedEmails] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(`How was ${eventTitle}? 🎶`);

  const subjectSuggestions = useMemo(() => [
    `How was ${eventTitle}? 🎶`,
    "Your thoughts on our last session? ✨",
    "Help me make Resonance even better! 🌿",
    `A quick favor? (Feedback for ${eventTitle})`,
    "Missing the harmony? Share your thoughts! 🎵",
  ], [eventTitle]);

  // Fetch attendees and existing feedback to find who is missing
  const { data: emailData, isLoading } = useQuery({
    queryKey: ["missingFeedbackEmails", eventId],
    queryFn: async () => {
      // 1. Get all unique emails from Humanitix orders for this event
      const { data: orders } = await supabase
        .from("event_orders")
        .select("email")
        .eq("event_id", eventId);
      
      const attendeeEmails = new Set((orders?.map(o => o.email?.toLowerCase().trim()) || []).filter(Boolean));

      // 2. Get all user IDs who have already submitted feedback for this event
      const { data: feedback } = await supabase
        .from("event_feedback")
        .select("user_id")
        .eq("event_id", eventId);
      
      const feedbackUserIds = (feedback?.map(f => f.user_id) || []).filter(Boolean);

      // 3. Get emails for those user IDs
      let feedbackEmails = new Set<string>();
      if (feedbackUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("email")
          .in("id", feedbackUserIds);
        
        profiles?.forEach(p => {
          if (p.email) feedbackEmails.add(p.email.toLowerCase().trim());
        });
      }

      // 4. Filter: Attendees who haven't submitted feedback
      const missing = Array.from(attendeeEmails).filter(email => !feedbackEmails.has(email!));

      return {
        missing: missing.join(", "),
        totalAttendees: attendeeEmails.size,
        alreadySubmitted: feedbackEmails.size,
        missingCount: missing.length
      };
    },
    enabled: isOpen && !!eventId,
  });

  const feedbackLink = `${window.location.origin}/feedback?eventId=${eventId}`;

  const sampleBody = useMemo(() => {
    return `Hi everyone,\n\nThank you so much for joining us for ${eventTitle} on ${eventDate}! It was such a joy to sing together.\n\nI’d love to hear your thoughts on how the session went. Your feedback helps me make the next one even better. It only takes about 2 minutes and you can choose to submit anonymously if you prefer.\n\nYou can share your feedback here: ${feedbackLink}\n\nHope to see you in the circle again soon!\n\n— Daniele`;
  }, [eventTitle, eventDate, feedbackLink]);

  const copyToClipboard = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    showSuccess("Copied to clipboard!");
    setTimeout(() => setter(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] rounded-[2rem] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black font-lora flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" /> Feedback Request
          </DialogTitle>
          <DialogDescription className="text-base font-medium">
            Sending to attendees of <strong>{eventTitle}</strong> who haven't responded yet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Intelligence Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/30 p-3 rounded-2xl text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Attendees</p>
              <p className="text-xl font-black">{emailData?.totalAttendees || 0}</p>
            </div>
            <div className="bg-green-500/10 p-3 rounded-2xl text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-green-600">Responded</p>
              <p className="text-xl font-black text-green-600">{emailData?.alreadySubmitted || 0}</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-2xl text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Remaining</p>
              <p className="text-xl font-black text-primary">{emailData?.missingCount || 0}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recipient Emails (BCC)</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[10px] font-black"
                onClick={() => copyToClipboard(emailData?.missing || "", setCopiedEmails)}
                disabled={!emailData?.missing}
              >
                {copiedEmails ? <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
                COPY BCC LIST
              </Button>
            </div>
            <div className="relative">
              {isLoading ? (
                <div className="h-24 flex items-center justify-center bg-muted/30 rounded-xl border-2 border-dashed">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : emailData?.missingCount === 0 ? (
                <div className="h-24 flex flex-col items-center justify-center bg-green-500/5 rounded-xl border-2 border-dashed border-green-500/20 text-center p-4">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mb-2" />
                  <p className="text-xs font-bold text-green-700">Everyone has already submitted feedback!</p>
                </div>
              ) : (
                <Textarea 
                  readOnly 
                  value={emailData?.missing || ""} 
                  className="h-24 bg-muted/30 border-none rounded-xl text-xs font-mono resize-none"
                />
              )}
            </div>
          </div>

          {/* Subject Suggester */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" /> Suggested Subjects
              </Label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[10px] font-black"
                onClick={() => copyToClipboard(selectedSubject, setCopiedSubject)}
              >
                {copiedSubject ? <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
                COPY SELECTED
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-xl border border-border/50">
              {subjectSuggestions.map((subject) => (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={cn(
                    "text-left px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-2",
                    selectedSubject === subject 
                      ? "bg-primary border-primary text-white shadow-md scale-105" 
                      : "bg-background border-transparent text-muted-foreground hover:border-primary/20"
                  )}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Body</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[10px] font-black"
                onClick={() => copyToClipboard(sampleBody, setCopiedBody)}
              >
                {copiedBody ? <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
                COPY BODY
              </Button>
            </div>
            <ScrollArea className="h-40 w-full rounded-xl border-2 border-primary/10 bg-card p-4">
              <p className="text-sm whitespace-pre-wrap text-muted-foreground italic leading-relaxed">
                {sampleBody}
              </p>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="sm:justify-start">
          <Button variant="outline" className="rounded-xl font-bold" onClick={onClose}>
            Close
          </Button>
          <Button className="rounded-xl font-bold ml-auto" asChild disabled={!emailData?.missing}>
            <a href={`mailto:?bcc=${emailData?.missing || ""}&subject=${encodeURIComponent(selectedSubject)}`}>
              <ExternalLink className="h-4 w-4 mr-2" /> Open in Mail App
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackEmailModal;