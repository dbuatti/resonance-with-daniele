"use client";

import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/integrations/supabase/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2, UserPlus, CheckCircle2 } from "lucide-react";
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
    if (!newName.trim() || (targets?.length || 0) >= 10) return;
    addMutation.mutate(newName.trim());
  };

  if (isLoading) return <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />;

  const remainingSlots = 10 - (targets?.length || 0);

  return (
    <div className="space-y-6 w-full">
      {remainingSlots > 0 && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            placeholder={`Add person ${11 - remainingSlots}...`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-12 rounded-xl bg-background border-primary/20 focus-visible:ring-primary"
            disabled={addMutation.isPending}
          />
          <Button type="submit" size="icon" className="h-12 w-12 rounded-xl" disabled={addMutation.isPending}>
            {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
          </Button>
        </form>
      )}

      <div className="space-y-3">
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

        {[...Array(remainingSlots)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl border-2 border-dashed border-muted-foreground/10 flex items-center justify-center text-muted-foreground/20">
            <UserPlus className="h-5 w-5" />
          </div>
        ))}
      </div>

      {targets && targets.length === 10 && targets.every(t => t.is_messaged) && (
        <div className="p-6 bg-green-500 text-white rounded-2xl shadow-xl text-center animate-bounce">
          <p className="text-xl font-black flex items-center justify-center gap-2">
            <CheckCircle2 className="h-6 w-6" /> ALL 10 MESSAGED!
          </p>
        </div>
      )}
    </div>
  );
};

export default OutreachTracker;