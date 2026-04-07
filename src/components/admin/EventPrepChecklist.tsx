"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ListTodo, Sparkles, Printer, Music, Megaphone, Loader2, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/integrations/supabase/auth";

interface PrepTask {
  id: string;
  label: string;
  icon: React.ElementType;
  category: "Repertoire" | "Materials" | "Marketing" | "Logistics";
}

const standardTasks: PrepTask[] = [
  { id: "choose-song", label: "Finalize Repertoire & Song Choice", icon: Music, category: "Repertoire" },
  { id: "upload-sheet", label: "Upload Sheet Music (PDF)", icon: Music, category: "Materials" },
  { id: "upload-audio", label: "Upload Practice Audio Tracks", icon: Music, category: "Materials" },
  { id: "print-lyrics", label: "Print Lyric Sheets (Extra Copies)", icon: Printer, category: "Materials" },
  { id: "print-attendance", label: "Print Attendance/RSVP List", icon: Printer, category: "Logistics" },
  { id: "advertise-fb", label: "Post in Local Facebook Groups", icon: Megaphone, category: "Marketing" },
  { id: "advertise-insta", label: "Post Instagram Story/Reel", icon: Megaphone, category: "Marketing" },
  { id: "check-venue", label: "Confirm Venue Access & Keys", icon: ListTodo, category: "Logistics" },
];

interface EventPrepChecklistProps {
  eventId: string;
}

const EventPrepChecklist: React.FC<EventPrepChecklistProps> = ({ eventId }) => {
  const { user } = useSession();
  const queryClient = useQueryClient();

  // 1. Fetch AI Action from the most recent analysis
  const { data: aiAction } = useQuery({
    queryKey: ["aiPrepAction", eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from("event_ai_summaries")
        .select("content")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.content?.next_event_action || null;
    },
  });

  // 2. Fetch Completion Status
  const { data: completedTaskIds, isLoading } = useQuery<string[]>({
    queryKey: ["eventPrepStatus", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_prep_status")
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
        .from("event_prep_status")
        .upsert({ 
          admin_id: user?.id, 
          task_id: taskId, 
          event_id: eventId,
          is_completed: !isCurrentlyCompleted 
        }, { onConflict: 'event_id,task_id' });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["eventPrepStatus", eventId] }),
  });

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  const allTasks = [...standardTasks];
  if (aiAction) {
    allTasks.unshift({ id: "ai-suggestion", label: aiAction, icon: Brain, category: "Repertoire" });
  }

  const completedCount = completedTaskIds?.length || 0;
  const progress = (completedCount / allTasks.length) * 100;

  return (
    <div className="space-y-8">
      <Card className="shadow-xl border-none overflow-hidden rounded-[2rem]">
        <CardHeader className="bg-primary text-primary-foreground pb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black font-lora flex items-center gap-2">
                <ListTodo className="h-6 w-6" /> Event Preparation
              </CardTitle>
              <CardDescription className="text-primary-foreground/70 font-medium">
                Everything you need to do before the circle gathers.
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black tracking-tighter">{Math.round(progress)}%</p>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Complete</p>
            </div>
          </div>
          <Progress value={progress} className="h-3 bg-white/20" />
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allTasks.map((task) => {
              const isDone = completedTaskIds?.includes(task.id);
              const isAi = task.id === "ai-suggestion";
              
              return (
                <div
                  key={task.id}
                  onClick={() => toggleMutation.mutate(task.id)}
                  className={cn(
                    "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer group",
                    isDone 
                      ? "bg-muted/30 border-transparent opacity-60" 
                      : isAi 
                        ? "bg-accent/5 border-accent/30 hover:border-accent shadow-lg" 
                        : "bg-card border-primary/5 hover:border-primary/20 shadow-sm"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                    isDone ? "bg-green-500 border-green-500" : "border-muted-foreground/30 group-hover:border-primary"
                  )}>
                    {isDone && <CheckCircle2 className="h-4 w-4 text-white" />}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <task.icon className={cn("h-4 w-4", isAi ? "text-accent-foreground" : "text-primary")} />
                      <span className={cn(
                        "text-sm font-bold leading-tight",
                        isDone && "line-through text-muted-foreground"
                      )}>
                        {task.label}
                      </span>
                    </div>
                    {isAi && (
                      <Badge className="bg-accent text-accent-foreground text-[8px] uppercase tracking-widest font-black px-2 py-0">
                        AI Insight
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {!aiAction && (
        <Card className="border-dashed border-2 p-8 text-center rounded-[2rem] bg-muted/20">
          <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-sm font-medium text-muted-foreground">
            Run an AI Analysis on the <a href="/admin/feedback" className="text-primary underline font-bold">Feedback Page</a> to generate a custom "Golden Action" for this event.
          </p>
        </Card>
      )}
    </div>
  );
};

export default EventPrepChecklist;