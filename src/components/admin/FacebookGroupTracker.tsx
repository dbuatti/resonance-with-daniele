"use client";

import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Loader2, Facebook, ExternalLink, Copy, Link as LinkIcon, Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface FacebookGroupTrackerProps {
  eventId: string;
  postText: string;
}

const FacebookGroupTracker: React.FC<FacebookGroupTrackerProps> = ({ eventId, postText }) => {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");

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

  const addMutation = useMutation({
    mutationFn: async () => {
      const taskKey = `fb-${newName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      const { error } = await supabase.from("marketing_tasks").insert({
        task_key: taskKey,
        label: newName,
        url: newUrl,
        category: "Facebook Groups",
        energy: "low",
        days_before: 7,
        sort_order: (tasks?.length || 0) + 1
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facebookTasks"] });
      setNewName("");
      setNewUrl("");
      setIsAdding(false);
      showSuccess("Facebook group added!");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketing_tasks")
        .update({ label: editName, url: editUrl })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facebookTasks"] });
      setEditingId(null);
      showSuccess("Group updated!");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketing_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facebookTasks"] });
      showSuccess("Group removed.");
    }
  });

  const handleCopyPost = () => {
    navigator.clipboard.writeText(postText);
    showSuccess("Post content copied!");
  };

  const startEditing = (task: any) => {
    setEditingId(task.id);
    setEditName(task.label);
    setEditUrl(task.url || "");
  };

  if (loadingTasks || loadingStatus) return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          Target Groups ({tasks?.length || 0})
        </p>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsAdding(!isAdding)}
          className="h-7 px-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5"
        >
          {isAdding ? <X className="mr-1 h-3 w-3" /> : <Plus className="mr-1 h-3 w-3" />}
          {isAdding ? "Cancel" : "Add Group"}
        </Button>
      </div>

      {isAdding && (
        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-3 animate-in fade-in slide-in-from-top-2">
          <Input 
            placeholder="Group Name (e.g. Armadale Community)" 
            value={newName} 
            onChange={e => setNewName(e.target.value)}
            className="h-9 text-sm font-bold"
          />
          <Input 
            placeholder="Facebook URL" 
            value={newUrl} 
            onChange={e => setNewUrl(e.target.value)}
            className="h-9 text-sm"
          />
          <Button 
            className="w-full h-9 font-black text-xs uppercase tracking-widest" 
            onClick={() => addMutation.mutate()}
            disabled={!newName || !newUrl || addMutation.isPending}
          >
            {addMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save New Group"}
          </Button>
        </div>
      )}

      <div className="space-y-1.5">
        {tasks?.map((task) => {
          const isDone = completedTaskKeys?.includes(task.task_key);
          const isEditing = editingId === task.id;

          return (
            <div
              key={task.id}
              className={cn(
                "flex flex-col p-2.5 rounded-xl border transition-all group",
                isDone 
                  ? "bg-green-500/5 border-green-500/10 opacity-60" 
                  : "bg-card border-primary/5 shadow-sm hover:border-primary/20"
              )}
            >
              {isEditing ? (
                <div className="space-y-2">
                  <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 text-xs font-bold" />
                  <Input value={editUrl} onChange={e => setEditUrl(e.target.value)} className="h-8 text-xs" />
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 flex-1 text-[10px] font-black" onClick={() => updateMutation.mutate(task.id)}>
                      <Save className="mr-1 h-3 w-3" /> SAVE
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 flex-1 text-[10px] font-black" onClick={() => setEditingId(null)}>
                      CANCEL
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={isDone}
                      onCheckedChange={() => toggleMutation.mutate(task.task_key)}
                      className="h-4 w-4 rounded border-2"
                    />
                    <span className={cn(
                      "text-sm font-bold font-lora",
                      isDone && "line-through text-muted-foreground"
                    )}>
                      {task.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={handleCopyPost}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy Post</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {task.url && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10" asChild>
                              <a href={task.url} target="_blank" rel="noopener noreferrer">
                                <LinkIcon className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Open Group</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1 border-l pl-1 border-border">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => startEditing(task)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => deleteMutation.mutate(task.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FacebookGroupTracker;