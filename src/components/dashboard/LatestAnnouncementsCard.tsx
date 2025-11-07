"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BellRing, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useSession } from "@/integrations/supabase/auth"; // Import useSession to check for authenticated user
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Import cn

interface Announcement {
  id: string;
  title: string;
  content: string;
  link_url: string | null; // Added link_url
  created_at: string;
}

const LatestAnnouncementsCard: React.FC = () => {
  const { user, loading: loadingSession } = useSession();

  // Query function for fetching announcements
  const fetchAnnouncements = async (): Promise<Announcement[]> => {
    console.log("[LatestAnnouncementsCard] Fetching latest announcements.");
    const { data, error } = await supabase
      .from("announcements")
      .select("id, title, content, link_url, created_at") // Select link_url
      .order("created_at", { ascending: false })
      .limit(3); // Fetch up to 3 latest announcements

    if (error) {
      console.error("[LatestAnnouncementsCard] Error fetching announcements:", error);
      throw error;
    }
    console.log("[LatestAnnouncementsCard] Announcements fetched:", data?.length, "announcements.");
    return data || [];
  };

  // Use react-query for announcements data
  const { data: announcements, isLoading, error } = useQuery<
    Announcement[],
    Error,
    Announcement[],
    ['latestAnnouncements']
  >({
    queryKey: ['latestAnnouncements'],
    queryFn: fetchAnnouncements,
    enabled: !loadingSession && !!user, // Only fetch if session is not loading and user is authenticated
    staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Data stays in cache for 10 minutes
  });

  if (isLoading) {
    return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <Skeleton className="h-6 w-1/2 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg rounded-xl text-destructive">
        <CardHeader>
          <CardTitle className="text-xl font-lora flex items-center gap-2">
            <BellRing className="h-6 w-6 text-destructive" /> Announcements
          </CardTitle>
          <CardDescription>Error loading announcements.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!announcements || announcements.length === 0) {
    return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl font-lora flex items-center gap-2">
            <BellRing className="h-6 w-6 text-primary" /> Announcements
          </CardTitle>
          <CardDescription>Important updates from Daniele.</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-4">
          <p>No new announcements at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  // Apply high-contrast styling to the card
  return (
    <Card className={cn(
      "shadow-lg rounded-xl border-l-4 border-primary",
      "bg-primary/5 dark:bg-primary/10" // Subtle primary background
    )}>
      <CardHeader>
        <CardTitle className="text-xl font-lora flex items-center gap-2 text-primary">
          <BellRing className="h-6 w-6" /> Latest Announcements
        </CardTitle>
        <CardDescription>Important updates from Daniele.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="border-b last:border-b-0 pb-3 last:pb-0">
            <h3 className="font-semibold text-foreground text-lg">{announcement.title}</h3>
            <p className="text-sm text-muted-foreground mb-1">{format(new Date(announcement.created_at), "PPP")}</p>
            <p className="text-sm text-muted-foreground">{announcement.content}</p>
            {announcement.link_url && (
              <Button variant="link" className="p-0 h-auto mt-2 text-primary hover:underline" asChild>
                <a href={announcement.link_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1 h-4 w-4" /> View Details
                </a>
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default LatestAnnouncementsCard;