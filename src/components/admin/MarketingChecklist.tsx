"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ListTodo, Zap, Coffee, Loader2, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";

interface MarketingTask {
  id: string;
  task_key: string;
  label: string;
  category: string;
  energy: "high" | "low";
  has_action: boolean;
  action_type: string | null;
  days_before: number;
  sort_order: number;
}

interface MarketingChecklistProps {
  eventId: string;
  onActionClick?: (taskId: string) => void;
}

const MarketingChecklist: React.FC<MarketingChecklistProps> = ({ eventId, onActionClick }) => {
  const { user } = useSession();
  const queryClient = useQueryClient();

  // Fetch task definitions from the database
  const { data: tasks, isLoading: loadingTasks } = useQuery<MarketingTask[]>({
    queryKey: ["marketingTasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_tasks")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as MarketingTask[];
    },
  });

  // Fetch completion status for the current event
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

  if (loadingTasks || loadingStatus) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  const totalTasks = tasks?.length || 0;
  const completedCount = completedTaskKeys?.length || 0;
  const progress = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  // Get unique categories in order
  const categories = Array.from(new Set(tasks?.map(t => t.category) || []));

  return (
    <Card className="shadow-2xl border-none overflow-hidden rounded-[3rem] bg-[#1a233a] text-white">
      <CardHeader className="p-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <CardTitle className="text-3xl font-black font-lora flex items-center gap-4">
            <ListTodo className="h-8 w-8 text-primary" /> Execution Checklist
          </CardTitle>
          <span className="text-lg font-black bg-white/10 px-5 py-2 rounded-full">
            {completedCount} / {totalTasks}
          </span>
        </div>
        <Progress value={progress} className="h-4 bg-white/10" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-white/5">
          {categories.map((category) => (
            <div key={category} className="p-10">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 mb-8">
                {category}
              </h3>
              <div className="space-y-4">
                {tasks
                  ?.filter((t) => t.category === category)
                  .map((task) => {
                    const isDone = completedTaskKeys?.includes(task.task_key);
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center justify-between p-5 rounded-2xl transition-all border-2 border-transparent group",
                          isDone ? "bg-white/5 opacity-40" : "bg-white/5 hover:border-white/10"
                        )}
                      >
                        <div 
                          className="flex items-start gap-5 flex-1 cursor-pointer"
                          onClick={() => toggleMutation.mutate(task.task_key)}
                        >
                          <div className="mt-1">
                            {isDone ? (
                              <CheckCircle2 className="h-6 w-6 text-green-400" />
                            ) : (
                              <Circle className="h-6 w-6 text-white/20 group-hover:text-white/40" />
                            )}
                          </div>
                          <span className={cn(
                            "text-lg font-bold leading-tight",
                            isDone && "line-through font-medium text-white/40"
                          )}>
                            {task.label}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {task.has_action && onActionClick && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-white/60 hover:bg-white/10 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                onActionClick(task.task_key);
                              }}
                            >
                              <Mail className="h-5 w-5" />
                            </Button>
                          )}
                          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-3 py-1 h-7 border-white/10 bg-white/5 text-white/60">
                            {task.energy === "high" ? <Zap className="h-3 w-3 text-yellow-400 mr-2" /> : <Coffee className="h-3 w-3 text-blue-400 mr-2" />}
                            {task.energy === "high" ? "High" : "Low"}
                          </Badge>
                        </div>
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