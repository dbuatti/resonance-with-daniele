"use client";

import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Facebook, ExternalLink, CheckCircle2, Copy, Link as LinkIcon } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface FacebookGroupTrackerProps {
  eventId: string;
  postText: string;
}

const groupLinks: Record<string, string> = {
  "fb-malvern-noticeboard": "https://www.facebook.com/groups/301509297978154",
  "fb-malvern-community": "https://www.facebook.com/groups/497354361728412/",
  "fb-malvern-notice-board-public": "https://www.facebook.com/groups/1124143148868314/",
  "fb-australian-choral-collective": "https://www.facebook.com/groups/408800682884399/",
  "fb-choirs-of-melbourne": "https://www.facebook.com/groups/1173481763392463/",
  "fb-community-choir-network": "https://www.facebook.com/groups/303437066726860/",
  "fb-armadale-community": "https://www.facebook.com/groups/143836535646535/",
  "fb-glen-iris-malvern-armadale": "https://www.facebook.com/groups/1648484808715845/",
  "fb-stonnington-noticeboard": "https://www.facebook.com/groups/stonningtoncommunity/",
  "fb-melbourne-singers": "https://www.facebook.com/groups/melbournesingersandmusicians/",
  "fb-melbourne-musicians": "https://www.facebook.com/groups/melbournemusiciansandartists/",
  "fb-gig-guide-melbourne": "https://www.facebook.com/groups/melbournegigguide/"
};

const FacebookGroupTracker: React.FC<FacebookGroupTrackerProps> = ({ eventId, postText }) => {
  const { user } = useSession();
  const queryClient = useQueryClient();

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

  const handleCopyPost = () => {
    navigator.clipboard.writeText(postText);
    showSuccess("Post content copied!");
  };

  if (loadingTasks || loadingStatus) return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-1.5">
      {tasks?.map((task) => {
        const isDone = completedTaskKeys?.includes(task.task_key);
        const link = groupLinks[task.task_key];

        return (
          <div
            key={task.id}
            className={cn(
              "flex items-center justify-between p-2.5 rounded-xl border transition-all group",
              isDone 
                ? "bg-green-500/5 border-green-500/10 opacity-60" 
                : "bg-card border-primary/5 shadow-sm hover:border-primary/20"
            )}
          >
            <div className="flex items-center gap-3 flex-1">
              <Checkbox
                checked={isDone}
                onCheckedChange={() => toggleMutation.mutate(task.task_key)}
                className="h-4 w-4 rounded border-2"
              />
              <div className="flex flex-col">
                <span className={cn(
                  "text-sm font-bold font-lora",
                  isDone && "line-through text-muted-foreground"
                )}>
                  {task.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5"
                      onClick={handleCopyPost}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy Post</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {link && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg text-primary hover:bg-primary/10"
                        asChild
                      >
                        <a href={link} target="_blank" rel="noopener noreferrer">
                          <LinkIcon className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Open Group</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FacebookGroupTracker;