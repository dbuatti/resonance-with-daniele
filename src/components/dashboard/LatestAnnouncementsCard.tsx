"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BellRing, ExternalLink, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useSession } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Announcement {
  id: string;
  title: string;
  content: string;
  link_url: string | null;
  created_at: string;
  is_read: boolean;
}

const LatestAnnouncementsCard: React.FC = () => {
  const { user, loading: loadingSession } = useSession();

  const fetchAnnouncements = async (): Promise<Announcement[]> => {
    const { data, error } = await supabase
      .from("announcements")
      .select("id, title, content, link_url, created_at")
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) throw error;
    
    const now = new Date();
    return (data || []).map((announcement) => {
      const createdDate = new Date(announcement.created_at);
      const isRecent = (now.getTime() - createdDate.getTime()) < (24 * 60 * 60 * 1000);
      return {
        ...announcement,
        is_read: !isRecent,
      };
    });
  };

  const { data: announcements, isLoading, error } = useQuery<Announcement[], Error, Announcement[], ['latestAnnouncements']>({
    queryKey: ['latestAnnouncements'],
    queryFn: fetchAnnouncements,
    enabled: !loadingSession && !!user,
    staleTime: 5 * 60 * 1000,
  });

  const unreadCount = (announcements || []).filter(a => !a.is_read).length;

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  if (error || !announcements || announcements.length === 0) {
    return (
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="text-xl font-lora flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" /> Announcements
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
          <p>No announcements at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "shadow-lg border-none overflow-hidden transition-all duration-300",
      unreadCount > 0 ? "ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10" : "bg-card"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-lora flex items-center gap-2">
            <BellRing className={cn("h-6 w-6", unreadCount > 0 ? "text-primary animate-pulse" : "text-muted-foreground")} /> 
            Latest Updates
          </CardTitle>
          {unreadCount > 0 && (
            <Badge className="bg-primary text-primary-foreground px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold">
              {unreadCount} New
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {announcements.map((announcement) => {
            const isNew = !announcement.is_read;
            return (
              <div key={announcement.id} className={cn(
                "p-6 transition-colors hover:bg-muted/30",
                isNew && "bg-primary/5 dark:bg-primary/10"
              )}>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {isNew && <div className="w-2 h-2 rounded-full bg-primary" />}
                      <h3 className="font-bold text-lg leading-tight">{announcement.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      {format(new Date(announcement.created_at), "MMMM do, yyyy")}
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {announcement.content}
                    </p>
                    {announcement.link_url && (
                      <Button variant="link" className="p-0 h-auto mt-2 text-primary font-bold group" asChild>
                        <a href={announcement.link_url} target="_blank" rel="noopener noreferrer">
                          View Details <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default LatestAnnouncementsCard;