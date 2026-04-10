"use client";

import React, { useEffect, useMemo } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Music, BookOpen, Video, Mic2, FileText, StickyNote, Calendar, Heart, History, ArrowRight, Youtube, Play } from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import { format, parseISO, isAfter, startOfToday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";

interface EventWithResources {
  id: string;
  title: string;
  date: string;
  lesson_notes: string | null;
  main_song: string | null;
  resources: any[];
}

const getYouTubeEmbedUrl = (url: string | null): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?rel=0&showinfo=0&modestbranding=1`;
  }
  return null;
};

const SessionHub: React.FC = () => {
  const { user, loading: loadingSession } = useSession();
  const { hash } = useLocation();

  const { data: allEvents, isLoading } = useQuery({
    queryKey: ['sessionHubData'],
    queryFn: async () => {
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: false });
      
      if (eventsError) throw eventsError;

      const { data: folders } = await supabase
        .from("resource_folders")
        .select("id, event_id");

      const { data: resources } = await supabase
        .from("resources")
        .select("*")
        .eq("is_published", true);

      return events.map(event => {
        const eventFolderIds = folders?.filter(f => f.event_id === event.id).map(f => f.id) || [];
        const eventResources = resources?.filter(r => eventFolderIds.includes(r.folder_id)) || [];
        
        return {
          ...event,
          resources: eventResources
        };
      });
    },
    enabled: !loadingSession
  });

  const { currentEvent, pastEvents } = useMemo(() => {
    if (!allEvents || allEvents.length === 0) return { currentEvent: null, pastEvents: [] };
    
    const today = startOfToday();
    const upcoming = allEvents
      .filter(e => !isAfter(today, parseISO(e.date)))
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    
    if (upcoming.length > 0) {
      const current = upcoming[0];
      const others = allEvents.filter(e => e.id !== current.id);
      return { currentEvent: current, pastEvents: others };
    }

    return { currentEvent: allEvents[0], pastEvents: allEvents.slice(1) };
  }, [allEvents]);

  useEffect(() => {
    if (!isLoading && hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [isLoading, hash]);

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Loading your session library...</p>
      </div>
    );
  }

  const renderEventContent = (event: EventWithResources) => {
    // Separate resources into videos and files/links
    const videoResources = event.resources.filter(r => r.type === 'youtube' || r.youtube_url);
    const fileResources = event.resources.filter(r => r.type !== 'youtube');
    const hasNotes = !!event.lesson_notes?.trim();

    return (
      <div className="space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Resources Column */}
          <div className={cn("space-y-6", hasNotes ? "lg:col-span-7" : "lg:col-span-12")}>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
              <Mic2 className="h-4 w-4" /> Practice Materials
            </h3>
            
            {fileResources.length > 0 ? (
              <div className={cn(
                "grid gap-4",
                hasNotes ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              )}>
                {fileResources.map((res) => (
                  <a 
                    key={res.id}
                    href={res.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <Card className="h-full border-2 border-primary/5 hover:border-primary/20 transition-all duration-300 hover:shadow-lg rounded-2xl overflow-hidden bg-card">
                      <CardContent className="p-5 flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-xl shrink-0 transition-transform group-hover:scale-110",
                          res.type === 'lyrics' ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {res.type === 'lyrics' ? <Mic2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{res.title}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">
                            {res.voice_part || res.type}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center bg-muted/20 rounded-[2rem] border-2 border-dashed border-border">
                <Music className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium text-muted-foreground">No files uploaded for this session yet.</p>
              </div>
            )}
          </div>

          {/* Notes Column */}
          {hasNotes && (
            <div className="lg:col-span-5 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                <StickyNote className="h-4 w-4" /> Daniele's Notes
              </h3>
              <Card className="border-none shadow-xl bg-yellow-50/50 dark:bg-yellow-950/10 rounded-[2rem] overflow-hidden relative min-h-[200px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <CardContent className="p-8 relative z-10">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-lg font-medium font-lora italic leading-relaxed text-yellow-900 dark:text-yellow-200/80 whitespace-pre-wrap">
                      {event.lesson_notes}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Video Embeds Section */}
        {videoResources.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
              <Play className="h-4 w-4" /> Video References
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {videoResources.map((res) => {
                const embedUrl = getYouTubeEmbedUrl(res.type === 'youtube' ? res.url : res.youtube_url);
                if (!embedUrl) return null;
                
                return (
                  <div key={res.id} className="space-y-3">
                    <div className="relative aspect-video rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800 bg-black">
                      <iframe
                        src={embedUrl}
                        title={res.title}
                        className="absolute inset-0 w-full h-full"
                        allowFullScreen
                      />
                    </div>
                    <div className="px-4">
                      <p className="font-bold text-sm">{res.title}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">
                        {res.voice_part ? `Part: ${res.voice_part}` : "Reference Video"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="py-8 space-y-16 max-w-6xl mx-auto px-4">
      <BackButton to="/" />
      
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
          <BookOpen className="h-3 w-3" />
          <span>Learning Portal</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black font-lora tracking-tighter">Session Hub</h1>
        <p className="text-xl text-muted-foreground max-w-2xl font-medium">
          Access your tracks, lyrics, and my personal notes for our current and past sessions.
        </p>
      </header>

      {/* Featured Current Session */}
      {currentEvent ? (
        <section id={`event-${currentEvent.id}`} className="space-y-10 animate-fade-in-up scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4 border-primary pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge className="bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest">
                  Current Session
                </Badge>
                {currentEvent.main_song && (
                  <Badge className="bg-accent text-accent-foreground font-black text-[10px] uppercase tracking-widest">
                    {currentEvent.main_song}
                  </Badge>
                )}
              </div>
              <h2 className="text-4xl md:text-6xl font-black font-lora tracking-tight">{currentEvent.title}</h2>
            </div>
            <div className="flex items-center gap-2 text-primary font-black text-xl">
              <Calendar className="h-6 w-6" />
              {format(parseISO(currentEvent.date), "EEEE, MMMM do")}
            </div>
          </div>

          {renderEventContent(currentEvent)}
        </section>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-[3rem] border-4 border-dashed border-border">
          <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h2 className="text-3xl font-black font-lora text-muted-foreground">No sessions found</h2>
        </div>
      )}

      {/* Past Sessions Section */}
      {pastEvents.length > 0 && (
        <section className="space-y-10 pt-16 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-black font-lora flex items-center gap-3">
                <History className="h-6 w-6 text-muted-foreground" /> Session History
              </h2>
              <p className="text-muted-foreground font-medium">Catch up on what we've learned in previous months.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-12">
            {pastEvents.map((event) => (
              <div key={event.id} id={`event-${event.id}`} className="space-y-8 scroll-mt-24">
                <div className="flex items-center gap-4">
                  <div className="bg-muted p-3 rounded-2xl">
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black font-lora">{event.title}</h3>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                      {format(parseISO(event.date), "MMMM yyyy")}
                    </p>
                  </div>
                </div>
                {renderEventContent(event)}
                <Separator className="opacity-50" />
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="text-center pt-20 pb-10 border-t border-border/50">
        <Heart className="h-6 w-6 text-primary mx-auto mb-4 opacity-20" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em]">Keep Singing, Keep Growing</p>
      </footer>
    </div>
  );
};

export default SessionHub;