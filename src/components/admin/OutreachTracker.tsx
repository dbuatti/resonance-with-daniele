"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/integrations/supabase/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2, UserPlus, CheckCircle2, RefreshCw, ArrowDownToLine } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";

interface OutreachTarget {
  id: string;
  name: string;
  is_messaged: boolean;
  event_id: string | null;
}

interface OutreachTrackerProps {
  eventId: string;
}

const OutreachTracker: React.FC<OutreachTrackerProps> = ({ eventId }) => {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [isRollingOver, setIsRollingOver] = useState(false);

  const { data: targets, isLoading } = useQuery<OutreachTarget[]>({
    queryKey: ["outreachTargets", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("outreach_targets")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!eventId,
  });

  const handleRollover = async () => {
    if (!user || !eventId || isRollingOver) return;
    
    setIsRollingOver(true);
    try {
      // 1. Get current event date
      const { data: currentEvent } = await supabase
        .from("events")
        .select("date")
        .eq("id", eventId)
        .single();

      if (!currentEvent) throw new Error("Current event not found");

      // 2. Find the most recent event before this one that has targets
      const { data: prevEvents } = await supabase
        .from("events")
        .select("id, date")
        .lt("date", currentEvent.date)
        .order("date", { ascending: false });

      if (!prevEvents || prevEvents.length === 0) {
        showError("No previous events found to roll over from.");
        return;
      }

      // 3. Check each previous event for targets until we find some
      let sourceTargets: any[] = [];
      let sourceEventTitle = "";

      for (const prevEvent of prevEvents) {
        const { data: foundTargets } = await supabase
          .from("outreach_targets")
          .select("name")
          .eq("event_id", prevEvent.id);
        
        if (foundTargets && foundTargets.length > 0) {
          sourceTargets = foundTargets;
          break;
        }
      }

      if (sourceTargets.length === 0) {
        showError("No previous outreach lists found.");
        return;
      }

      // 4. Insert them for the current event
      const newTargets = sourceTargets.map(t => ({
        name: t.name,
        admin_id: user.id,
        event_id: eventId,
        is_messaged: false
      }));

      const { error: insertError } = await supabase.from("outreach_targets").insert(newTargets);
      if (insertError) throw insertError;

      showSuccess(`Successfully rolled over ${sourceTargets.length} people!`);
      queryClient.invalidateQueries({ queryKey: ["outreachTargets", eventId] });
    } catch (err: any) {
      console.error("[OutreachTracker] Rollover failed:", err);
      showError("Failed to roll over list: " + err.message);
    } finally {
      setIsRollingOver(false);
    }
  };

  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from("outreach_targets")
        .insert({ name, admin_id: user?.id, event_id: eventId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outreachTargets", eventId] });
      setNewName("");
    },
    onError: (error: any) => showError(error.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_messaged }: { id: string; is_messaged: boolean }) => {
      const { error } = await supabase
        .from("outreach_targets")
        .update({ is_messaged })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["outreachTargets", eventId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("outreach_targets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["outreachTargets", eventId] }),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addMutation.mutate(newName.trim());
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const messagedCount = targets?.filter(t => t.is_messaged).length || 0;
  const totalCount = targets?.length || 0;

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
          {messagedCount} / {totalCount} Messaged
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          placeholder="Add someone new..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="h-12 rounded-xl bg-background border-primary/20 focus-visible:ring-primary"
          disabled={addMutation.isPending || isRollingOver}
        />
        <Button type="submit" size="icon" className="h-12 w-12 rounded-xl" disabled={addMutation.isPending || isRollingOver}>
          {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
        </Button>
      </form>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {targets?.map((target) => (
          <div
            key={target.id}
            className={cn(
              "flex items-center justify-between p-4 rounded-2xl border transition-all",
              target.is_messaged 
                ? "bg-green-500/5 border-green-500/20 opacity-60" 
                : "bg-background border-primary/10 shadow-sm"
            )}
          >
            <div className="flex items-center gap-4">
              <Checkbox
                checked={target.is_messaged}
                onCheckedChange={(checked) => 
                  toggleMutation.mutate({ id: target.id, is_messaged: !!checked })
                }
                className="h-6 w-6 rounded-lg border-2"
              />
              <span className={cn(
                "text-lg font-bold font-lora",
                target.is_messaged && "line-through text-muted-foreground"
              )}>
                {target.name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteMutation.mutate(target.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {totalCount === 0 && (
          <div className="text-center py-12 bg-muted/10 rounded-[2rem] border-2 border-dashed border-border space-y-4">
            <div className="space-y-2">
              <UserPlus className="h-10 w-10 text-muted-foreground mx-auto opacity-20" />
              <p className="text-sm font-medium text-muted-foreground">Your outreach list is empty.</p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRollover}
              disabled={isRollingOver}
              className="rounded-xl font-bold border-primary/20 text-primary hover:bg-primary/5"
            >
              {isRollingOver ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rolling over...</>
              ) : (
                <><ArrowDownToLine className="mr-2 h-4 w-4" /> Roll Over Previous List</>
              )}
            </Button>
          </div>
        )}
      </div>

      {totalCount > 0 && messagedCount === totalCount && (
        <div className="p-6 bg-green-500 text-white rounded-2xl shadow-xl text-center animate-bounce">
          <p className="text-xl font-black flex items-center justify-center gap-2">
            <CheckCircle2 className="h-6 w-6" /> ALL {totalCount} MESSAGED!
          </p>
        </div>
      )}
    </div>
  );
};

export default OutreachTracker;