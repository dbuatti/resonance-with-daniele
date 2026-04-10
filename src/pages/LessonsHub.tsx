"use client";

import React from "react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Music, BookOpen, Video, Mic2, FileText, StickyNote, Calendar } from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EventWithResources {
  id: string;
  title: string;
  date: string;
  lesson_notes: string | null;
  main_song: string | null;
  resources: any[];
}

const LessonsHub: React.FC = () => {
  const { user, loading: loadingSession } = useSession();

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['lessonsHubData'],
    queryFn: async () => {
      // 1. Fetch all events
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: false });
      
      if (eventsError) throw eventsError;

      // 2. Fetch all folders linked to events
      const { data: folders } = await supabase
        .from("resource_folders")
        .select("id, event_id");

      // 3. Fetch all resources
      const { data: resources } = await supabase
        .from("resources")
        .select("*")
        .eq("is_published", true);

      // 4. Map resources to events via folders
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

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Loading your lesson library...</p>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-12 max-w-6xl mx-auto px-4">
      <BackButton to="/" />
      
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
          <BookOpen className="h-3 w-3" />
          <span>Learning Portal</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black font-lora tracking-tighter">Lessons Hub</h1>
        <p className="text-xl text-muted-foreground max-w-2xl font-medium">
          Everything we've learned, organized by session. Access your tracks, lyrics, and my personal notes here.
        </p>
      </header>

      <div className="space-y-20">
        {eventsData?.map((event) => (
          <section key={event.id} className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4 border-primary/10 pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest border-primary/20">
                    {format(parseISO(event.date), "MMMM yyyy")}
                  </Badge>
                  {event.main_song && (
                    <Badge className="bg-accent text-accent-foreground font-black text-[10px] uppercase tracking-widest">
                      {event.main_song}
                    </Badge>
                  )}
                </div>
                <h2 className="text-3xl md:text-5xl font-black font-lora tracking-tight">{event.title}</h2>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground font-bold">
                <Calendar className="h-5 w-5" />
                {format(parseISO(event.date), "EEEE, do")}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Resources Column */}
              <div className="lg:col-span-7 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                  <Mic2 className="h-4 w-4" /> Practice Materials
                </h3>
                
                {event.resources.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {event.resources.map((res) => (
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
                              res.type === 'youtube' ? "bg-red-50 text-red-600" : 
                              res.type === 'lyrics' ? "bg-orange-50 text-orange-600" :
                              "bg-blue-50 text-blue-600"
                            )}>
                              {res.type === 'youtube' ? <Video className="h-5 w-5" /> : 
                               res.type === 'lyrics' ? <Mic2 className="h-5 w-5" /> : 
                               <FileText className="h-5 w-5" />}
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
                    <p className="text-sm font-medium text-muted-foreground">No specific resources uploaded for this session yet.</p>
                  </div>
                )}
              </div>

              {/* Notes Column */}
              <div className="lg:col-span-5 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                  <StickyNote className="h-4 w-4" /> Daniele's Notes
                </h3>
                <Card className="border-none shadow-xl bg-yellow-50/50 dark:bg-yellow-950/10 rounded-[2rem] overflow-hidden relative min-h-[200px]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                  <CardContent className="p-8 relative z-10">
                    {event.lesson_notes ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="text-lg font-medium font-lora italic leading-relaxed text-yellow-900 dark:text-yellow-200/80 whitespace-pre-wrap">
                          {event.lesson_notes}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-10 text-center space-y-3">
                        <StickyNote className="h-8 w-8 text-yellow-600/20" />
                        <p className="text-sm font-medium text-yellow-800/40 italic">No notes added for this session.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        ))}
      </div>

      <footer className="text-center pt-20 pb-10 border-t border-border/50">
        <Heart className="h-6 w-6 text-primary mx-auto mb-4 opacity-20" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em]">Keep Singing, Keep Growing</p>
      </footer>
    </div>
  );
};

export default LessonsHub;