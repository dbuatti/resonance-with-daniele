"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Users, Copy, Trash2, ShieldCheck, Mail, Check } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import BackButton from "@/components/ui/BackButton";
import { format, parseISO } from "date-fns";

const POLL_OPTIONS = [
  "Sunday 7 June – 1:00–3:15pm",
  "Saturday 27 June – 10:00am–12:30pm",
  "Saturday 27 June – 2:00–4:30pm",
  "Sunday 28 June – 10:00am–12:30pm",
  "Sunday 28 June – 2:00–4:30pm"
];

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

  React.useEffect(() => {
    if (!loading && (!user || !user.is_admin)) {
      navigate("/");
      showError("Access Denied: Admin only.");
    }
  }, [user, loading, navigate]);

  const { data: responses, isLoading } = useQuery<PollResponse[]>({
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
    onError: (err: any) => showError(err.message)
  });

  const stats = React.useMemo(() => {
    if (!responses) return { counts: {}, votersByOption: {}, totalVoters: 0 };
    const counts: Record<string, number> = {};
    const votersByOption: Record<string, string[]> = {};
    
    POLL_OPTIONS.forEach(opt => {
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
    POLL_OPTIONS.forEach(opt => {
      if (counts[opt] > maxVotes) {
        maxVotes = counts[opt];
        winner = opt;
      }
    });

    return { counts, votersByOption, totalVoters: responses.length, winner, maxVotes };
  }, [responses]);

  const pollLink = `${window.location.origin}/polls/june-availability`;

  const emailTemplate = `Subject: Resonance Choir – June Rehearsal Availability

Hi everyone,

I'm working on locking in our June rehearsal schedule and need to know when you're available.

Sundays at our usual venue are proving tricky this month, but I'm exploring alternatives — so please still vote for any Sunday options that work for you!

Head to the poll link below and vote for ALL the time slots you can make:

${pollLink}

Please respond by Friday 15 May so I can confirm the date.

Looking forward to singing with you all soon!

Sent with resonance,
Daniele Buatti`;

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(emailTemplate);
    setCopiedTemplate(true);
    showSuccess("Email template copied to clipboard!");
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

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
            June Poll Results
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Track rehearsal availability and copy the broadcast email.
          </p>
        </div>
        <Button onClick={handleCopyTemplate} className="h-14 px-8 rounded-2xl font-black shadow-lg">
          {copiedTemplate ? <Check className="mr-2 h-5 w-5" /> : <Mail className="mr-2 h-5 w-5" />}
          Copy Email Template
        </Button>
      </header>

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
          {POLL_OPTIONS.map(option => {
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
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => deleteResponse.mutate(r.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminJunePollResults;