"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, Users, Copy, Trash2, ShieldCheck, Mail, Check, Settings, Plus, X, Save, Link as LinkIcon, UserPlus, AlertTriangle } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import BackButton from "@/components/ui/BackButton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const DEFAULT_POLL_CONFIG = {
  title: "June Rehearsal Availability",
  description: "Help Daniele lock in our June rehearsal schedule. Please vote for ALL slots you can make!",
  options: [
    "Sunday 7 June – 1:00–3:15pm",
    "Saturday 27 June – 10:00am–12:30pm",
    "Saturday 27 June – 2:00–4:30pm",
    "Sunday 28 June – 10:00am–12:30pm",
    "Sunday 28 June – 2:00–4:30pm"
  ]
};

interface PollResponse {
  id: string;
  voter_name: string;
  selected_options: string[];
  created_at: string;
}

const AdminJunePollResults: React.FC = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);

  // Editor States
  const [pollTitle, setPollTitle] = useState("");
  const [pollDescription, setPollDescription] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>([]);
  const [newOptionText, setNewOptionText] = useState("");

  // Manual Vote States
  const [selectedMemberId, setSelectedMemberId] = useState<string>("custom");
  const [isCustomName, setIsCustomName] = useState(true);
  const [manualVoterName, setManualVoterName] = useState("");
  const [manualSelectedOptions, setManualSelectedOptions] = useState<string[]>([]);

  const [deletingResponseId, setDeletingResponseId] = useState<string | null>(null);

  React.useEffect(() => {
    if (!loading && (!user || !user.is_admin)) {
      navigate("/");
      showError("Access Denied: Admin only.");
    }
  }, [user, loading, navigate]);

  // Fetch dynamic poll configuration
  const { data: pollConfig, isLoading: loadingConfig } = useQuery({
    queryKey: ["pollConfig"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_notes")
        .select("content")
        .eq("note_key", "june_poll_config")
        .maybeSingle();
      
      if (error) return DEFAULT_POLL_CONFIG;
      
      if (data?.content) {
        try {
          return JSON.parse(data.content);
        } catch {
          showError("Failed to parse poll configuration.");
        }
      }
      return DEFAULT_POLL_CONFIG;
    }
  });

  // Fetch profiles for manual vote matching
  const { data: profiles } = useQuery({
    queryKey: ["allProfilesForPollMatching"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .order("first_name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.is_admin && isManualDialogOpen
  });

  // Initialize editor states when config loads
  useEffect(() => {
    if (pollConfig) {
      setPollTitle(pollConfig.title || DEFAULT_POLL_CONFIG.title);
      setPollDescription(pollConfig.description || DEFAULT_POLL_CONFIG.description);
      setPollOptions(pollConfig.options || DEFAULT_POLL_CONFIG.options);
    }
  }, [pollConfig]);

  const { data: responses, isLoading: loadingResponses } = useQuery<PollResponse[]>({
    queryKey: ["junePollResponses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("june_poll_responses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.is_admin
  });

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      const configJson = JSON.stringify({
        title: pollTitle,
        description: pollDescription,
        options: pollOptions
      });

      const { error } = await supabase
        .from("admin_notes")
        .upsert({
          admin_id: user?.id,
          note_key: "june_poll_config",
          content: configJson
        }, { onConflict: "note_key" });

      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Poll configuration saved successfully!");
      setShowEditor(false);
      queryClient.invalidateQueries({ queryKey: ["pollConfig"] });
    },
    onError: (err: Error) => showError("Failed to save: " + err.message)
  });

  // Submit manual vote mutation
  const submitManualVote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("june_poll_responses")
        .insert({
          voter_name: manualVoterName.trim(),
          selected_options: manualSelectedOptions
        });
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess(`Logged vote for ${manualVoterName}!`);
      setIsManualDialogOpen(false);
      setManualVoterName("");
      setSelectedMemberId("custom");
      setIsCustomName(true);
      setManualSelectedOptions([]);
      queryClient.invalidateQueries({ queryKey: ["junePollResponses"] });
    },
    onError: (err: Error) => {
      showError("Failed to log vote: " + err.message);
    }
  });

  const deleteResponse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("june_poll_responses")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Response deleted.");
      queryClient.invalidateQueries({ queryKey: ["junePollResponses"] });
    },
    onError: (err: Error) => showError(err.message)
  });

  const handleAddOption = () => {
    if (!newOptionText.trim()) return;
    if (pollOptions.includes(newOptionText.trim())) {
      showError("This option already exists.");
      return;
    }
    setPollOptions([...pollOptions, newOptionText.trim()]);
    setNewOptionText("");
  };

  const handleRemoveOption = (index: number) => {
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  const handleToggleManualOption = (option: string) => {
    setManualSelectedOptions(prev =>
      prev.includes(option)
        ? prev.filter(o => o !== option)
        : [...prev, option]
    );
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualVoterName.trim()) {
      showError("Please select a member or enter a guest name.");
      return;
    }
    if (manualSelectedOptions.length === 0) {
      showError("Please select at least one option.");
      return;
    }
    submitManualVote.mutate();
  };

  const stats = React.useMemo(() => {
    const activeOptions = pollConfig?.options || DEFAULT_POLL_CONFIG.options;
    if (!responses) return { counts: {}, votersByOption: {}, totalVoters: 0, winner: "", maxVotes: 0 };
    const counts: Record<string, number> = {};
    const votersByOption: Record<string, string[]> = {};
    
    activeOptions.forEach(opt => {
      counts[opt] = 0;
      votersByOption[opt] = [];
    });

    responses.forEach(r => {
      r.selected_options.forEach(opt => {
        if (counts[opt] !== undefined) {
          counts[opt]++;
          votersByOption[opt].push(r.voter_name);
        }
      });
    });

    // Find winning option
    let winner = "";
    let maxVotes = -1;
    activeOptions.forEach(opt => {
      if (counts[opt] > maxVotes) {
        maxVotes = counts[opt];
        winner = opt;
      }
    });

    return { counts, votersByOption, totalVoters: responses.length, winner, maxVotes };
  }, [responses, pollConfig]);

  const pollLink = `${window.location.origin}/polls/june-availability`;

  const emailTemplate = `Subject: Resonance Choir – Rehearsal Availability

Hi everyone,

I'm working on locking in our rehearsal schedule and need to know when you're available.

Sundays at our usual venue are proving tricky this month, but I'm exploring alternatives — so please still vote for any Sunday options that work for you!

Head to the poll link below and vote for ALL the time slots you can make:

${pollLink}

Please respond as soon as possible so I can confirm the date.

Looking forward to singing with you all soon!

Sent with resonance,
Daniele Buatti`;

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(emailTemplate);
    setCopiedTemplate(true);
    showSuccess("Email template copied to clipboard!");
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pollLink);
    setCopiedLink(true);
    showSuccess("Poll link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isLoading = loadingConfig || loadingResponses;

  if (loading || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const activeOptions = pollConfig?.options || DEFAULT_POLL_CONFIG.options;

  return (
    <div className="max-w-5xl mx-auto py-8 md:py-12 px-4 space-y-10">
      <BackButton to="/admin" />

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck className="h-3 w-3" />
            <span>Admin Operations</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black font-lora tracking-tighter leading-none">
            {pollConfig?.title || DEFAULT_POLL_CONFIG.title}
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Track rehearsal availability, edit poll options, and copy the broadcast email.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setIsManualDialogOpen(true)} className="h-14 px-6 rounded-2xl font-black border-primary/20 text-primary hover:bg-primary/5">
            <UserPlus className="mr-2 h-5 w-5" />
            Add Manual Vote
          </Button>
          <Button variant="outline" onClick={handleCopyLink} className="h-14 px-6 rounded-2xl font-black border-primary/20 text-primary hover:bg-primary/5">
            {copiedLink ? <Check className="mr-2 h-5 w-5" /> : <LinkIcon className="mr-2 h-5 w-5" />}
            Copy Poll Link
          </Button>
          <Button variant="outline" onClick={() => setShowEditor(!showEditor)} className="h-14 px-6 rounded-2xl font-black border-primary/20 text-primary hover:bg-primary/5">
            <Settings className="mr-2 h-5 w-5" />
            {showEditor ? "Hide Settings" : "Edit Poll"}
          </Button>
          <Button onClick={handleCopyTemplate} className="h-14 px-8 rounded-2xl font-black shadow-lg">
            {copiedTemplate ? <Check className="mr-2 h-5 w-5" /> : <Mail className="mr-2 h-5 w-5" />}
            Copy Email Template
          </Button>
        </div>
      </header>

      {/* Live Poll Editor Panel */}
      {showEditor && (
        <Card className="border-2 border-primary/20 shadow-2xl rounded-[2rem] bg-primary/5 animate-in fade-in slide-in-from-top-4">
          <CardHeader>
            <CardTitle className="text-xl font-black font-lora flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" /> Edit Poll Settings
            </CardTitle>
            <CardDescription>Change the title, description, and options. Changes apply instantly to the public page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Poll Title</Label>
              <Input 
                value={pollTitle} 
                onChange={e => setPollTitle(e.target.value)} 
                className="h-12 rounded-xl font-bold bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Poll Description</Label>
              <Textarea 
                value={pollDescription} 
                onChange={e => setPollDescription(e.target.value)} 
                className="min-h-[80px] rounded-xl font-medium bg-background"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Poll Options (Dates & Times)</Label>
              <div className="space-y-2">
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-background rounded-xl border border-border/50">
                    <span className="text-sm font-bold">{option}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveOption(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input 
                  placeholder="Add new option (e.g. Saturday 20 June – 10:00am–12:30pm)" 
                  value={newOptionText} 
                  onChange={e => setNewOptionText(e.target.value)}
                  className="h-12 rounded-xl bg-background"
                />
                <Button type="button" onClick={handleAddOption} className="h-12 px-6 rounded-xl font-black">
                  <Plus className="h-5 w-5 mr-2" /> Add
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="ghost" onClick={() => setShowEditor(false)} className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button onClick={() => saveConfigMutation.mutate()} disabled={saveConfigMutation.isPending} className="rounded-xl font-black px-8">
                {saveConfigMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Winning Option Banner */}
      {stats.totalVoters > 0 && (
        <Card className="bg-primary text-primary-foreground border-none shadow-xl rounded-[2rem] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <CardContent className="p-8 flex items-center gap-6 relative z-10">
            <div className="bg-white/20 p-4 rounded-2xl">
              <Calendar className="h-8 w-8 text-accent" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Current Frontrunner</p>
              <p className="text-2xl font-black font-lora">{stats.winner}</p>
              <p className="text-sm opacity-80 font-medium">{stats.maxVotes} votes out of {stats.totalVoters} respondents</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Results Progress */}
      <Card className="border-none shadow-xl rounded-[2rem] bg-card">
        <CardHeader>
          <CardTitle className="text-xl font-black font-lora">Live Standings</CardTitle>
          <CardDescription>Aggregated votes per rehearsal slot.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {activeOptions.map(option => {
            const count = stats.counts?.[option] || 0;
            const pct = stats.totalVoters ? (count / stats.totalVoters) * 100 : 0;
            const voters = stats.votersByOption?.[option] || [];

            return (
              <div key={option} className="space-y-2">
                <div className="flex justify-between items-end text-sm font-bold">
                  <span className="text-foreground">{option}</span>
                  <span className="text-primary">{count} vote{count !== 1 ? "s" : ""}</span>
                </div>
                <Progress value={pct} className="h-3" />
                {voters.length > 0 && (
                  <p className="text-xs text-muted-foreground font-medium">
                    Available: {voters.join(", ")}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Individual Responses Table */}
      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-card">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-xl font-black font-lora">Individual Responses</CardTitle>
          <CardDescription>Who voted for what.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-8 py-4">Name</TableHead>
                  <TableHead>Available Slots</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead className="text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground font-medium">
                      No responses yet. Send out the email template to get started!
                    </TableCell>
                  </TableRow>
                ) : (
                  responses?.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="pl-8 font-bold">{r.voter_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5 max-w-md py-2">
                          {r.selected_options.map(opt => (
                            <Badge key={opt} variant="secondary" className="text-[9px] font-black uppercase tracking-widest">
                              {opt.split(" – ")[0]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(parseISO(r.created_at), "MMM d, h:mm a")}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              disabled={deletingResponseId === r.id}
                            >
                              {deletingResponseId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[2.5rem]">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Response?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove {r.voter_name}'s vote.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteResponse.mutate(r.id)} className="rounded-xl font-bold bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Manual Vote Dialog */}
      <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black font-lora">Log Manual Vote</DialogTitle>
            <DialogDescription>Log availability on behalf of a member who responded via Facebook, SMS, or email.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleManualSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Member</Label>
              <Select
                value={selectedMemberId}
                onValueChange={(val) => {
                  setSelectedMemberId(val);
                  if (val === "custom") {
                    setIsCustomName(true);
                    setManualVoterName("");
                  } else {
                    setIsCustomName(false);
                    const member = profiles?.find(p => p.id === val);
                    if (member) {
                      const fullName = `${member.first_name || ""} ${member.last_name || ""}`.trim();
                      setManualVoterName(fullName || member.email?.split("@")[0] || "");
                    }
                  }
                }}
              >
                <SelectTrigger className="h-12 rounded-xl font-bold">
                  <SelectValue placeholder="Choose a member..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-[200px]">
                  <SelectItem value="custom" className="font-bold text-primary">
                    Guest / Not in list (Type Name)
                  </SelectItem>
                  {profiles?.map((p) => {
                    const name = `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email?.split("@")[0] || "Unnamed Member";
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        {name} ({p.email})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {isCustomName && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="manual-voter-name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Guest Name</Label>
                <Input
                  id="manual-voter-name"
                  placeholder="Enter full name..."
                  value={manualVoterName}
                  onChange={e => setManualVoterName(e.target.value)}
                  className="h-12 rounded-xl font-bold"
                  required
                />
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Available Slots</Label>
              <div className="space-y-2">
                {activeOptions.map(option => {
                  const isChecked = manualSelectedOptions.includes(option);
                  return (
                    <div
                      key={option}
                      onClick={() => handleToggleManualOption(option)}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-xl border-2 transition-all cursor-pointer group",
                        isChecked 
                          ? "bg-primary/5 border-primary/30 text-primary" 
                          : "bg-background border-border/50 hover:border-primary/20"
                      )}
                    >
                      {/* Custom Checkbox Icon to avoid nested interactive element conflicts */}
                      <div className={cn(
                        "h-5 w-5 rounded border-2 flex items-center justify-center transition-all shrink-0",
                        isChecked ? "bg-primary border-primary text-white" : "border-muted-foreground/30 group-hover:border-primary"
                      )}>
                        {isChecked && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                      </div>
                      <span className="text-xs font-bold leading-tight flex-1">
                        {option}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsManualDialogOpen(false)} className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button type="submit" disabled={submitManualVote.isPending} className="rounded-xl font-black px-8">
                {submitManualVote.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Log Vote
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminJunePollResults;