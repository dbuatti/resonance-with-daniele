"use client";

import React, { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ListTodo, Zap, Coffee, Loader2, Mail, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { format, subDays, parseISO, isToday, isPast, startOfDay } from "date-fns";

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
  eventDate?: string; // New prop
  onActionClick?: (taskId: string) => void;
}

const MarketingChecklist: React.FC<MarketingChecklistProps> = ({ eventId, eventDate, onActionClick }) => {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const { data: tasks, isLoading: loadingTasks } = useQuery<MarketingTask[]>({
    queryKey: ["marketingTasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_tasks")
        .select("*")
        .order("days_before", { ascending: false }) // Order by timeline
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as MarketingTask[];
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

  // Group tasks by their calculated date
  const groupedTasks = useMemo(() => {
    if (!tasks || !eventDate) return {};
    
    const groups: Record<string, MarketingTask[]> = {};
    const baseDate = parseISO(eventDate);

    tasks.forEach(task => {
      const targetDate = subDays(baseDate, task.days_before);
      const dateKey = format(targetDate, "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(task);
    });

    return groups;
  }, [tasks, eventDate]);

  const sortedDateKeys = useMemo(() => {
    return Object.keys(groupedTasks).sort();
  }, [groupedTasks]);

  if (loadingTasks || loadingStatus) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>;

  const totalTasks = tasks?.length || 0;
  const completedCount = completedTaskKeys?.length || 0;
  const progress = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  return (
    <Card className="shadow-sm border border-border/50 overflow-hidden rounded-2xl bg-card">
      <CardHeader className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            Marketing Timeline
          </CardTitle>
          <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
            {completedCount} / {totalTasks} Tasks
          </span>
        </div>
        <Progress value={progress} className="h-2 bg-muted" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {sortedDateKeys.map((dateKey) => {
            const date = parseISO(dateKey);
            const isTodayDate = isToday(date);
            const isPastDate = isPast(date) && !isTodayDate;
            
            return (
              <div key={dateKey} className={cn("p-6", isTodayDate && "bg-primary/5")}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className={cn("h-3.5 w-3.5", isTodayDate ? "text-primary" : "text-muted-foreground")} />
                    <h3 className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      isTodayDate ? "text-primary" : "text-muted-foreground/60"
                    )}>
                      {format(date, "EEEE, MMM do")} 
                      {isTodayDate && " — TODAY"}
                      {isPastDate && " — OVERDUE"}
                    </h3>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {groupedTasks[dateKey].map((task) => {
                    const isDone = completedTaskKeys?.includes(task.task_key);
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl transition-all border border-transparent group",
                          isDone ? "bg-muted/30 opacity-60" : "hover:bg-muted/50"
                        )}
                      >
                        <div 
                          className="flex items-center gap-4 flex-1 cursor-pointer"
                          onClick={() => toggleMutation.mutate(task.task_key)}
                        >
                          <div>
                            {isDone ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground/30 group-hover:text-muted-foreground/50" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className={cn(
                              "text-sm font-bold leading-tight",
                              isDone && "line-through text-muted-foreground"
                            )}>
                              {task.label}
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                              {task.category}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {task.has_action && onActionClick && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                onActionClick(task.task_key);
                              }}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0 h-6 border-border/50 bg-muted/20 text-muted-foreground">
                            {task.energy === "high" ? <Zap className="h-3 w-3 text-yellow-500 mr-1" /> : <Coffee className="h-3 w-3 text-blue-500 mr-1" />}
                            {task.energy}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketingChecklist;