"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CalendarDays, Check, ChevronsUpDown, Plus } from "lucide-react";

interface EventSummary {
  id: string;
  title: string;
  date: string;
}

interface EventSwitcherProps {
  events: EventSummary[];
  selectedEventId?: string;
  onCreate?: () => void;
}

const EventSwitcher: React.FC<EventSwitcherProps> = ({ events, selectedEventId, onCreate }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const handleSelect = (eventId: string) => {
    setOpen(false);
    navigate(`/admin/events/${eventId}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full sm:w-80 justify-between h-11 rounded-xl font-bold border-primary/20 hover:bg-primary/5"
          >
            <span className="flex items-center gap-2 truncate">
              <CalendarDays className="h-4 w-4 text-primary shrink-0" />
              {selectedEvent ? (
                <span className="truncate">{selectedEvent.title}</span>
              ) : (
                <span className="text-muted-foreground font-medium">Select an event...</span>
              )}
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(24rem,calc(100vw-2rem))] p-0">
          <Command>
            <CommandInput placeholder="Search events..." />
            <CommandList>
              <CommandEmpty>No events found.</CommandEmpty>
              <CommandGroup>
                {events.map((event) => (
                  <CommandItem
                    key={event.id}
                    value={`${event.title} ${format(parseISO(event.date), "yyyy MMM d")}`}
                    onSelect={() => handleSelect(event.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        selectedEventId === event.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-bold">{event.title}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {format(parseISO(event.date), "EEEE, MMMM d, yyyy")}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {onCreate && (
        <Button onClick={onCreate} className="h-11 rounded-xl font-bold px-3">
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">New</span>
        </Button>
      )}
    </div>
  );
};

export default EventSwitcher;
