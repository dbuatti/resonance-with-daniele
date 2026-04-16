"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Facebook, ExternalLink, CheckCircle2 } from "lucide-react";
import { showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

interface FacebookGroupTrackerProps {
  eventId: string;
}

const groupLinks: Record<string, string> = {
  "fb-malvern-noticeboard": "https://www.facebook.com/groups/301509297978154",
  "fb-malvern-community": "https://www.facebook.com/groups/497354361728412/",
  "fb-malvern-notice-board-public": "https://www.facebook.com/groups/1124143148868314/",
  "fb-australian-choral-collective": "https://www.facebook.com/groups/408800682884399/",
  "fb-choirs-of-melbourne": "https://www.facebook.com/groups/1173481763392463/",
  "fb-community-choir-network": "https://www.facebook.com/groups/303437066726860/"
};

const FacebookGroupTracker: React.FC<FacebookGroupTrackerProps> = ({ eventId }) => {
  const { user } = useSession();
  const queryClient = useQueryClient();

  // 1. Fetch FB tasks
  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ["facebookTasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_tasks")
        .select("*")
        .eq("category", "Facebook Groups")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // 2. Fetch completion status
  const { data: completedTaskKeys, isLoading: loadingStatus } = useQuery<string[]>({
    queryKey: ["marketingTaskStatus", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_task_status")
        .select("task_id")
        .eq("event_id", eventId)
        .eq("is_completed", true);
      if (error) throw error;
      return data.map(d => d.task_id);
    },
    enabled: !!user && !!eventId,
  });

  const toggleMutation = useMutation({
    mutationFn: async (taskKey: string) => {
      const isCurrentlyCompleted = completedTaskKeys?.includes(taskKey);
      const { error } = await supabase
        .from("marketing_task_status")
        .upsert({ 
          admin_id: user?.id, 
          task_id: taskKey, 
          event_id: eventId,
          is_completed: !isCurrentlyCompleted 
        }, { onConflict: 'admin_id,task_id,event_id' });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["marketingTaskStatus", eventId] }),
  });

  if (loadingTasks || loadingStatus) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {tasks?.map((task) => {
        const isDone = completedTaskKeys?.includes(task.task_key);
        const link = groupLinks[task.task_key];

        return (
          <div
            key={task.id}
            className={cn(
              "flex items-center justify-between p-4 rounded-2xl border transition-all group",
              isDone 
                ? "bg-green-500/5 border-green-500/20 opacity-60" 
                : "bg-card border-primary/10 shadow-sm hover:border-primary/30"
            )}
          >
            <div className="flex items-center gap-4 flex-1">
              <Checkbox
                checked={isDone}
                onCheckedChange={() => toggleMutation.mutate(task.task_key)}
                className="h-6 w-6 rounded-lg border-2"
              />
              <div className="flex flex-col">
                <span className={cn(
                  "text-base font-bold font-lora",
                  isDone && "line-through text-muted-foreground"
                )}>
                  {task.label}
                </span>
                {isDone && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Posted
                  </span>
                )}
              </div>
            </div>

            {link && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl font-bold text-primary hover:bg-primary/10"
                asChild
              >
                <a href={link} target="_blank" rel="noopener noreferrer">
                  Post Now <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FacebookGroupTracker;