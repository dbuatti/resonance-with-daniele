"use client";

import React, { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/auth";
import { showSuccess, showError } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Loader2, Music, User as UserIcon, Search, Trash2, Edit as EditIcon, MessageSquare, AlertCircle, Clock, MoreVertical, Copy, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"; // Import DropdownMenu components

interface SongSuggestion {
  id: string;
  user_id: string | null;
  title: string;
  artist: string;
  total_votes: number;
  created_at: string;
  reason?: string | null;
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
  const [sortOrder, setSortOrder] = useState<"votes_desc" | "newest">("votes_desc");

  const [isEditSongDialogOpen, setIsEditSongDialogOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<SongSuggestion | null>(null);

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

  // --- Data Fetching: Load ALL suggestions (up to a limit) ---
  const fetchAllSongSuggestions = async (): Promise<SongSuggestion[]> => {
    console.log(`[SongVotingList] Fetching all song suggestions.`);
    let query = supabase
      .from("song_suggestions")
      .select(`
        *,
        profiles (first_name, last_name, avatar_url)
      `)
      .limit(50);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching song suggestions:", error);
      throw error;
    }
    return data || [];
  };

  const { data: allSuggestions, isLoading: loadingSuggestions, error: suggestionsError } = useQuery<
    SongSuggestion[],
    Error,
    SongSuggestion[],
    ['songSuggestions']
  >({
    queryKey: ['songSuggestions'],
    queryFn: fetchAllSongSuggestions,
    enabled: !loadingSession,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // --- Data Fetching: Load ALL user votes ---
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

  // --- Dynamic Filtering and Sorting ---
  const filteredAndSortedSuggestions = useMemo(() => {
    if (!allSuggestions) return [];

    let filtered = allSuggestions;

    // 1. Search Filtering
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(song =>
        song.title.toLowerCase().includes(lowerCaseSearch) ||
        song.artist.toLowerCase().includes(lowerCaseSearch) ||
        song.reason?.toLowerCase().includes(lowerCaseSearch)
      );
    }

    // 2. Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortOrder === "votes_desc") {
        // Primary sort: votes (desc), Secondary sort: created_at (desc)
        comparison = b.total_votes - a.total_votes;
        if (comparison === 0) {
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      } else if (sortOrder === "newest") {
        comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return comparison;
    });

    return filtered;
  }, [allSuggestions, searchTerm, sortOrder]);

  // --- Handlers ---

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
        queryClient.invalidateQueries({ queryKey: ['songSuggestions'] }); // Invalidate all suggestions
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
        queryClient.invalidateQueries({ queryKey: ['songSuggestions'] }); // Invalidate all suggestions
        queryClient.invalidateQueries({ queryKey: ['userVotes', user.id] });
      }
    }
  };

  const handleEditSongSubmit = async (data: EditSongSuggestionFormData) => {
    if (!user || !editingSong) {
      showError("You must be logged in and select a song to edit.");
      return;
    }

    // Check if user is admin OR the original suggester
    const canEdit = user.is_admin || user.id === editingSong.user_id;
    if (!canEdit) {
      showError("You do not have permission to edit this suggestion.");
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
        queryClient.invalidateQueries({ queryKey: ['songSuggestions'] });
      }
    } catch (error: any) {
      console.error("Unexpected error during song suggestion update:", error);
      showError("An unexpected error occurred: " + error.message);
    }
  };

  const handleDeleteSongSuggestion = async (suggestionId: string) => {
    if (!user) {
      showError("You must be logged in to delete song suggestions.");
      return;
    }

    // RLS handles permission check (only admin or owner can delete)
    const { error } = await supabase
      .from("song_suggestions")
      .delete()
      .eq("id", suggestionId);

    if (error) {
      console.error("Error deleting song suggestion:", error);
      showError("Failed to delete song suggestion: " + error.message);
    } else {
      showSuccess("Song suggestion deleted!");
      queryClient.invalidateQueries({ queryKey: ['songSuggestions'] });
      queryClient.invalidateQueries({ queryKey: ['userVotes', user.id] });
    }
  };

  const isLoading = loadingSuggestions || loadingUserVotes;

  if (isLoading) {
    return (
      <Card className="p-6 shadow-lg rounded-xl lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <div className="flex gap-4 mb-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 border rounded-md">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full"
            />
          </div>
          <Select value={sortOrder} onValueChange={(value: "votes_desc" | "newest") => setSortOrder(value)}>
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

        {filteredAndSortedSuggestions && filteredAndSortedSuggestions.length > 0 ? (
          <ul className="space-y-3">
            {filteredAndSortedSuggestions.map((song, index) => {
              // Highlight the top-voted song (only if sorting by votes and it's the first item)
              const isTopVoted = sortOrder === "votes_desc" && index === 0 && song.total_votes > 0;
              const isSuggestedByCurrentUser = user && song.user_id === user.id;
              const votedByCurrentUser = hasVoted(song.id);
              const canEditOrDelete = user?.is_admin || isSuggestedByCurrentUser;

              // Determine suggested by name
              const suggestedByName = song.user_id === null 
                ? "Anonymous" 
                : (song.profiles?.first_name || song.profiles?.last_name || "Member");

              return (
                <li 
                  key={song.id} 
                  className={cn(
                    "flex items-center justify-between gap-3 p-3 border rounded-lg transition-colors",
                    isTopVoted 
                      ? "border-primary ring-2 ring-primary/50 bg-primary/5 dark:bg-primary/10"
                      : "bg-card hover:bg-muted/50", // Use card background for list items
                    isSuggestedByCurrentUser && "border-accent ring-1 ring-accent/50 bg-accent/5 dark:bg-accent/10"
                  )}
                >
                  
                  {/* Left Section: Voting Button & Count (Prominent) */}
                  <div className="flex-shrink-0 text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={votedByCurrentUser ? "default" : "outline"}
                          size="lg"
                          onClick={() => handleVote(song.id)}
                          disabled={!user}
                          className={cn(
                            "h-14 w-14 rounded-xl flex flex-col items-center justify-center transition-all duration-200 p-1",
                            votedByCurrentUser 
                              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg" 
                              : "text-muted-foreground hover:bg-secondary/50 border-2",
                            !user ? "opacity-50 cursor-not-allowed" : ""
                          )}
                        >
                          <ThumbsUp className="h-5 w-5" />
                          <span className="text-xs font-bold mt-0.5">{song.total_votes} Votes</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {user ? (
                          votedByCurrentUser ? "Remove Vote" : "Cast Vote"
                        ) : "Log in to vote"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  {/* Middle Section: Song Details (Improved Hierarchy) */}
                  <div className="flex-1 min-w-0 space-y-0.5 py-1">
                    <h3 className="text-lg font-bold text-foreground line-clamp-1">{song.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">by <span className="font-medium text-foreground">{song.artist}</span></p>
                    
                    {/* Suggested By & Reason */}
                    <div className="flex items-center text-xs text-muted-foreground pt-1">
                      {song.user_id && song.profiles && (
                        <Avatar className="h-4 w-4 mr-1">
                          {song.profiles.avatar_url ? (
                            <AvatarImage src={song.profiles.avatar_url} alt={`${song.profiles.first_name}'s avatar`} />
                          ) : (
                            <AvatarFallback className="bg-secondary text-secondary-foreground text-[8px]">
                              <UserIcon className="h-2 w-2" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                      )}
                      Suggested by {suggestedByName}
                      {isSuggestedByCurrentUser && <span className="ml-1 text-accent font-semibold">(You)</span>}
                      
                      {/* Reason Tooltip */}
                      {song.reason && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <MessageSquare className="h-3 w-3 ml-2 cursor-help text-muted-foreground hover:text-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold">Reason:</p>
                            <p className="italic">{song.reason}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  
                  {/* Right Section: Actions (Dropdown Menu) */}
                  {canEditOrDelete && (
                    <div className="flex-shrink-0">
                      <DropdownMenu>
                        <Tooltip>
                          <DropdownMenuTrigger asChild>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                          </DropdownMenuTrigger>
                          <TooltipContent>Actions</TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end" className="w-48">
                          
                          {/* Edit Action */}
                          <DropdownMenuItem 
                            onClick={() => {
                              setEditingSong(song);
                              setIsEditSongDialogOpen(true);
                            }}
                            disabled={!canEditOrDelete}
                          >
                            <EditIcon className="mr-2 h-4 w-4" />
                            <span>Edit Suggestion</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {/* Delete Action */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                disabled={!canEditOrDelete}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
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
                                <AlertDialogAction onClick={() => handleDeleteSongSuggestion(song.id)} className="bg-destructive hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
      </CardContent>

      {/* Edit Song Suggestion Dialog */}
      {editingSong && (
        <Dialog open={isEditSongDialogOpen} onOpenChange={setIsEditSongDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-lora">Edit Song Suggestion</DialogTitle>
              <DialogDescription>Update the details for this song suggestion.</DialogDescription>
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