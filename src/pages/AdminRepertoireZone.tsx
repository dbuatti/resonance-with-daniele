"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Music, 
  Sparkles, 
  StickyNote, 
  Link as LinkIcon, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Brain, 
  Loader2, 
  Search,
  Youtube,
  Globe,
  MessageSquare,
  Save,
  Trophy,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { showSuccess, showError } from "@/utils/toast";
import BackButton from "@/components/ui/BackButton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const AdminRepertoireZone: React.FC = () => {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [newLink, setNewLink] = useState({ title: "", url: "", notes: "" });
  const [isAddingLink, setIsAddingLink] = useState(false);

  // 1. Brain Dump Logic (using admin_notes)
  const { data: brainDumpData } = useQuery({
    queryKey: ["repertoireBrainDump"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_notes")
        .select("content")
        .eq("note_key", "repertoire_studio_braindump")
        .maybeSingle();
      return data?.content || "";
    },
  });

  const [localBrainDump, setLocalBrainDump] = useState("");
  const debouncedBrainDump = useDebounce(localBrainDump, 1000);

  useEffect(() => {
    if (brainDumpData !== undefined) setLocalBrainDump(brainDumpData);
  }, [brainDumpData]);

  const saveNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      await supabase.from("admin_notes").upsert({ 
        admin_id: user?.id, 
        note_key: "repertoire_studio_braindump", 
        content 
      }, { onConflict: 'note_key' });
    }
  });

  useEffect(() => {
    if (debouncedBrainDump !== brainDumpData && user) {
      saveNoteMutation.mutate(debouncedBrainDump);
    }
  }, [debouncedBrainDump, brainDumpData, user]);

  // 2. Research Links Logic
  const { data: research, isLoading: loadingResearch } = useQuery({
    queryKey: ["repertoireResearch"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repertoire_research")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const addLinkMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("repertoire_research").insert({
        admin_id: user?.id,
        ...newLink
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repertoireResearch"] });
      setNewLink({ title: "", url: "", notes: "" });
      setIsAddingLink(false);
      showSuccess("Research link saved!");
    },
    onError: (err: Error) => showError(err.message)
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("repertoire_research").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repertoireResearch"] });
      showSuccess("Link removed.");
    }
  });

  // 3. Community Pulse (Top Suggestions)
  const { data: topSuggestions } = useQuery({
    queryKey: ["topSongSuggestions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("song_suggestions")
        .select("title, artist, total_votes")
        .order("total_votes", { ascending: false })
        .limit(5);
      return data || [];
    }
  });

  const geminiUrl = "https://gemini.google.com/app/e5f79aea81a478f3";

  return (
    <div className="py-8 md:py-12 space-y-10 max-w-7xl mx-auto px-4">
      <BackButton to="/admin" />
      
      <header className="space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
          <Music className="h-3 w-3" />
          <span>Creative Workspace</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-8xl font-black font-lora tracking-tighter leading-none">
              Repertoire Studio
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl font-medium">
              Your private space to research, brainstorm, and plan the next great harmony.
            </p>
          </div>
          <Button asChild size="lg" className="h-16 px-10 text-xl font-black rounded-2xl shadow-2xl bg-accent text-accent-foreground hover:bg-accent/90 group">
            <a href={geminiUrl} target="_blank" rel="noopener noreferrer">
              <Sparkles className="mr-3 h-6 w-6 animate-pulse" /> Open Repertoire AI
            </a>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Brain Dump & Research */}
        <div className="lg:col-span-8 space-y-10">
          {/* Brain Dump */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-black font-lora">The Brain Dump</h2>
              </div>
              {saveNoteMutation.isPending && (
                <Badge variant="outline" className="animate-pulse text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary">
                  Saving...
                </Badge>
              )}
            </div>
            <Card className="border-none shadow-2xl bg-yellow-50/50 dark:bg-yellow-950/10 rounded-[3rem] overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <CardContent className="p-10 relative z-10">
                <Textarea 
                  placeholder="Start typing your raw ideas here... songs, themes, arrangements, or just random thoughts. It saves automatically." 
                  className="min-h-[400px] bg-transparent border-none text-xl font-medium font-lora italic leading-relaxed text-yellow-900 dark:text-yellow-200/80 focus-visible:ring-0 resize-none p-0"
                  value={localBrainDump}
                  onChange={(e) => setLocalBrainDump(e.target.value)}
                />
              </CardContent>
            </Card>
          </section>

          {/* Research Links */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-black font-lora">Research & Inspiration</h2>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl font-bold border-primary/20 text-primary"
                onClick={() => setIsAddingLink(!isAddingLink)}
              >
                {isAddingLink ? "Cancel" : <><Plus className="mr-2 h-4 w-4" /> Add Link</>}
              </Button>
            </div>

            {isAddingLink && (
              <Card className="border-2 border-primary/20 shadow-xl rounded-2xl bg-primary/5 animate-in fade-in slide-in-from-top-4">
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Title</Label>
                      <Input 
                        placeholder="e.g. Pentatonix Arrangement Reference" 
                        value={newLink.title}
                        onChange={e => setNewLink({...newLink, title: e.target.value})}
                        className="rounded-xl font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest">URL</Label>
                      <Input 
                        placeholder="https://youtube.com/..." 
                        value={newLink.url}
                        onChange={e => setNewLink({...newLink, url: e.target.value})}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Quick Notes</Label>
                    <Input 
                      placeholder="Why is this useful?" 
                      value={newLink.notes}
                      onChange={e => setNewLink({...newLink, notes: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                  <Button 
                    className="w-full h-12 font-black rounded-xl shadow-lg"
                    onClick={() => addLinkMutation.mutate()}
                    disabled={!newLink.title || addLinkMutation.isPending}
                  >
                    {addLinkMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Save to Research"}
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loadingResearch ? (
                [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
              ) : research?.length === 0 ? (
                <div className="md:col-span-2 p-12 text-center bg-muted/20 rounded-[2rem] border-4 border-dashed border-border/50">
                  <LinkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-bold text-muted-foreground font-lora">No research links saved yet.</p>
                </div>
              ) : (
                research?.map((item) => (
                  <Card key={item.id} className="group border-none shadow-sm bg-card rounded-2xl overflow-hidden hover:shadow-md transition-all">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1 flex-1 min-w-0">
                          <h3 className="font-black text-lg leading-tight truncate">{item.title}</h3>
                          {item.notes && <p className="text-xs text-muted-foreground line-clamp-2 italic">"{item.notes}"</p>}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteLinkMutation.mutate(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <Badge variant="outline" className="bg-muted/50 text-[9px] font-black uppercase tracking-widest border-none">
                          {item.url?.includes('youtube') ? <Youtube className="h-3 w-3 mr-1 text-red-600" /> : <Globe className="h-3 w-3 mr-1 text-blue-600" />}
                          {item.url?.includes('youtube') ? 'Video' : 'Web'}
                        </Badge>
                        <Button asChild variant="link" className="p-0 h-auto text-primary font-black text-xs group/link">
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            Open Link <ExternalLink className="ml-1 h-3 w-3 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Community Pulse */}
        <div className="lg:col-span-4 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Trophy className="h-5 w-5 text-accent" />
              <h2 className="text-xl font-black font-lora">Community Pulse</h2>
            </div>
            <Card className="border-none shadow-xl bg-card rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Top Voted Suggestions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {topSuggestions?.map((song, i) => (
                    <div key={i} className="p-5 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                      <div className="min-w-0">
                        <p className="font-black text-sm truncate">{song.title}</p>
                        <p className="text-xs text-muted-foreground font-medium">{song.artist}</p>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-none font-black shrink-0">
                        {song.total_votes} votes
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full h-14 rounded-none border-t border-border/50 font-black text-xs uppercase tracking-widest text-primary hover:bg-primary/5" asChild>
                  <a href="/song-suggestions">View All Suggestions <ChevronRight className="ml-1 h-4 w-4" /></a>
                </Button>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-black font-lora">AI Prompt Ideas</h2>
            </div>
            <div className="space-y-3">
              {[
                "Suggest 3 pop songs with strong 3-part harmony potential for a community choir.",
                "Help me write a warm, encouraging email to members about learning a difficult bridge.",
                "Analyze the current top suggestions and find a common musical theme."
              ].map((prompt, i) => (
                <Card key={i} className="border-none shadow-sm bg-primary/5 rounded-xl p-4 group cursor-pointer hover:bg-primary/10 transition-all" onClick={() => {
                  navigator.clipboard.writeText(prompt);
                  showSuccess("Prompt copied!");
                }}>
                  <p className="text-xs font-medium text-muted-foreground italic leading-relaxed">"{prompt}"</p>
                  <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge className="bg-primary text-white text-[8px] font-black uppercase tracking-widest">Copy Prompt</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>

      <footer className="text-center pt-16 border-t border-border/50 pb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
          Resonance Repertoire Studio v1.0
        </p>
      </footer>
    </div>
  );
};

export default AdminRepertoireZone;