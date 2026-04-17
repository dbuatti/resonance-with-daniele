"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/integrations/supabase/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2, UserPlus, CheckCircle2, ArrowDownToLine } from "lucide-react";
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
      // 1. Get all unique names ever added to outreach_targets
      const { data: allHistoricalTargets } = await supabase
        .from("outreach_targets")
        .select("name");

      if (!allHistoricalTargets || allHistoricalTargets.length === 0) {
        showError("No historical outreach contacts found.");
        return;
      }

      // 2. Get names already in the current list to avoid duplicates
      const currentNames = new Set(targets?.map(t => t.name.toLowerCase().trim()) || []);
      
      // 3. Filter for unique names not in current list
      const uniqueHistoricalNames = Array.from(new Set(
        allHistoricalTargets
          .map(t => t.name.trim())
          .filter(name => name && !currentNames.has(name.toLowerCase()))
      ));

      if (uniqueHistoricalNames.length === 0) {
        showSuccess("Current list already contains all historical contacts.");
        return;
      }

      // 4. Insert them for the current event
      const newTargets = uniqueHistoricalNames.map(name => ({
        name,
        admin_id: user.id,
        event_id: eventId,
        is_messaged: false
      }));

      const { error: insertError } = await supabase.from("outreach_targets").insert(newTargets);
      if (insertError) throw insertError;

      showSuccess(`Successfully added ${uniqueHistoricalNames.length} historical contacts!`);
      queryClient.invalidateQueries({ queryKey: ["outreachTargets", eventId] });
    } catch (err: any) {
      console.error("[OutreachTracker] Rollover failed:", err);
      showError("Failed to roll over contacts: " + err.message);
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

  if (isLoading) return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const messagedCount = targets?.filter(t => t.is_messaged).length || 0;
  const totalCount = targets?.length || 0;

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          {messagedCount} / {totalCount} Messaged
        </p>
        {totalCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRollover}
            disabled={isRollingOver}
            className="h-6 px-2 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/5"
          >
            <ArrowDownToLine className="mr-1 h-3 w-3" /> Sync All
          </Button>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          placeholder="Add name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="h-9 rounded-lg bg-background border-primary/10 focus-visible:ring-primary text-sm"
          disabled={addMutation.isPending || isRollingOver}
        />
        <Button type="submit" size="icon" className="h-9 w-9 rounded-lg shrink-0" disabled={addMutation.isPending || isRollingOver}>
          {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </form>

      <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {targets?.map((target) => (
          <div
            key={target.id}
            className={cn(
              "flex items-center justify-between p-2.5 rounded-xl border transition-all",
              target.is_messaged 
                ? "bg-green-500/5 border-green-500/10 opacity-60" 
                : "bg-background border-primary/5 shadow-sm"
            )}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={target.is_messaged}
                onCheckedChange={(checked) => 
                  toggleMutation.mutate({ id: target.id, is_messaged: !!checked })
                }
                className="h-4 w-4 rounded border-2"
              />
              <span className={cn(
                "text-sm font-bold font-lora",
                target.is_messaged && "line-through text-muted-foreground"
              )}>
                {target.name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteMutation.mutate(target.id)}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}

        {totalCount === 0 && (
          <div className="text-center py-8 bg-muted/10 rounded-2xl border-2 border-dashed border-border space-y-3">
            <UserPlus className="h-8 w-8 text-muted-foreground mx-auto opacity-20" />
            <p className="text-xs font-medium text-muted-foreground">List is empty.</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRollover}
              disabled={isRollingOver}
              className="rounded-lg font-bold h-8 text-[10px] uppercase tracking-widest border-primary/20 text-primary"
            >
              {isRollingOver ? "Syncing..." : "Sync All Historical"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutreachTracker;