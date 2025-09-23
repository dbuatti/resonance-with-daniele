"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/auth";
import { showSuccess, showError } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Loader2, Music, User as UserIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface SongSuggestion {
  id: string;
  user_id: string;
  title: string;
  artist: string;
  total_votes: number;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface UserVote {
  id: string;
  user_id: string;
  suggestion_id: string;
}

const SongVotingList: React.FC = () => {
  const { user, loading: loadingSession } = useSession();
  const queryClient = useQueryClient();

  // Fetch song suggestions
  const { data: songSuggestions, isLoading: loadingSuggestions, error: suggestionsError } = useQuery<
    SongSuggestion[],
    Error,
    SongSuggestion[],
    ['songSuggestions']
  >({
    queryKey: ['songSuggestions'],
    queryFn: async () => {
      console.log("[SongVotingList] Fetching song suggestions.");
      const { data, error } = await supabase
        .from("song_suggestions")
        .select(`
          *,
          profiles (first_name, last_name, avatar_url)
        `)
        .order("total_votes", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching song suggestions:", error);
        throw error;
      }
      return data || [];
    },
    enabled: !loadingSession,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch user's votes
  const { data: userVotes, isLoading: loadingUserVotes, error: userVotesError } = useQuery<
    UserVote[],
    Error,
    UserVote[],
    ['userVotes', string | undefined]
  >({
    queryKey: ['userVotes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log(`[SongVotingList] Fetching votes for user ${user.id}.`);
      const { data, error } = await supabase
        .from("user_song_votes")
        .select("id, suggestion_id, user_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching user votes:", error);
        throw error;
      }
      return data || [];
    },
    enabled: !loadingSession && !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });

  const hasVoted = (suggestionId: string) => {
    return userVotes?.some(vote => vote.suggestion_id === suggestionId);
  };

  const handleVote = async (suggestionId: string) => {
    if (!user) {
      showError("You must be logged in to vote.");
      return;
    }

    const existingVote = userVotes?.find(vote => vote.suggestion_id === suggestionId);

    if (existingVote) {
      // User wants to un-vote
      const { error } = await supabase
        .from("user_song_votes")
        .delete()
        .eq("id", existingVote.id);

      if (error) {
        console.error("Error un-voting:", error);
        showError("Failed to remove vote: " + error.message);
      } else {
        showSuccess("Vote removed!");
        queryClient.invalidateQueries({ queryKey: ['songSuggestions'] });
        queryClient.invalidateQueries({ queryKey: ['userVotes', user.id] });
      }
    } else {
      // User wants to vote
      const { error } = await supabase
        .from("user_song_votes")
        .insert({ user_id: user.id, suggestion_id: suggestionId });

      if (error) {
        console.error("Error voting:", error);
        showError("Failed to cast vote: " + error.message);
      } else {
        showSuccess("Vote cast successfully!");
        queryClient.invalidateQueries({ queryKey: ['songSuggestions'] });
        queryClient.invalidateQueries({ queryKey: ['userVotes', user.id] });
      }
    }
  };

  const isLoading = loadingSuggestions || loadingUserVotes;

  if (isLoading) {
    return (
      <Card className="p-6 shadow-lg rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 border rounded-md">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (suggestionsError || userVotesError) {
    return (
      <Card className="p-6 shadow-lg rounded-xl text-center text-destructive">
        <CardTitle>Error loading songs</CardTitle>
        <CardDescription>Failed to load song suggestions. Please try again later.</CardDescription>
      </Card>
    );
  }

  return (
    <Card className="p-6 shadow-lg rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
        <CardTitle className="text-xl font-lora flex items-center gap-2">
          <Music className="h-6 w-6 text-primary" /> Suggested Songs
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <CardDescription className="mb-4">
          Vote for songs you'd like to sing! The most popular suggestions will be considered for future sessions.
        </CardDescription>
        {songSuggestions && songSuggestions.length > 0 ? (
          <ul className="space-y-4">
            {songSuggestions.map((song) => (
              <li key={song.id} className="flex items-center gap-4 p-3 border rounded-md bg-muted/20">
                <div className="flex-shrink-0 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleVote(song.id)}
                    disabled={!user}
                    className={cn(
                      "h-10 w-10 rounded-full flex flex-col items-center justify-center",
                      hasVoted(song.id) ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <ThumbsUp className="h-5 w-5" />
                    <span className="text-xs font-semibold">{song.total_votes}</span>
                  </Button>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{song.title}</h3>
                  <p className="text-sm text-muted-foreground">by {song.artist}</p>
                  {song.profiles && (
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Avatar className="h-4 w-4 mr-1">
                        {song.profiles.avatar_url ? (
                          <AvatarImage src={song.profiles.avatar_url} alt={`${song.profiles.first_name}'s avatar`} />
                        ) : (
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-[8px]">
                            <UserIcon className="h-3 w-3" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      Suggested by {song.profiles.first_name || song.profiles.last_name || "Anonymous"}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-xl font-semibold">No songs suggested yet!</p>
            <p className="mt-2">Be the first to suggest a song using the form above.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SongVotingList;