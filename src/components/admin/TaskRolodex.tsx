"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/integrations/supabase/auth";
import { 
  CheckCircle2, 
  Circle, 
  Zap, 
  Coffee, 
  Loader2, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  Target,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays, parseISO, isToday, isPast, startOfDay, addDays, isSameDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

interface TaskInstance {
  id: string; // eventId + taskKey
  taskKey: string;
  eventId: string;
  eventTitle: string;
  label: string;
  date: Date;
  energy: "high" | "low";
  isCompleted: boolean;
}

const TaskRolodex: React.FC = () => {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Fetch events (last 7 days to next 60 days)
  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ["rolodexEvents"],
    queryFn: async () => {
      const startDate = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const endDate = format(addDays(new Date(), 60), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("events")
        .select("id, title, date")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch task definitions
  const { data: taskDefinitions, isLoading: loadingTasks } = useQuery<MarketingTask[]>({
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

  // Fetch all completion statuses for these events
  const { data: completionStatuses, isLoading: loadingStatus } = useQuery({
    queryKey: ["rolodexTaskStatus"],
    queryFn: async () => {
      if (!events?.length) return [];
      const eventIds = events.map(e => e.id);
      const { data, error } = await supabase
        .from("marketing_task_status")
        .select("task_id, event_id, is_completed")
        .in("event_id", eventIds)
        .eq("is_completed", true);
      if (error) throw error;
      return data;
    },
    enabled: !!events?.length,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ taskKey, eventId, isCompleted }: { taskKey: string, eventId: string, isCompleted: boolean }) => {
      const { error } = await supabase
        .from("marketing_task_status")
        .upsert({ 
          admin_id: user?.id, 
          task_id: taskKey, 
          event_id: eventId,
          is_completed: !isCompleted 
        }, { onConflict: 'admin_id,task_id,event_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rolodexTaskStatus"] });
      queryClient.invalidateQueries({ queryKey: ["marketingTaskStatus"] });
    },
  });

  const taskInstances = useMemo(() => {
    if (!events || !taskDefinitions) return [];
    
    const instances: TaskInstance[] = [];
    
    events.forEach(event => {
      const eventDate = parseISO(event.date);
      taskDefinitions.forEach(task => {
        const taskDate = subDays(eventDate, task.days_before);
        const isCompleted = completionStatuses?.some(s => s.task_id === task.task_key && s.event_id === event.id) || false;
        
        instances.push({
          id: `${event.id}-${task.task_key}`,
          taskKey: task.task_key,
          eventId: event.id,
          eventTitle: event.title,
          label: task.label,
          date: taskDate,
          energy: task.energy,
          isCompleted
        });
      });
    });

    // Sort by date, then by event date (if same task date), then by sort order
    return instances.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, taskDefinitions, completionStatuses]);

  // Find the index of the first task that is today or in the future
  const todayIndex = useMemo(() => {
    const now = startOfDay(new Date());
    const index = taskInstances.findIndex(t => t.date >= now);
    return index === -1 ? taskInstances.length - 1 : index;
  }, [taskInstances]);

  useEffect(() => {
    if (containerRef.current && todayIndex !== -1) {
      const element = containerRef.current.children[todayIndex] as HTMLElement;
      if (element) {
        containerRef.current.scrollTo({
          top: element.offsetTop - containerRef.current.offsetHeight / 2 + element.offsetHeight / 2,
          behavior: "smooth"
        });
        setActiveIndex(todayIndex);
      }
    }
  }, [todayIndex, taskInstances.length]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const center = container.scrollTop + container.offsetHeight / 2;
    
    let closestIndex = 0;
    let minDistance = Infinity;

    Array.from(container.children).forEach((child, index) => {
      const element = child as HTMLElement;
      const elementCenter = element.offsetTop + element.offsetHeight / 2;
      const distance = Math.abs(center - elementCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  };

  if (loadingEvents || loadingTasks || loadingStatus) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-muted/5 rounded-3xl border border-dashed border-border/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    );
  }

  if (taskInstances.length === 0) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center bg-muted/5 rounded-3xl border border-dashed border-border/50 text-center p-8">
        <Calendar className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <p className="text-muted-foreground font-medium">No upcoming tasks found.</p>
        <p className="text-xs text-muted-foreground/60 mt-2">Create an event to see the Rolodex in action.</p>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Decorative Barrel Frame */}
      <div className="absolute inset-0 pointer-events-none z-10 rounded-3xl border-[8px] border-background shadow-[inset_0_0_40px_rgba(0,0,0,0.1)]" />
      
      {/* Gradient Overlays for Barrel Effect */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background via-background/80 to-transparent z-20 pointer-events-none rounded-t-3xl" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent z-20 pointer-events-none rounded-b-3xl" />

      {/* Today Indicator */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-24 border-y border-primary/20 bg-primary/5 z-0 pointer-events-none flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Focus</span>
        </div>
        <Target className="h-4 w-4 text-primary/30" />
      </div>

      {/* The Barrel */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-[500px] overflow-y-auto no-scrollbar snap-y snap-mandatory py-[200px] px-8 space-y-4 perspective-[1000px]"
      >
        {taskInstances.map((task, index) => {
          const isTodayTask = isToday(task.date);
          const isPastTask = isPast(task.date) && !isTodayTask;
          const isActive = activeIndex === index;
          
          return (
            <motion.div
              key={task.id}
              snap-align="center"
              className="snap-center"
              initial={false}
              animate={{
                scale: isActive ? 1 : 0.9,
                opacity: isActive ? 1 : 0.4,
                rotateX: isActive ? 0 : (index < activeIndex ? 25 : -25),
                y: isActive ? 0 : (index < activeIndex ? 10 : -10)
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Card 
                className={cn(
                  "relative overflow-hidden transition-all duration-500 border-none shadow-none bg-transparent",
                  isActive ? "scale-105" : ""
                )}
              >
                <CardContent className="p-0">
                  <div 
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer",
                      isActive ? "bg-card shadow-xl border border-border/50" : "bg-muted/10 grayscale opacity-50",
                      task.isCompleted && "opacity-40"
                    )}
                    onClick={() => toggleMutation.mutate({ 
                      taskKey: task.taskKey, 
                      eventId: task.eventId, 
                      isCompleted: task.isCompleted 
                    })}
                  >
                    <div className="shrink-0">
                      {task.isCompleted ? (
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <Circle className="h-6 w-6 text-primary/20" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest",
                          isTodayTask ? "text-primary" : "text-muted-foreground/60"
                        )}>
                          {format(task.date, "EEE, MMM do")}
                          {isTodayTask && " • TODAY"}
                        </span>
                        <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                        <span className="text-[9px] font-bold text-muted-foreground/40 truncate max-w-[100px]">
                          {task.eventTitle}
                        </span>
                      </div>
                      <h3 className={cn(
                        "text-sm font-black font-lora leading-tight truncate",
                        task.isCompleted && "line-through text-muted-foreground"
                      )}>
                        {task.label}
                      </h3>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0 h-5 border-border/50 bg-muted/10 text-muted-foreground">
                        {task.energy === "high" ? <Zap className="h-2.5 w-2.5 text-yellow-500 mr-1" /> : <Coffee className="h-2.5 w-2.5 text-blue-500 mr-1" />}
                        {task.energy}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-30">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm border-border/50"
          onClick={() => {
            if (containerRef.current) {
              containerRef.current.scrollBy({ top: -100, behavior: "smooth" });
            }
          }}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm border-border/50"
          onClick={() => {
            if (containerRef.current) {
              containerRef.current.scrollBy({ top: 100, behavior: "smooth" });
            }
          }}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Jump to Today Button */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
        <Button 
          variant="secondary" 
          size="sm" 
          className="rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg border border-primary/10 px-6"
          onClick={() => {
            if (containerRef.current && todayIndex !== -1) {
              const element = containerRef.current.children[todayIndex] as HTMLElement;
              if (element) {
                containerRef.current.scrollTo({
                  top: element.offsetTop - containerRef.current.offsetHeight / 2 + element.offsetHeight / 2,
                  behavior: "smooth"
                });
              }
            }
          }}
        >
          <Sparkles className="h-3 w-3 mr-2 text-primary" />
          Jump to Today
        </Button>
      </div>
    </div>
  );
};

export default TaskRolodex;