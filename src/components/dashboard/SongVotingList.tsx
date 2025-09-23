"use client";

import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/auth";
import { showSuccess, showError } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Loader2, Music, User as UserIcon, Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react"; // Added ChevronLeft, ChevronRight
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1); // New state for current page
  const pageSize = 5; // Number of songs per page

  // Fetch song suggestions with pagination
  const fetchSongSuggestions = async (currentSearchTerm: string, page: number, pageSize: number): Promise<{ data: SongSuggestion[], count: number | null }> => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize - 1;

    console.log(`[SongVotingList] Fetching song suggestions for page ${page} with search term: ${currentSearchTerm}`);
    let query = supabase
      .from("song_suggestions")
      .select(`
        *,
        profiles (first_name, last_name, avatar_url)
      `, { count: 'exact' }); // Request exact count

    if (currentSearchTerm) {
      query = query.or(
        `title.ilike.%${currentSearchTerm}%,artist.ilike.%${currentSearchTerm}%`
      );
    }

    const { data, error, count } = await query
      .order("total_votes", { ascending: false })
      .order("created_at", { ascending: false })
      .range(startIndex, endIndex);

    if (error) {
      console.error("Error fetching song suggestions:", error);
      throw error;
    }
    return { data: data || [], count };
  };

  const { data: paginatedData, isLoading: loadingSuggestions, error: suggestionsError } = useQuery<
    { data: SongSuggestion[], count: number | null },
    Error,
    { data: SongSuggestion[], count: number | null },
    ['songSuggestions', string, number, number]
  >({
    queryKey: ['songSuggestions', searchTerm, currentPage, pageSize],
    queryFn: ({ queryKey }) => fetchSongSuggestions(queryKey[1], queryKey[2], queryKey[3]),
    enabled: !loadingSession,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const songSuggestions = paginatedData?.data || [];
  const totalCount = paginatedData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

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
        queryClient.invalidateQueries({ queryKey: ['songSuggestions', searchTerm, currentPage, pageSize] });
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
        queryClient.invalidateQueries({ queryKey: ['songSuggestions', searchTerm, currentPage, pageSize] });
        queryClient.invalidateQueries({ queryKey: ['userVotes', user.id] });
      }
    }
  };

  const handleDeleteSongSuggestion = async (suggestionId: string) => {
    if (!user || !user.is_admin) {
      showError("You do not have permission to delete song suggestions.");
      return;
    }

    const { error } = await supabase
      .from("song_suggestions")
      .delete()
      .eq("id", suggestionId);

    if (error) {
      console.error("Error deleting song suggestion:", error);
      showError("Failed to delete song suggestion: " + error.message);
    } else {
      showSuccess("Song suggestion deleted!");
      queryClient.invalidateQueries({ queryKey: ['songSuggestions', searchTerm, currentPage, pageSize] });
      queryClient.invalidateQueries({ queryKey: ['userVotes', user.id] }); // Invalidate votes as well
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const isLoading = loadingSuggestions || loadingUserVotes;

  if (isLoading) {
    return (
      <Card className="p-6 shadow-lg rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <Skeleton className="h-10 w-full mb-4" /> {/* Search bar skeleton */}
          {[...Array(pageSize)].map((_, i) => ( // Render pageSize number of skeletons
            <div key={i} className="flex items-center gap-4 p-3 border rounded-md">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
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

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search songs by title or artist..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="pl-9 pr-4 py-2 w-full"
          />
        </div>

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
                {user?.is_admin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the song suggestion "{song.title}" by {song.artist}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteSongSuggestion(song.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-xl font-semibold">No songs found!</p>
            <p className="mt-2">
              {searchTerm
                ? "Try a different search term, or be the first to suggest a song."
                : "Be the first to suggest a song using the form above."}
            </p>
          </div>
        )}

        {totalCount > pageSize && ( // Only show pagination if there are more items than pageSize
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={handlePreviousPage}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || isLoading}
            >
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SongVotingList;