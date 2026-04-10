"use client";

import React from "react";
import { BellRing, ArrowRight } from "lucide-react";
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
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (error || !announcements || announcements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <BellRing className={cn("h-4 w-4", unreadCount > 0 ? "text-primary animate-pulse" : "text-muted-foreground")} /> 
          Latest Updates
        </h3>
        {unreadCount > 0 && (
          <Badge className="bg-primary text-primary-foreground px-2 py-0.5 text-[9px] uppercase tracking-widest font-black">
            {unreadCount} New
          </Badge>
        )}
      </div>
      
      <div className="bg-muted/20 rounded-[2rem] overflow-hidden border border-border/50">
        <div className="divide-y divide-border/50">
          {announcements.map((announcement) => {
            const isNew = !announcement.is_read;
            return (
              <div key={announcement.id} className={cn(
                "p-8 transition-colors hover:bg-muted/30",
                isNew && "bg-primary/5"
              )}>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {isNew && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    <h4 className="font-black text-xl font-lora leading-tight">{announcement.title}</h4>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                    {format(new Date(announcement.created_at), "MMMM do, yyyy")}
                  </p>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    {announcement.content}
                  </p>
                  {announcement.link_url && (
                    <Button variant="link" className="p-0 h-auto mt-2 text-primary font-black group text-base" asChild>
                      <a href={announcement.link_url} target="_blank" rel="noopener noreferrer">
                        View Details <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LatestAnnouncementsCard;