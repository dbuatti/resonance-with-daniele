"use client";

import React, { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ListTodo, Zap, Coffee } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: string;
  label: string;
  category: string;
  energy: "high" | "low";
}

const tasks: Task[] = [
  { id: "personal-10", label: "Message 10 specific people personally", category: "Wednesday", energy: "high" },
  { id: "email-november", label: "Email the 'November Crew'", category: "Wednesday", energy: "low" },
  { id: "insta-story-why", label: "Story: 30s video on why these songs", category: "Wednesday", energy: "high" },
  { id: "sangha-outreach", label: "Reach out to Sangha community", category: "Thursday", energy: "high" },
  { id: "insta-story-chords", label: "Story: Play 'Being Alive' chords", category: "Thursday", energy: "low" },
  { id: "helper-outreach", label: "DM 3 potential 'Helpers' personally", category: "Thursday", energy: "high" },
  { id: "fb-groups-invite", label: "Post in community groups", category: "Friday", energy: "low" },
  { id: "insta-story-final", label: "Story: Final personal invitation", category: "Friday", energy: "high" },
  { id: "print-lyrics", label: "Print extra lyric sheets/scores", category: "Day Of", energy: "low" },
  { id: "inhabit-room", label: "Focus on inhabiting the room", category: "Day Of", energy: "high" },
];

const MarketingChecklist: React.FC = () => {
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("march14_marketing_progress");
    if (saved) setCompletedTasks(JSON.parse(saved));
  }, []);

  const toggleTask = (id: string) => {
    const newCompleted = completedTasks.includes(id)
      ? completedTasks.filter((t) => t !== id)
      : [...completedTasks, id];
    setCompletedTasks(newCompleted);
    localStorage.setItem("march14_marketing_progress", JSON.stringify(newCompleted));
  };

  const progress = (completedTasks.length / tasks.length) * 100;

  return (
    <Card className="shadow-xl border-none overflow-hidden">
      <CardHeader className="bg-primary text-primary-foreground pb-6">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-6 w-6" /> Execution Checklist
          </CardTitle>
          <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">
            {completedTasks.length} / {tasks.length}
          </span>
        </div>
        <Progress value={progress} className="h-2 bg-white/20" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {["Wednesday", "Thursday", "Friday", "Day Of"].map((category) => (
            <div key={category} className="p-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
                {category}
              </h3>
              <div className="space-y-3">
                {tasks
                  .filter((t) => t.category === category)
                  .map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border border-transparent",
                        completedTasks.includes(task.id) ? "bg-muted/30 opacity-50" : "bg-background shadow-sm hover:border-primary/20"
                      )}
                      onClick={() => toggleTask(task.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {completedTasks.includes(task.id) ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <span className={cn(
                          "text-sm font-bold leading-tight",
                          completedTasks.includes(task.id) && "line-through font-normal"
                        )}>
                          {task.label}
                        </span>
                      </div>
                      <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 h-5 border-none bg-muted/50">
                        {task.energy === "high" ? <Zap className="h-3 w-3 text-yellow-600 mr-1" /> : <Coffee className="h-3 w-3 text-blue-600 mr-1" />}
                        {task.energy === "high" ? "High" : "Low"}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketingChecklist;