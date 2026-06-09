"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/auth";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, Calendar, Clock, Users, Sparkles, Heart, LogIn, Check } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
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

const JunePollPage: React.FC = () => {
  const { user, profile, loading: loadingSession } = useSession();
  const queryClient = useQueryClient();
  const [voterName, setVoterName] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);

  // Pre-fill name if user is logged in
  useEffect(() => {
    if (user && profile) {
      const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
      setVoterName(fullName || user.email?.split("@")[0] || "");
    }
  }, [user, profile]);

  // Fetch dynamic poll configuration
  const { data: pollConfig, isLoading: loadingConfig } = useQuery({
    queryKey: ["pollConfig"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_notes")
        .select("content")
        .eq("note_key", "june_poll_config")
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching poll config:", error);
        return DEFAULT_POLL_CONFIG;
      }
      
      if (data?.content) {
        try {
          return JSON.parse(data.content);
        } catch (e: unknown) {
          console.error("Error parsing poll config JSON:", e);
        }
      }
      return DEFAULT_POLL_CONFIG;
    }
  });

  // Fetch existing responses to show live results
  const { data: responses, isLoading: loadingResponses } = useQuery<PollResponse[]>({
    queryKey: ["junePollResponses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("june_poll_responses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const submitVote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("june_poll_responses")
        .insert({
          voter_name: voterName.trim(),
          selected_options: selectedOptions
        });
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Thank you! Your availability has been recorded.");
      setHasVoted(true);
      queryClient.invalidateQueries({ queryKey: ["junePollResponses"] });
    },
    onError: (err: any) => {
      showError("Failed to submit: " + err.message);
    }
  });

  const handleToggleOption = (option: string) => {
    setSelectedOptions(prev =>
      prev.includes(option)
        ? prev.filter(o => o !== option)
        : [...prev, option]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voterName.trim()) {
      showError("Please enter your name so Daniele knows who you are!");
      return;
    }
    if (selectedOptions.length === 0) {
      showError("Please select at least one option, or let Daniele know if none work.");
      return;
    }
    submitVote.mutate();
  };

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!responses || !pollConfig) return {};
    const counts: Record<string, number> = {};
    const votersByOption: Record<string, string[]> = {};
    
    const options = pollConfig.options || DEFAULT_POLL_CONFIG.options;
    options.forEach(opt => {
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

    return { counts, votersByOption, totalVoters: responses.length };
  }, [responses, pollConfig]);

  const isLoading = loadingSession || loadingConfig || loadingResponses;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const activeConfig = pollConfig || DEFAULT_POLL_CONFIG;
  const optionsList = activeConfig.options || DEFAULT_POLL_CONFIG.options;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-4">
      <header className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
          <Calendar className="h-3.5 w-3.5" />
          <span>Community Poll</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black font-lora tracking-tighter leading-none">
          {activeConfig.title}
        </h1>
        <p className="text-base text-muted-foreground font-medium max-w-2xl mx-auto">
          {activeConfig.description}
        </p>
      </header>

      {/* Guest Sign-In Banner */}
      {!user && (
        <Card className="border-none shadow-sm rounded-xl bg-accent/10 border border-accent/20 p-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-foreground shrink-0" />
            <p className="text-xs font-bold text-accent-foreground leading-tight">
              Already a member? Sign in to automatically pre-fill your name.
            </p>
          </div>
          <Button size="sm" variant="outline" asChild className="shrink-0 font-bold rounded-lg h-9">
            <Link to="/login">
              <LogIn className="h-3.5 w-3.5 mr-1.5" /> Sign In
            </Link>
          </Button>
        </Card>
      )}

      <Card className="border-none shadow-md rounded-2xl bg-primary/5 overflow-hidden">
        <CardContent className="p-5 space-y-3 text-sm md:text-base leading-relaxed text-muted-foreground font-medium">
          <p>Hi everyone,</p>
          <p>
            I'm working on locking in our rehearsal schedule and need to know when you're available.
          </p>
          <p className="bg-background/50 p-3 rounded-xl border border-primary/10 text-primary font-bold text-sm">
            Sundays at our usual venue are proving tricky this month, but I'm exploring alternatives — so please still vote for any Sunday options that work for you!
          </p>
        </CardContent>
      </Card>

      {hasVoted ? (
        <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-card animate-fade-in-up">
          <CardHeader className="bg-green-500/10 p-6 text-center">
            <div className="bg-green-500 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2 shadow-md">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-black font-lora text-green-700">Availability Submitted!</CardTitle>
            <CardDescription className="text-xs text-green-600/80 font-medium">
              Thanks, {voterName}! Here is how the votes are looking so far:
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              {optionsList.map(option => {
                const count = stats.counts?.[option] || 0;
                const pct = stats.totalVoters ? (count / stats.totalVoters) * 100 : 0;
                const voters = stats.votersByOption?.[option] || [];

                return (
                  <div key={option} className="space-y-1">
                    <div className="flex justify-between items-end text-xs font-bold">
                      <span className="text-foreground">{option}</span>
                      <span className="text-primary">{count} vote{count !== 1 ? "s" : ""}</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    {voters.length > 0 && (
                      <p className="text-[10px] text-muted-foreground font-medium">
                        Available: {voters.join(", ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest pt-2">
              Total Responses: {stats.totalVoters}
            </p>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up">
          <Card className="border-none shadow-md rounded-2xl bg-card">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="voter-name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your Name</Label>
                <Input
                  id="voter-name"
                  placeholder="Enter your full name..."
                  value={voterName}
                  onChange={e => setVoterName(e.target.value)}
                  className="h-11 rounded-xl font-bold text-base"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select your available times</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {optionsList.map(option => {
                    const isChecked = selectedOptions.includes(option);
                    return (
                      <div
                        key={option}
                        onClick={() => handleToggleOption(option)}
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
            </CardContent>
          </Card>

          <Button
            type="submit"
            size="lg"
            className="w-full h-12 text-base font-black rounded-xl shadow-lg"
            disabled={submitVote.isPending}
          >
            {submitVote.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                Submit My Availability <Heart className="ml-2 h-4 w-4 fill-current" />
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
};

export default JunePollPage;