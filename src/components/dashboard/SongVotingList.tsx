"use client";

import React, { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/auth";
import { showSuccess, showError } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Loader2, Music, User as UserIcon, Search, Trash2, Edit as EditIcon, MessageSquare, AlertCircle, Clock, MoreVertical, Copy, Info, X } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

  React.useEffect(() => {
    if (editingSong) {
      editForm.reset({
        title: editingSong.title,
        artist: editingSong.artist,
        reason: editingSong.reason || "",
      });
    }
  }, [editingSong, editForm]);

  const fetchAllSongSuggestions = async (): Promise<SongSuggestion[]> => {
    let query = supabase
      .from("song_suggestions")
      .select(`
        *,
        profiles (first_name, last_name, avatar_url)
      `)
      .limit(50);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  const { data: allSuggestions, isLoading: loadingSuggestions, error: suggestionsError } = useQuery<SongSuggestion[], Error, SongSuggestion[], ['songSuggestions']>({
    queryKey: ['songSuggestions'],
    queryFn: fetchAllSongSuggestions,
    enabled: !loadingSession,
  });

  const { data: userVotes, isLoading: loadingUserVotes } = useQuery<UserVote[], Error, UserVote[], ['userVotes', string | undefined]>({
    queryKey: ['userVotes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_song_votes")
        .select("id, suggestion_id, user_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !loadingSession && !!user?.id,
  });

  const hasVoted = (suggestionId: string) => userVotes?.some(vote => vote.suggestion_id === suggestionId);

  const filteredAndSortedSuggestions = useMemo(() => {
    if (!allSuggestions) return [];
    let filtered = allSuggestions;
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(song =>
        song.title.toLowerCase().includes(lowerCaseSearch) ||
        song.artist.toLowerCase().includes(lowerCaseSearch) ||
        song.reason?.toLowerCase().includes(lowerCaseSearch)
      );
    }
    filtered.sort((a, b) => {
      if (sortOrder === "votes_desc") {
        const comp = b.total_votes - a.total_votes;
        return comp !== 0 ? comp : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return filtered;
  }, [allSuggestions, searchTerm, sortOrder]);

  const handleVote = async (suggestionId: string) => {
    if (!user) {
      showError("You must be logged in to vote.");
      return;
    }
    const existingVote = userVotes?.find(vote => vote.suggestion_id === suggestionId);
    if (existingVote) {
      const { error } = await supabase.from("user_song_votes").delete().eq("id", existingVote.id);
      if (error) showError("Failed to remove vote: " + error.message);
      else {
        showSuccess("Vote removed!");
        queryClient.invalidateQueries({ queryKey: ['songSuggestions'] });
        queryClient.invalidateQueries({ queryKey: ['userVotes', user.id] });
      }
    } else {
      const { error } = await supabase.from("user_song_votes").insert({ user_id: user.id, suggestion_id: suggestionId });
      if (error) showError("Failed to cast vote: " + error.message);
      else {
        showSuccess("Vote cast successfully!");
        queryClient.invalidateQueries({ queryKey: ['songSuggestions'] });
        queryClient.invalidateQueries({ queryKey: ['userVotes', user.id] });
      }
    }
  };

  const handleEditSongSubmit = async (data: EditSongSuggestionFormData) => {
    if (!user || !editingSong) return;
    try {
      const { error } = await supabase.from("song_suggestions").update({ ...data, updated_at: new Date().toISOString() }).eq("id", editingSong.id);
      if (error) showError("Failed to update song suggestion: " + error.message);
      else {
        showSuccess("Song suggestion updated successfully!");
        setIsEditSongDialogOpen(false);
        setEditingSong(null);
        queryClient.invalidateQueries({ queryKey: ['songSuggestions'] });
      }
    } catch (error: any) {
      showError("An unexpected error occurred: " + error.message);
    }
  };

  const handleDeleteSongSuggestion = async (suggestionId: string) => {
    const { error } = await supabase.from("song_suggestions").delete().eq("id", suggestionId);
    if (error) showError("Failed to delete song suggestion: " + error.message);
    else {
      showSuccess("Song suggestion deleted!");
      queryClient.invalidateQueries({ queryKey: ['songSuggestions'] });
      queryClient.invalidateQueries({ queryKey: ['userVotes', user.id] });
    }
  };

  if (loadingSuggestions || loadingUserVotes) {
    return (
      <Card className="p-6 shadow-lg rounded-xl lg:col-span-2">
        <CardHeader className="p-0 mb-4"><Skeleton className="h-6 w-1/2" /></CardHeader>
        <CardContent className="p-0 space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-48 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-6 shadow-lg rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
        <CardTitle className="text-2xl font-lora flex items-center gap-2"><Music className="h-7 w-7 text-primary" /> Suggested Songs</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <CardDescription className="mb-4">Vote for songs you'd like to sing! The most popular suggestions will be considered for future sessions.</CardDescription>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/80" />
            <Input
              type="text"
              placeholder="Search songs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-10 py-2 w-full placeholder:text-foreground/70"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Select value={sortOrder} onValueChange={(value: "votes_desc" | "newest") => setSortOrder(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              {sortOrder === "votes_desc" ? <ThumbsUp className="mr-2 h-4 w-4 text-muted-foreground" /> : <Clock className="mr-2 h-4 w-4 text-muted-foreground" />}
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent><SelectItem value="votes_desc">Most Voted</SelectItem><SelectItem value="newest">Newest</SelectItem></SelectContent>
          </Select>
        </div>
        <ul className="space-y-4">
          {filteredAndSortedSuggestions.length > 0 ? filteredAndSortedSuggestions.map((song, index) => {
            const isTopVoted = sortOrder === "votes_desc" && index === 0 && song.total_votes > 0;
            const isSuggestedByCurrentUser = user && song.user_id === user.id;
            const votedByCurrentUser = hasVoted(song.id);
            const canEditOrDelete = user?.is_admin || isSuggestedByCurrentUser;
            const suggestedByName = song.user_id === null ? "Anonymous" : (song.profiles?.first_name || song.profiles?.last_name || "Member");
            return (
              <li key={song.id} className={cn("flex items-center justify-between gap-4 p-4 border rounded-xl transition-all duration-300", isTopVoted ? "border-primary ring-2 ring-primary/50 bg-primary/5 dark:bg-primary/10" : "bg-card hover:bg-muted/50", isSuggestedByCurrentUser && "border-l-4 border-accent ring-1 ring-accent/50 bg-accent/5 dark:bg-accent/10")}>
                <div className="flex-shrink-0 text-center self-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant={votedByCurrentUser ? "default" : "outline"} size="lg" onClick={() => handleVote(song.id)} disabled={!user} className={cn("h-16 w-16 rounded-xl flex flex-col items-center justify-center transition-all duration-200 p-1 group", votedByCurrentUser ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg" : "border-primary text-primary hover:bg-primary/10")}>
                        <ThumbsUp className={cn("h-6 w-6 transition-colors duration-200", votedByCurrentUser ? "text-primary-foreground" : "text-primary group-hover:text-primary")} />
                        <span className="text-xs font-bold mt-1">{song.total_votes} Votes</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{user ? (votedByCurrentUser ? "Remove Vote" : "Cast Vote") : "Log in to vote"}</TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex-1 min-w-0 space-y-0.5 py-1 self-center">
                  <h3 className="text-xl font-bold font-lora text-foreground line-clamp-1">{song.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">by <span className="font-medium text-foreground">{song.artist}</span></p>
                  <div className="flex items-center text-xs text-muted-foreground pt-1">
                    {song.user_id && song.profiles && <Avatar className="h-4 w-4 mr-1">{song.profiles.avatar_url ? <AvatarImage src={song.profiles.avatar_url} /> : <AvatarFallback className="bg-secondary text-secondary-foreground text-[8px]"><UserIcon className="h-2 w-2" /></AvatarFallback>}</Avatar>}
                    Suggested by {suggestedByName} {isSuggestedByCurrentUser && <span className="ml-1 text-accent font-semibold">(You)</span>}
                    {song.reason && <Tooltip><TooltipTrigger asChild><MessageSquare className="h-3 w-3 ml-2 cursor-help text-muted-foreground hover:text-foreground" /></TooltipTrigger><TooltipContent className="max-w-xs"><p className="font-semibold">Reason:</p><p className="italic">{song.reason}</p></TooltipContent></Tooltip>}
                  </div>
                </div>
                {canEditOrDelete && (
                  <div className="flex-shrink-0 self-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => { setEditingSong(song); setIsEditSongDialogOpen(true); }}><EditIcon className="mr-2 h-4 w-4" /><span>Edit Suggestion</span></DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /><span>Delete</span></DropdownMenuItem></AlertDialogTrigger>
                          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteSongSuggestion(song.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </li>
            );
          }) : <div className="text-center text-muted-foreground py-12 border-2 border-dashed border-border rounded-lg bg-muted/50"><Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-xl font-semibold font-lora">No songs found!</p></div>}
        </ul>
      </CardContent>
      {editingSong && (
        <Dialog open={isEditSongDialogOpen} onOpenChange={setIsEditSongDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle className="font-lora">Edit Song Suggestion</DialogTitle><DialogDescription>Update the details for this song suggestion.</DialogDescription></DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditSongSubmit)} className="grid gap-6 py-4">
                <div className="grid gap-2"><Label htmlFor="edit-song-title">Song Title</Label><Input id="edit-song-title" {...editForm.register("title")} /></div>
                <div className="grid gap-2"><Label htmlFor="edit-song-artist">Artist</Label><Input id="edit-song-artist" {...editForm.register("artist")} /></div>
                <div className="grid gap-2"><Label htmlFor="edit-song-reason">Why this song? (Optional)</Label><Textarea id="edit-song-reason" className="resize-y min-h-[80px]" {...editForm.register("reason")} /></div>
                <DialogFooter><Button type="submit" disabled={editForm.formState.isSubmitting}>{editForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default SongVotingList;