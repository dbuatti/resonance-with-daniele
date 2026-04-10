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
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
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
    <Card className="soft-shadow rounded-[2.5rem] border-none overflow-hidden animate-fade-in-up">
      <CardHeader className="bg-muted/30 pb-8">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black font-lora flex items-center gap-3">
              <Music className="h-8 w-8 text-primary" /> Song Suggestions
            </CardTitle>
            <CardDescription className="text-base font-medium">Vote for the songs you'd love to learn next!</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search songs or artists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 rounded-xl font-medium"
            />
            {searchTerm && (
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setSearchTerm("")}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
            <SelectTrigger className="w-full sm:w-[200px] h-12 rounded-xl font-bold">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="votes_desc" className="font-bold">Most Popular</SelectItem>
              <SelectItem value="newest" className="font-bold">Recently Added</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-6">
          {filteredAndSortedSuggestions.length > 0 ? filteredAndSortedSuggestions.map((song, index) => {
            const isTopVoted = sortOrder === "votes_desc" && index === 0 && song.total_votes > 0;
            const isSuggestedByCurrentUser = user && song.user_id === user.id;
            const votedByCurrentUser = hasVoted(song.id);
            const suggestedByName = song.user_id === null ? "Anonymous" : (song.profiles?.first_name || "Member");

            return (
              <div key={song.id} className={cn(
                "group flex items-center gap-6 p-6 rounded-[2rem] border-2 transition-all duration-500",
                isTopVoted ? "bg-primary/5 border-primary/20 shadow-lg" : "bg-card border-transparent hover:bg-muted/30 hover:border-primary/10",
                isSuggestedByCurrentUser && "border-l-8 border-l-accent"
              )}>
                {/* Vote Button */}
                <div className="flex-shrink-0">
                  <Button 
                    variant={votedByCurrentUser ? "default" : "outline"} 
                    onClick={() => handleVote(song.id)}
                    disabled={!user}
                    className={cn(
                      "h-20 w-20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300",
                      votedByCurrentUser ? "shadow-xl shadow-primary/20 scale-105" : "hover:border-primary hover:bg-primary/5"
                    )}
                  >
                    <ThumbsUp className={cn("h-6 w-6", votedByCurrentUser ? "fill-current" : "text-primary")} />
                    <span className="text-sm font-black">{song.total_votes}</span>
                  </Button>
                </div>

                {/* Song Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black font-lora leading-tight truncate">{song.title}</h3>
                    {isTopVoted && <Trophy className="h-5 w-5 text-accent fill-current animate-float" />}
                  </div>
                  <p className="text-lg font-bold text-muted-foreground truncate">by {song.artist}</p>
                  
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={song.profiles?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary text-[8px] font-black"><UserIcon className="h-3 w-3" /></AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{suggestedByName}</span>
                    </div>
                    {song.reason && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 cursor-help text-primary hover:opacity-80 transition-opacity max-w-[200px]">
                              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                              <span className="text-[10px] font-bold truncate italic">
                                "{song.reason}"
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs p-4 rounded-2xl shadow-2xl border-none bg-card">
                            <p className="text-sm italic font-medium leading-relaxed text-foreground">"{song.reason}"</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {(user?.is_admin || isSuggestedByCurrentUser) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground opacity-0 group-hover:opacity-100 transition-all">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-2xl border-none">
                      <DropdownMenuItem onClick={() => { setEditingSong(song); setIsEditSongDialogOpen(true); }} className="rounded-xl p-3 font-bold">
                        <EditIcon className="mr-3 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-2" />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="rounded-xl p-3 font-bold text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <Trash2 className="mr-3 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2rem]">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black font-lora">Delete Suggestion?</AlertDialogTitle>
                            <AlertDialogDescription className="text-lg font-medium">This will remove "{song.title}" from the community list.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-3">
                            <AlertDialogCancel className="rounded-2xl font-bold">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSongSuggestion(song.id)} className="bg-destructive hover:bg-destructive/90 rounded-2xl font-bold">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          }) : (
            <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] border-4 border-dashed border-muted-foreground/10">
              <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-10" />
              <p className="text-xl font-bold text-muted-foreground font-lora">No songs found matching your search.</p>
            </div>
          )}
        </div>
      </CardContent>

      {editingSong && (
        <Dialog open={isEditSongDialogOpen} onOpenChange={setIsEditSongDialogOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black font-lora">Edit Suggestion</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditSongSubmit)} className="space-y-6 py-4">
                <FormField control={editForm.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Song Title</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl font-bold" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="artist" render={({ field }) => (
                  <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Artist</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl font-bold" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="reason" render={({ field }) => (
                  <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Why this song?</FormLabel><FormControl><Textarea {...field} className="min-h-[120px] rounded-xl font-medium" /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit" className="w-full h-12 font-black rounded-xl" disabled={editForm.formState.isSubmitting}>Save Changes</Button>
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