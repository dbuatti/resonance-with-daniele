"use client";

import React, { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ListTodo, Zap, Coffee, Loader2, Mail, Calendar, Facebook, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { format, subDays, parseISO, isToday, isPast, startOfDay } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

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
  url?: string | null;
}

interface MarketingChecklistProps {
  eventId: string;
  eventDate?: string;
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
        .order("days_before", { ascending: false })
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

  const sortedDateKeys = useMemo(() => Object.keys(groupedTasks).sort(), [groupedTasks]);

  if (loadingTasks || loadingStatus) return <div className="p-4 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto text-primary" /></div>;

  const totalTasks = tasks?.length || 0;
  const completedCount = completedTaskKeys?.length || 0;
  const progress = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  return (
    <Card className="shadow-sm border border-border/50 overflow-hidden rounded-2xl bg-card">
      <CardHeader className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-base font-bold">Marketing Timeline</CardTitle>
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            {completedCount}/{totalTasks}
          </span>
        </div>
        <Progress value={progress} className="h-1.5 bg-muted" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {sortedDateKeys.map((dateKey) => {
            const date = parseISO(dateKey);
            const isTodayDate = isToday(date);
            const isPastDate = isPast(date) && !isTodayDate;
            
            return (
              <div key={dateKey} className={cn("p-4", isTodayDate && "bg-primary/5")}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className={cn("h-3 w-3", isTodayDate ? "text-primary" : "text-muted-foreground")} />
                  <h3 className={cn(
                    "text-[9px] font-black uppercase tracking-widest",
                    isTodayDate ? "text-primary" : "text-muted-foreground/60"
                  )}>
                    {format(date, "EEE, MMM do")} 
                    {isTodayDate && " — TODAY"}
                    {isPastDate && " — OVERDUE"}
                  </h3>
                </div>
                
                <div className="space-y-1">
                  {groupedTasks[dateKey].map((task) => {
                    const isDone = completedTaskKeys?.includes(task.task_key);
                    const isFbGroup = task.category === "Facebook Groups";
                    const fbLink = task.url;

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg transition-all border border-transparent group",
                          isDone ? "bg-muted/20 opacity-60" : "hover:bg-muted/40"
                        )}
                      >
                        <div 
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                          onClick={() => toggleMutation.mutate(task.task_key)}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground/20 group-hover:text-muted-foreground/40" />
                          )}
                          <div className="flex items-center gap-2">
                            {isFbGroup && <Facebook className="h-3.5 w-3.5 text-[#1877F2] shrink-0" />}
                            <span className={cn(
                              "text-xs font-bold leading-tight",
                              isDone && "line-through text-muted-foreground"
                            )}>
                              {task.label}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isFbGroup && fbLink && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-primary hover:bg-primary/10"
                                    asChild
                                  >
                                    <a href={fbLink} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Open Facebook Group</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {task.has_action && onActionClick && !isFbGroup && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                onActionClick(task.task_key);
                              }}
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0 h-5 border-border/50 bg-muted/10 text-muted-foreground">
                            {task.energy === "high" ? <Zap className="h-2.5 w-2.5 text-yellow-500 mr-1" /> : <Coffee className="h-2.5 w-2.5 text-blue-500 mr-1" />}
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