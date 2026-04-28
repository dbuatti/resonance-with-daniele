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
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle2, Mail, Loader2, ExternalLink, Users, Ticket, Heart, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { showSuccess } from "@/utils/toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface EmailMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle?: string;
  eventDate?: string;
  eventLink?: string;
  eventLocation?: string;
  eventStartTime?: string;
  eventEndTime?: string;
}

type Segment = "all" | "tickets" | "interested" | "members";

const EmailMembersModal: React.FC<EmailMembersModalProps> = ({
  isOpen,
  onClose,
  eventTitle,
  eventDate,
  eventLink,
  eventLocation,
  eventStartTime,
  eventEndTime,
}) => {
  const [copiedEmails, setCopiedEmails] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [activeSegment, setActiveSegment] = useState<Segment>("all");

  const { data: emailData, isLoading } = useQuery({
    queryKey: ["allMemberEmailsGlobal"],
    queryFn: async () => {
      // 1. Fetch from Profiles (Members)
      const { data: profiles } = await supabase.from("profiles").select("email");
      const memberEmails = Array.from(new Set((profiles?.map((p) => p.email?.toLowerCase().trim()) || []).filter(Boolean))) as string[];
      
      // 2. Fetch from Interest Submissions (Interested)
      const { data: interests } = await supabase.from("interest_submissions").select("email");
      const interestedEmails = Array.from(new Set((interests?.map((i) => i.email?.toLowerCase().trim()) || []).filter(Boolean))) as string[];
      
      // 3. Fetch from ALL Event Orders (Ticket Buyers)
      const { data: orders } = await supabase.from("event_orders").select("email");
      const ticketEmails = Array.from(new Set((orders?.map((o) => o.email?.toLowerCase().trim()) || []).filter(Boolean))) as string[];
      
      // 4. Combined (Deduplicated)
      const allEmails = Array.from(new Set([...memberEmails, ...interestedEmails, ...ticketEmails]));
      
      return {
        members: memberEmails,
        interested: interestedEmails,
        tickets: ticketEmails,
        all: allEmails,
        counts: {
          members: memberEmails.length,
          interested: interestedEmails.length,
          tickets: ticketEmails.length,
          all: allEmails.length
        }
      };
    },
    enabled: isOpen,
  });

  const currentList = useMemo(() => {
    if (!emailData) return "";
    return emailData[activeSegment].join(", ");
  }, [emailData, activeSegment]);

  const sampleBody = useMemo(() => {
    const timeStr = eventStartTime && eventEndTime ? `${eventStartTime} - ${eventEndTime}` : "10:00am - 1:00pm";
    return `Hi everyone,\n\nI’d love to see you back in the circle for ${eventTitle || "our next session"} on ${eventDate || "the upcoming date"}. ${timeStr} at ${eventLocation || "Armadale Baptist Church"}.\n\nYou can grab your spot and see all the details here: ${eventLink || "https://events.humanitix.com/resonance-choir"}\n\nHope to see you there!\n\n— Daniele`;
  }, [eventTitle, eventDate, eventLink, eventLocation, eventStartTime, eventEndTime]);

  const copyToClipboard = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    showSuccess("Copied to clipboard!");
    setTimeout(() => setter(false), 2000);
  };

  const segments = [
    { id: "all", label: "All Contacts", icon: Users, count: emailData?.counts.all || 0 },
    { id: "tickets", label: "Ticket Buyers", icon: Ticket, count: emailData?.counts.tickets || 0 },
    { id: "interested", label: "Interested", icon: Heart, count: emailData?.counts.interested || 0 },
    { id: "members", label: "Members", icon: UserCheck, count: emailData?.counts.members || 0 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] rounded-[2.5rem] max-h-[90vh] overflow-y-auto border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black font-lora flex items-center gap-3">
            <Mail className="h-8 w-8 text-primary" /> Global Broadcast
          </DialogTitle>
          <DialogDescription className="text-lg font-medium">
            Select your audience and grab the BCC list for your email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Segment Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {segments.map((seg) => (
              <button
                key={seg.id}
                onClick={() => setActiveSegment(seg.id as Segment)}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300",
                  activeSegment === seg.id 
                    ? "bg-primary border-primary text-primary-foreground shadow-lg scale-105" 
                    : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50"
                )}
              >
                <seg.icon className={cn("h-5 w-5 mb-2", activeSegment === seg.id ? "text-accent" : "text-primary/40")} />
                <span className="text-[10px] font-black uppercase tracking-widest mb-1">{seg.label}</span>
                <span className="text-xl font-black">{isLoading ? "..." : seg.count}</span>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end px-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Recipient Emails (BCC) — {segments.find(s => s.id === activeSegment)?.label}
              </Label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[10px] font-black hover:bg-primary/5"
                onClick={() => copyToClipboard(currentList, setCopiedEmails)}
                disabled={!currentList}
              >
                {copiedEmails ? <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
                COPY BCC LIST
              </Button>
            </div>
            <div className="relative">
              {isLoading ? (
                <div className="h-24 flex items-center justify-center bg-muted/30 rounded-2xl border-2 border-dashed">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Textarea 
                  readOnly 
                  value={currentList} 
                  className="h-24 bg-muted/30 border-none rounded-2xl text-xs font-mono resize-none p-4 focus-visible:ring-0"
                />
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end px-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sample Body Copy</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[10px] font-black hover:bg-primary/5"
                onClick={() => copyToClipboard(sampleBody, setCopiedBody)}
              >
                {copiedBody ? <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
                COPY BODY
              </Button>
            </div>
            <ScrollArea className="h-40 w-full rounded-2xl border-2 border-primary/10 bg-card p-6">
              <p className="text-sm whitespace-pre-wrap text-muted-foreground italic leading-relaxed">
                {sampleBody}
              </p>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="sm:justify-start gap-3">
          <Button variant="outline" className="rounded-xl font-bold h-12 px-6" onClick={onClose}>
            Close
          </Button>
          <Button className="rounded-xl font-black h-12 px-8 ml-auto shadow-lg" asChild disabled={!currentList}>
            <a href={`mailto:?bcc=${currentList}&subject=${encodeURIComponent(`A message from Resonance with Daniele`)}`}>
              <ExternalLink className="h-4 w-4 mr-2" /> Open in Mail App
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailMembersModal;