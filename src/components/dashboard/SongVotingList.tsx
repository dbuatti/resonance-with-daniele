"use client";

import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/auth";
import { showSuccess, showError } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Loader2, Music, User as UserIcon, Search, Trash2, ChevronLeft, ChevronRight, ArrowDownWideNarrow, Clock, Edit as EditIcon, MessageSquare } from "lucide-react"; // Added MessageSquare
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; // Import Dialog components
import { Label } from "@/components/ui/label"; // Import Label
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import { useForm } from "react-hook-form"; // Import useForm
import { zodResolver } from "@hookform/resolvers/zod"; // Import zodResolver
import * as z from "zod"; // Import z
import {
  Form, // Import the Form component
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"; // Import Tooltip

interface SongSuggestion {
  id: string;
  user_id: string;
  title: string;
  artist: string;
  total_votes: number;
  created_at: string;
  reason?: string | null; // Added new optional reason field
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

// Define schema for editing song suggestions
const editSongSuggestionSchema = z.object({
  title: z.string().min(1, "Song title is required"),
  artist: z.string().min(1, "Artist name is required"),
  reason: z.string().optional(),
});

type EditSongSuggestionFormData = z.infer<typeof editSongSuggestionSchema>;

const SongVotingList: React.FC = () => {
  const { user, loading: loadingSession } = useSession();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"votes_desc" | "newest">("votes_desc"); // New state for sorting
  const pageSize = 5;

  const [isEditSongDialogOpen, setIsEditSongDialogOpen] = useState(false); // State for edit dialog
  const [editingSong, setEditingSong] = useState<SongSuggestion | null>(null); // State for song being edited

  const editForm = useForm<EditSongSuggestionFormData>({
    resolver: zodResolver(editSongSuggestionSchema),
    defaultValues: {
      title: "",
      artist: "",
      reason: "",
    },
  });

  // Effect to set form values when a song is selected for editing
  React.useEffect(() => {
    if (editingSong) {
      editForm.reset({
        title: editingSong.title,
        artist: editingSong.artist,
        reason: editingSong.reason || "",
      });
    }
  }, [editingSong, editForm]);

  // Fetch song suggestions with pagination and sorting
  const fetchSongSuggestions = async (currentSearchTerm: string, page: number, pageSize: number, currentSortOrder: string): Promise<{ data: SongSuggestion[], count: number | null }> => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize - 1;

    console.log(`[SongVotingList] Fetching song suggestions for page ${page}, sort: ${currentSortOrder}, search: ${currentSearchTerm}`);
    let query = supabase
      .from("song_suggestions")
      .select(`
        *,
        profiles (first_name, last_name, avatar_url)
      `, { count: 'exact' });

    if (currentSearchTerm) {
      query = query.or(
        `title.ilike.%${currentSearchTerm}%,artist.ilike.%${currentSearchTerm}%,reason.ilike.%${currentSearchTerm}%` // Include reason in search
      );
    }

    if (currentSortOrder === "votes_desc") {
      query = query.order("total_votes", { ascending: false }).order("created_at", { ascending: false });
    } else if (currentSortOrder === "newest") {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error, count } = await query
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
    ['songSuggestions', string, number, number, string] // Added sortOrder to query key
  >({
    queryKey: ['songSuggestions', searchTerm, currentPage, pageSize, sortOrder],
    queryFn: ({ queryKey }) => fetchSongSuggestions(queryKey[1], queryKey[2], queryKey[3], queryKey[4]),
    enabled: !loadingSession,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
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
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
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
        queryClient.invalidateQueries({ queryKey: ['songSuggestions', searchTerm, currentPage, pageSize, sortOrder] });
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
        queryClient.invalidateQueries({ queryKey: ['songSuggestions', searchTerm, currentPage, pageSize, sortOrder] });
        queryClient.invalidateQueries({ queryKey: ['userVotes', user.id] });
      }
    }
  };

  const handleEditSongSubmit = async (data: EditSongSuggestionFormData) => {
    if (!user || !user.is_admin || !editingSong) {
      showError("You must be an administrator and select a song to edit.");
      return;
    }

    try {
      const { title, artist, reason } = data;
      const { error } = await supabase
        .from("song_suggestions")
        .update({
          title,
          artist,
          reason: reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingSong.id);

      if (error) {
        console.error("Error updating song suggestion:", error);
        showError("Failed to update song suggestion: " + error.message);
      } else {
        showSuccess("Song suggestion updated successfully!");
        setIsEditSongDialogOpen(false);
        setEditingSong(null);
        queryClient.invalidateQueries({ queryKey: ['songSuggestions', searchTerm, currentPage, pageSize, sortOrder] });
      }
    } catch (error: any) {
      console.error("Unexpected error during song suggestion update:", error);
      showError("An unexpected error occurred: " + error.message);
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
      queryClient.invalidateQueries({ queryKey: ['songSuggestions', searchTerm, currentPage, pageSize, sortOrder] });
      queryClient.invalidateQueries({ queryKey: ['userVotes', user.id] });
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handleSortChange = (value: "votes_desc" | "newest") => {
    setSortOrder(value);
    setCurrentPage(1); // Reset to first page on sort change
  };

  const isLoading = loadingSuggestions || loadingUserVotes;

  if (isLoading) {
    return (
      <Card className="p-6 shadow-lg rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <div className="flex gap-4 mb-4">
            <Skeleton className="h-10 w-full" /> {/* Search bar skeleton */}
            <Skeleton className="h-10 w-32" /> {/* Sort select skeleton */}
          </div>
          {[...Array(pageSize)].map((_, i) => (
            <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 border rounded-md">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-8 w-20 flex-shrink-0" />
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
        <CardTitle className="text-2xl font-lora flex items-center gap-2">
          <Music className="h-7 w-7 text-primary" /> Suggested Songs
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <CardDescription className="mb-4">
          Vote for songs you'd like to sing! The most popular suggestions will be considered for future sessions.
        </CardDescription>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search songs by title, artist, or reason..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="pl-9 pr-4 py-2 w-full"
            />
          </div>
          <Select value={sortOrder} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              {sortOrder === "votes_desc" ? (
                <ThumbsUp className="mr-2 h-4 w-4 text-muted-foreground" />
              ) : (
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              )}
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="votes_desc">Most Voted</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {songSuggestions && songSuggestions.length > 0 ? (
          <ul className="space-y-4">
            {songSuggestions.map((song, index) => {
              // Highlight the top-voted song (only if sorting by votes and it's the first item on the first page)
              const isTopVoted = sortOrder === "votes_desc" && currentPage === 1 && index === 0 && song.total_votes > 0;
              const isSuggestedByCurrentUser = user && song.user_id === user.id; // Check if suggested by current user

              return (
                <li 
                  key={song.id} 
                  className={cn(
                    "flex items-start gap-4 p-4 border rounded-lg transition-colors",
                    isTopVoted 
                      ? "border-primary ring-2 ring-primary/50 bg-primary/5 dark:bg-primary/10" 
                      : "bg-muted/20 hover:bg-muted/50",
                    isSuggestedByCurrentUser && "border-accent ring-1 ring-accent/50 bg-accent/5 dark:bg-accent/10" // Highlight if suggested by current user
                  )}
                >
                  
                  {/* Voting Button & Count */}
                  <div className="flex-shrink-0 text-center pt-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={hasVoted(song.id) ? "default" : "outline"}
                          size="icon"
                          onClick={() => handleVote(song.id)}
                          disabled={!user}
                          className={cn(
                            "h-14 w-14 rounded-full flex flex-col items-center justify-center transition-all duration-200", // Increased size
                            hasVoted(song.id) 
                              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md" 
                              : "text-muted-foreground hover:bg-secondary/50 border-2"
                          )}
                        >
                          <ThumbsUp className="h-5 w-5" />
                          <span className="text-xs font-bold mt-0.5">{song.total_votes}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {user ? (hasVoted(song.id) ? "Remove Vote" : "Cast Vote") : "Log in to vote"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  {/* Song Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="text-lg font-semibold text-foreground line-clamp-1">{song.title}</h3>
                    <p className="text-sm text-muted-foreground">by <span className="font-medium text-foreground">{song.artist}</span></p>
                    
                    {/* Reason (with optional tooltip for long reasons) */}
                    {song.reason && (
                      <div className="flex items-start text-xs italic text-muted-foreground mt-2">
                        <MessageSquare className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="line-clamp-2 cursor-help">
                              "{song.reason}"
                            </p>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{song.reason}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}

                    {/* Suggested By */}
                    {song.profiles && (
                      <div className="flex items-center text-xs text-muted-foreground pt-1">
                        <Avatar className="h-5 w-5 mr-1">
                          {song.profiles.avatar_url ? (
                            <AvatarImage src={song.profiles.avatar_url} alt={`${song.profiles.first_name}'s avatar`} />
                          ) : (
                            <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px]">
                              <UserIcon className="h-3 w-3" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        Suggested by {song.profiles.first_name || song.profiles.last_name || "Anonymous"}
                        {isSuggestedByCurrentUser && <span className="ml-2 text-accent font-semibold">(You)</span>}
                      </div>
                    )}
                  </div>
                  
                  {/* Admin Actions */}
                  {user?.is_admin && (
                    <div className="flex flex-col gap-2 flex-shrink-0 pt-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingSong(song);
                          setIsEditSongDialogOpen(true);
                        }}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
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
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center text-muted-foreground py-12 border-2 border-dashed border-border rounded-lg bg-muted/50">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold font-lora">No songs found!</p>
            <p className="mt-2 max-w-sm mx-auto">
              {searchTerm
                ? "Try a different search term, or be the first to suggest a song using the form on the right."
                : "Be the first to suggest a song using the form on the right!"}
            </p>
          </div>
        )}

        {totalCount > pageSize && (
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

      {/* Edit Song Suggestion Dialog */}
      {editingSong && (
        <Dialog open={isEditSongDialogOpen} onOpenChange={setIsEditSongDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-lora">Edit Song Suggestion</DialogTitle>
              <CardDescription>Update the details for this song suggestion.</CardDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditSongSubmit)} className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-song-title">Song Title</Label>
                  <Input id="edit-song-title" {...editForm.register("title")} />
                  {editForm.formState.errors.title && (
                    <p className="text-red-500 text-sm">{editForm.formState.errors.title.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-song-artist">Artist</Label>
                  <Input id="edit-song-artist" {...editForm.register("artist")} />
                  {editForm.formState.errors.artist && (
                    <p className="text-red-500 text-sm">{editForm.formState.errors.artist.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-song-reason">Why this song? (Optional)</Label>
                  <Textarea
                    id="edit-song-reason"
                    placeholder="I love the harmonies in this song, and it would be a fun challenge for the choir!"
                    className="resize-y min-h-[80px]"
                    {...editForm.register("reason")}
                  />
                  {editForm.formState.errors.reason && (
                    <p className="text-red-500 text-sm">{editForm.formState.errors.reason.message}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={editForm.formState.isSubmitting}>
                    {editForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default SongVotingList;