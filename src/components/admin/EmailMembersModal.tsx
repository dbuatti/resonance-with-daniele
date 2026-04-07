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
import { Copy, CheckCircle2, Mail, Loader2, ExternalLink } from "lucide-react";
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
}

const EmailMembersModal: React.FC<EmailMembersModalProps> = ({
  isOpen,
  onClose,
  eventTitle,
  eventDate,
  eventLink,
}) => {
  const [copiedEmails, setCopiedEmails] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  const { data: emails, isLoading } = useQuery({
    queryKey: ["allMemberEmails"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("email");
      const { data: interests } = await supabase.from("interest_submissions").select("email");
      
      const all = [
        ...(profiles?.map((p) => p.email) || []),
        ...(interests?.map((i) => i.email) || []),
      ].filter(Boolean) as string[];

      return Array.from(new Set(all.map(e => e.toLowerCase().trim()))).join(", ");
    },
    enabled: isOpen,
  });

  const sampleBody = useMemo(() => {
    return `Hi everyone,\n\nI’d love to see you back in the circle for ${eventTitle || "our next session"} on ${eventDate || "the upcoming date"}.\n\nWe're going to be working on some beautiful new harmonies and I can't wait to hear the room full of voices again.\n\nYou can grab your spot and see all the details here: ${eventLink || "https://events.humanitix.com/resonance-choir"}\n\nHope to see you there!\n\n— Daniele`;
  }, [eventTitle, eventDate, eventLink]);

  const copyToClipboard = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    showSuccess("Copied to clipboard!");
    setTimeout(() => setter(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black font-lora flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" /> Email Member List
          </DialogTitle>
          <DialogDescription className="text-base font-medium">
            Copy these emails into the <strong>BCC</strong> field of your email client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recipient Emails (BCC)</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[10px] font-black"
                onClick={() => copyToClipboard(emails || "", setCopiedEmails)}
                disabled={!emails}
              >
                {copiedEmails ? <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
                COPY ALL
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
                  value={emails || ""} 
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
            <ScrollArea className="h-48 w-full rounded-xl border-2 border-primary/10 bg-card p-4">
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
          <Button className="rounded-xl font-bold ml-auto" asChild>
            <a href={`mailto:?bcc=${emails || ""}&subject=${encodeURIComponent(`Singing together for ${eventTitle || "Resonance"}`)}`}>
              <ExternalLink className="h-4 w-4 mr-2" /> Open in Mail App
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailMembersModal;