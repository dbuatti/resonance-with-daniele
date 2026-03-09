"use client";

import React, { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ListTodo } from "lucide-react";

interface Task {
  id: string;
  label: string;
  category: string;
}

const tasks: Task[] = [
  { id: "personal-10", label: "Message 10 specific people who 'need' to be there", category: "Wednesday" },
  { id: "email-november", label: "Email the 'November Crew' with a personal note", category: "Wednesday" },
  { id: "insta-story-why", label: "Story: 30s video on why you chose these 2 songs", category: "Wednesday" },
  { id: "sangha-outreach", label: "Reach out to your Sangha community", category: "Thursday" },
  { id: "insta-story-chords", label: "Story: Play 'Being Alive' chords & explain the vibe", category: "Thursday" },
  { id: "helper-outreach", label: "Direct message 3 potential 'Helpers' personally", category: "Thursday" },
  { id: "fb-groups-invite", label: "Post a warm invitation in community groups", category: "Friday" },
  { id: "insta-story-final", label: "Story: Final personal invitation (no hype, just heart)", category: "Friday" },
  { id: "print-lyrics", label: "Print extra lyric sheets/scores", category: "Day Of" },
  { id: "inhabit-room", label: "Focus on inhabiting the room (not capturing it)", category: "Day Of" },
];

const MarketingChecklist: React.FC = () => {
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("march14_marketing_progress");
    if (saved) {
      setCompletedTasks(JSON.parse(saved));
    }
  }, []);

  // Save progress to localStorage
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
            {completedTasks.length} / {tasks.length} Done
          </span>
        </div>
        <Progress value={progress} className="h-2 bg-white/20" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {["Wednesday", "Thursday", "Friday", "Day Of"].map((category) => (
            <div key={category} className="p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                {category}
              </h3>
              <div className="space-y-4">
                {tasks
                  .filter((t) => t.category === category)
                  .map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer hover:bg-muted/50",
                        completedTasks.includes(task.id) && "opacity-60"
                      )}
                      onClick={() => toggleTask(task.id)}
                    >
                      <div className="mt-0.5">
                        {completedTasks.includes(task.id) ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <span className={cn(
                        "text-sm font-medium leading-tight",
                        completedTasks.includes(task.id) && "line-through"
                      )}>
                        {task.label}
                      </span>
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