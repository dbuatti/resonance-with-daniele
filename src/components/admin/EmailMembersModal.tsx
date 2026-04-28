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
import { Copy, CheckCircle2, Mail, Loader2, ExternalLink, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { showSuccess } from "@/utils/toast";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const { data: emailData, isLoading } = useQuery({
    queryKey: ["allMemberEmailsGlobal"],
    queryFn: async () => {
      // 1. Fetch from Profiles
      const { data: profiles } = await supabase.from("profiles").select("email");
      
      // 2. Fetch from Interest Submissions
      const { data: interests } = await supabase.from("interest_submissions").select("email");
      
      // 3. Fetch from ALL Event Orders (Ticket Buyers)
      const { data: orders } = await supabase.from("event_orders").select("email");
      
      const all = [
        ...(profiles?.map((p) => p.email) || []),
        ...(interests?.map((i) => i.email) || []),
        ...(orders?.map((o) => o.email) || []),
      ].filter(Boolean) as string[];

      const uniqueEmails = Array.from(new Set(all.map(e => e.toLowerCase().trim())));
      
      return {
        list: uniqueEmails.join(", "),
        count: uniqueEmails.length
      };
    },
    enabled: isOpen,
  });

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] rounded-[2rem] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black font-lora flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" /> Message All Members
          </DialogTitle>
          <DialogDescription className="text-base font-medium">
            This list includes everyone: registered members, interest leads, and all past ticket buyers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-primary/5 p-4 rounded-2xl flex items-center justify-between border border-primary/10">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm">Total Unique Contacts</span>
            </div>
            <Badge className="bg-primary text-primary-foreground font-black text-lg px-3 py-1 rounded-xl">
              {isLoading ? "..." : emailData?.count || 0}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recipient Emails (BCC)</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[10px] font-black"
                onClick={() => copyToClipboard(emailData?.list || "", setCopiedEmails)}
                disabled={!emailData?.list}
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
              ) : (
                <Textarea 
                  readOnly 
                  value={emailData?.list || ""} 
                  className="h-24 bg-muted/30 border-none rounded-xl text-xs font-mono resize-none"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sample Body Copy</Label>
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
          <Button className="rounded-xl font-bold ml-auto" asChild disabled={!emailData?.list}>
            <a href={`mailto:?bcc=${emailData?.list || ""}&subject=${encodeURIComponent(`A message from Resonance with Daniele`)}`}>
              <ExternalLink className="h-4 w-4 mr-2" /> Open in Mail App
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailMembersModal;