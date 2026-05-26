"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, Calendar, Clock, Users, Sparkles, Heart } from "lucide-react";
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
  const queryClient = useQueryClient();
  const [voterName, setVoterName] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);

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
        } catch (e) {
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

  const isLoading = loadingConfig || loadingResponses;

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
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
          <Calendar className="h-4 w-4" />
          <span>Community Poll</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black font-lora tracking-tighter leading-none">
          {activeConfig.title}
        </h1>
        <p className="text-lg text-muted-foreground font-medium max-w-xl mx-auto">
          {activeConfig.description}
        </p>
      </header>

      <Card className="border-none shadow-xl rounded-[2rem] bg-primary/5 overflow-hidden">
        <CardContent className="p-8 space-y-4 text-sm md:text-base leading-relaxed text-muted-foreground font-medium">
          <p>Hi everyone,</p>
          <p>
            I'm working on locking in our rehearsal schedule and need to know when you're available.
          </p>
          <p className="bg-background/50 p-4 rounded-xl border border-primary/10 text-primary font-bold">
            Sundays at our usual venue are proving tricky this month, but I'm exploring alternatives — so please still vote for any Sunday options that work for you!
          </p>
        </CardContent>
      </Card>

      {hasVoted ? (
        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-card animate-fade-in-up">
          <CardHeader className="bg-green-500/10 p-8 text-center">
            <div className="bg-green-500 text-white p-3 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-black font-lora text-green-700">Availability Submitted!</CardTitle>
            <CardDescription className="text-green-600/80 font-medium">
              Thanks, {voterName}! Here is how the votes are looking so far:
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              {optionsList.map(option => {
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
                      <p className="text-[10px] text-muted-foreground font-medium">
                        Available: {voters.join(", ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-center text-xs text-muted-foreground font-bold uppercase tracking-widest pt-4">
              Total Responses: {stats.totalVoters}
            </p>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in-up">
          <Card className="border-none shadow-xl rounded-[2rem] bg-card">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="voter-name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your Name</Label>
                <Input
                  id="voter-name"
                  placeholder="Enter your full name..."
                  value={voterName}
                  onChange={e => setVoterName(e.target.value)}
                  className="h-12 rounded-xl font-bold text-lg"
                  required
                />
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select your available times</Label>
                <div className="space-y-3">
                  {optionsList.map(option => {
                    const isChecked = selectedOptions.includes(option);
                    return (
                      <div
                        key={option}
                        onClick={() => handleToggleOption(option)}
                        className={cn(
                          "flex items-center space-x-4 p-4 rounded-xl border-2 transition-all cursor-pointer group",
                          isChecked 
                            ? "bg-primary/5 border-primary/30 text-primary" 
                            : "bg-background border-border/50 hover:border-primary/20"
                        )}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleToggleOption(option)}
                          className="h-5 w-5 rounded border-2"
                        />
                        <span className="text-sm font-bold leading-tight flex-1">
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
            className="w-full h-16 text-xl font-black rounded-2xl shadow-xl"
            disabled={submitVote.isPending}
          >
            {submitVote.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                Submit My Availability <Heart className="ml-2 h-5 w-5 fill-current" />
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
};

export default JunePollPage;