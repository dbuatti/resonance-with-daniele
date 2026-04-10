"use client";

import React from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays, MapPin, MessageSquareQuote, Share2, Edit, Trash2, ExternalLink, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface Event {
  id: string;
  user_id: string;
  title: string;
  date: string;
  location?: string;
  description?: string;
  humanitix_link?: string;
  ai_chat_link?: string; // Added field
}

interface EventHorizontalCardProps {
  event: Event;
  isAdmin: boolean;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onShare: (event: Event) => void;
  onFeedback: (event: Event) => void;
}

const EventHorizontalCard: React.FC<EventHorizontalCardProps> = ({
  event,
  isAdmin,
  onEdit,
  onDelete,
  onShare,
  onFeedback,
}) => {
  const eventDate = parseISO(event.date);
  const isPast = eventDate < new Date();

  return (
    <div className={cn(
      "group flex flex-col md:flex-row items-center gap-6 p-4 md:p-6 rounded-2xl border-2 transition-all duration-300",
      isPast ? "bg-muted/20 border-transparent opacity-80 hover:opacity-100" : "bg-card border-primary/5 hover:border-primary/20 hover:shadow-md"
    )}>
      {/* Date Block */}
      <div className="flex flex-row md:flex-col items-center justify-center min-w-[100px] text-center p-3 bg-background rounded-xl border border-border/50 shadow-sm">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {format(eventDate, "MMM")}
        </span>
        <span className="text-2xl font-black font-lora text-primary leading-none">
          {format(eventDate, "dd")}
        </span>
        <span className="hidden md:block text-[10px] font-bold text-muted-foreground mt-1">
          {format(eventDate, "yyyy")}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1 text-center md:text-left">
        <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mb-1">
          {isPast ? (
            <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest px-2 py-0">Past Event</Badge>
          ) : (
            <Badge className="bg-green-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0">Upcoming</Badge>
          )}
          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {event.location || "Armadale"}
          </span>
        </div>
        <h3 className="text-xl font-black font-lora leading-tight truncate group-hover:text-primary transition-colors">
          {event.title}
        </h3>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-center items-center gap-2">
        {isPast ? (
          <Button variant="outline" size="sm" onClick={() => onFeedback(event)} className="rounded-xl font-bold h-10 px-4 border-primary/20 text-primary hover:bg-primary/5">
            <MessageSquareQuote className="h-4 w-4 mr-2" /> Feedback
          </Button>
        ) : (
          <Button asChild size="sm" className="rounded-xl font-bold h-10 px-4 shadow-lg">
            <a href={event.humanitix_link} target="_blank" rel="noopener noreferrer">
              Book <ExternalLink className="h-3 w-3 ml-2" />
            </a>
          </Button>
        )}

        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground" onClick={() => onShare(event)}>
          <Share2 className="h-4 w-4" />
        </Button>

        {isAdmin && (
          <div className="flex items-center gap-1 border-l pl-2 ml-1 border-border/50">
            {event.ai_chat_link && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-primary hover:bg-primary/10" asChild>
                      <a href={event.ai_chat_link} target="_blank" rel="noopener noreferrer">
                        <Sparkles className="h-4 w-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open AI Chat</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => onEdit(event)}>
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[2rem]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-black font-lora">Delete Event?</AlertDialogTitle>
                  <AlertDialogDescription className="text-lg font-medium">This will permanently remove "{event.title}".</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(event.id)} className="bg-destructive hover:bg-destructive/90 rounded-xl font-bold">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventHorizontalCard;