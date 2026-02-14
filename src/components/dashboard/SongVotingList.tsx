"use client";

import React, { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/auth";
import { showSuccess, showError } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Loader2, Music, User as UserIcon, Search, Trash2, Edit as EditIcon, MessageSquare, AlertCircle, Clock, MoreVertical, Copy, Info, X, Trophy } from "lucide-react";
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
    const { data, error } = await supabase
      .from("song_suggestions")
      .select(`
        *,
        profiles (first_name, last_name, avatar_url)
      `)
      .limit(50);
    if (error) throw error;
    return data || [];
  };

  const { data: allSuggestions, isLoading: loadingSuggestions } = useQuery<SongSuggestion[], Error, SongSuggestion[], ['songSuggestions']>({
    queryKey: ['songSuggestions'],
    queryFn: fetchAllSongSuggestions,
    enabled: !loadingSession,
  });

  const { data: userVotes } = useQuery<UserVote[], Error, UserVote[], ['userVotes', string | undefined]>({
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
      if (error) showError("Failed to remove vote.");
      else {
        showSuccess("Vote removed!");
        queryClient.invalidateQueries({ queryKey: ['songSuggestions'] });
        queryClient.invalidateQueries({ queryKey: ['userVotes', user.id] });
      }
    } else {
      const { error } = await supabase.from("user_song_votes").insert({ user_id: user.id, suggestion_id: suggestionId });
      if (error) showError("Failed to cast vote.");
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
      if (error) showError("Failed to update suggestion.");
      else {
        showSuccess("Suggestion updated!");
        setIsEditSongDialogOpen(false);
        setEditingSong(null);
        queryClient.invalidateQueries({ queryKey: ['songSuggestions'] });
      }
    } catch (error: any) {
      showError("An unexpected error occurred.");
    }
  };

  const handleDeleteSongSuggestion = async (suggestionId: string) => {
    const { error } = await supabase.from("song_suggestions").delete().eq("id", suggestionId);
    if (error) showError("Failed to delete suggestion.");
    else {
      showSuccess("Suggestion deleted!");
      queryClient.invalidateQueries({ queryKey: ['songSuggestions'] });
      queryClient.invalidateQueries({ queryKey: ['userVotes', user.id] });
    }
  };

  if (loadingSuggestions) {
    return (
      <Card className="p-6 shadow-lg rounded-2xl border-none">
        <Skeleton className="h-8 w-1/2 mb-6" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg rounded-2xl border-none overflow-hidden">
      <CardHeader className="bg-muted/30 pb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold font-lora flex items-center gap-2">
              <Music className="h-6 w-6 text-primary" /> Song Suggestions
            </CardTitle>
            <CardDescription>Vote for the songs you'd love to learn next!</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search songs or artists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl"
            />
            {searchTerm && (
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setSearchTerm("")}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="votes_desc">Most Popular</SelectItem>
              <SelectItem value="newest">Recently Added</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredAndSortedSuggestions.length > 0 ? filteredAndSortedSuggestions.map((song, index) => {
            const isTopVoted = sortOrder === "votes_desc" && index === 0 && song.total_votes > 0;
            const isSuggestedByCurrentUser = user && song.user_id === user.id;
            const votedByCurrentUser = hasVoted(song.id);
            const suggestedByName = song.user_id === null ? "Anonymous" : (song.profiles?.first_name || "Member");

            return (
              <div key={song.id} className={cn(
                "group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
                isTopVoted ? "bg-primary/5 border-primary/20 ring-1 ring-primary/10" : "bg-card hover:bg-muted/30",
                isSuggestedByCurrentUser && "border-l-4 border-l-accent"
              )}>
                {/* Vote Button */}
                <div className="flex-shrink-0">
                  <Button 
                    variant={votedByCurrentUser ? "default" : "outline"} 
                    onClick={() => handleVote(song.id)}
                    disabled={!user}
                    className={cn(
                      "h-16 w-16 rounded-xl flex flex-col items-center justify-center gap-1 transition-all",
                      votedByCurrentUser ? "shadow-lg shadow-primary/20" : "hover:border-primary hover:bg-primary/5"
                    )}
                  >
                    <ThumbsUp className={cn("h-5 w-5", votedByCurrentUser ? "fill-current" : "text-primary")} />
                    <span className="text-xs font-bold">{song.total_votes}</span>
                  </Button>
                </div>

                {/* Song Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold font-lora leading-tight truncate">{song.title}</h3>
                    {isTopVoted && <Trophy className="h-4 w-4 text-accent fill-current" />}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground truncate mb-2">by {song.artist}</p>
                  
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground uppercase tracking-wider font-bold">
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={song.profiles?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary text-[8px]"><UserIcon className="h-2 w-2" /></AvatarFallback>
                      </Avatar>
                      <span>{suggestedByName}</span>
                    </div>
                    {song.reason && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-help hover:text-foreground transition-colors">
                            <MessageSquare className="h-3 w-3" /> Reason
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs p-3">
                          <p className="text-xs italic leading-relaxed">"{song.reason}"</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {(user?.is_admin || isSuggestedByCurrentUser) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingSong(song); setIsEditSongDialogOpen(true); }}>
                        <EditIcon className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Suggestion?</AlertDialogTitle>
                            <AlertDialogDescription>This will remove "{song.title}" from the list.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSongSuggestion(song.id)} className="bg-destructive">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          }) : (
            <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed border-muted-foreground/10">
              <Music className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
              <p className="text-muted-foreground font-medium">No songs found matching your search.</p>
            </div>
          )}
        </div>
      </CardContent>

      {editingSong && (
        <Dialog open={isEditSongDialogOpen} onOpenChange={setIsEditSongDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-lora">Edit Suggestion</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditSongSubmit)} className="space-y-4 py-4">
                <FormField control={editForm.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Song Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="artist" render={({ field }) => (
                  <FormItem><FormLabel>Artist</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="reason" render={({ field }) => (
                  <FormItem><FormLabel>Why this song?</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit" disabled={editForm.formState.isSubmitting}>Save Changes</Button>
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