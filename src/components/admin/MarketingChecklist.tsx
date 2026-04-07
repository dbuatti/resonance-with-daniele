"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ListTodo, Zap, Coffee, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/integrations/supabase/auth";

interface Task {
  id: string;
  label: string;
  category: string;
  energy: "high" | "low";
}

const tasks: Task[] = [
  { id: "personal-10", label: "Message 10 specific people personally", category: "3 Days Before", energy: "high" },
  { id: "email-regulars", label: "Email the regular member list", category: "3 Days Before", energy: "low" },
  { id: "insta-story-why", label: "Story: 30s video on why these songs", category: "3 Days Before", energy: "high" },
  { id: "community-outreach", label: "Reach out to local community nodes", category: "2 Days Before", energy: "high" },
  { id: "insta-story-chords", label: "Story: Play chords from the repertoire", category: "2 Days Before", energy: "low" },
  { id: "helper-outreach", label: "DM 3 potential 'Helpers' personally", category: "2 Days Before", energy: "high" },
  { id: "fb-groups-invite", label: "Post in community groups", category: "1 Day Before", energy: "low" },
  { id: "insta-story-final", label: "Story: Final personal invitation", category: "1 Day Before", energy: "high" },
  { id: "print-lyrics", label: "Print extra lyric sheets/scores", category: "Day Of", energy: "low" },
  { id: "inhabit-room", label: "Focus on inhabiting the room", category: "Day Of", energy: "high" },
];

interface MarketingChecklistProps {
  eventId: string;
}

const MarketingChecklist: React.FC<MarketingChecklistProps> = ({ eventId }) => {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const { data: completedTaskIds, isLoading } = useQuery<string[]>({
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
    mutationFn: async (taskId: string) => {
      const isCurrentlyCompleted = completedTaskIds?.includes(taskId);
      const { error } = await supabase
        .from("marketing_task_status")
        .upsert({ 
          admin_id: user?.id, 
          task_id: taskId, 
          event_id: eventId,
          is_completed: !isCurrentlyCompleted 
        }, { onConflict: 'admin_id,task_id,event_id' });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["marketingTaskStatus", eventId] }),
  });

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  const completedCount = completedTaskIds?.length || 0;
  const progress = (completedCount / tasks.length) * 100;

  const categories = ["3 Days Before", "2 Days Before", "1 Day Before", "Day Of"];

  return (
    <Card className="shadow-xl border-none overflow-hidden">
      <CardHeader className="bg-primary text-primary-foreground pb-6">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-6 w-6" /> Execution Checklist
          </CardTitle>
          <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">
            {completedCount} / {tasks.length}
          </span>
        </div>
        <Progress value={progress} className="h-2 bg-white/20" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {categories.map((category) => (
            <div key={category} className="p-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
                {category}
              </h3>
              <div className="space-y-3">
                {tasks
                  .filter((t) => t.category === category)
                  .map((task) => {
                    const isDone = completedTaskIds?.includes(task.id);
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border border-transparent",
                          isDone ? "bg-muted/30 opacity-50" : "bg-background shadow-sm hover:border-primary/20"
                        )}
                        onClick={() => toggleMutation.mutate(task.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {isDone ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <span className={cn(
                            "text-sm font-bold leading-tight",
                            isDone && "line-through font-normal"
                          )}>
                            {task.label}
                          </span>
                        </div>
                        <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 h-5 border-none bg-muted/50">
                          {task.energy === "high" ? <Zap className="h-3 w-3 text-yellow-600 mr-1" /> : <Coffee className="h-3 w-3 text-blue-600 mr-1" />}
                          {task.energy === "high" ? "High" : "Low"}
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketingChecklist;