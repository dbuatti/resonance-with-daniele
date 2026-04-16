"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Instagram, 
  Mail, 
  Mic2, 
  Target, 
  Copy, 
  Clock,
  UserPlus,
  MapPin,
  Sparkles,
  BookOpen,
  Music,
  StickyNote,
  AlertCircle,
  Calendar as CalendarIcon,
  ExternalLink,
  TrendingUp,
  LayoutDashboard,
  FileText,
  AlertTriangle,
  Share2,
  Zap,
  Globe,
  Users,
  ChevronRight,
  Calendar,
  Ticket,
  Moon,
  Sun
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import BackButton from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "react-router-dom";
import { useSession } from "@/integrations/supabase/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import CopyToClipboard from "@/components/CopyToClipboard";

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

const MarketingPlan1: React.FC = () => {
  const location = useLocation();
  const { user, profile, loading: loadingSession } = useSession();
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("Social Media");
  const [newTaskEnergy, setNewTaskEnergy] = useState<"high" | "low">("high");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 300);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Fetch events
  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ["marketingPlan1Events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch marketing tasks
  const { data: taskDefinitions, isLoading: loadingTasks } = useQuery<MarketingTask[]>({
    queryKey: ["marketingPlan1TaskDefinitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_tasks")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as MarketingTask[];
    },
  });

  // Fetch event-specific task status
  const { data: completedTaskKeys, isLoading: loadingStatus } = useQuery<string[]>({
    queryKey: ["marketingPlan1TaskStatus", selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return [];
      const { data, error } = await supabase
        .from("marketing_task_status")
        .select("task_id")
        .eq("event_id", selectedEventId)
        .eq("is_completed", true);
      if (error) throw error;
      return data.map(d => d.task_id);
    },
    enabled: !!selectedEventId,
  });

  // Fetch event details
  const { data: selectedEvent, isLoading: loadingEventDetails } = useQuery({
    queryKey: ["marketingPlan1EventDetails", selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return null;
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", selectedEventId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedEventId,
  });

  // Fetch event-specific outreach targets
  const { data: eventTargets } = useQuery({
    queryKey: ["marketingPlan1OutreachTargets", selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return [];
      const { data, error } = await supabase
        .from("outreach_targets")
        .select("*")
        .eq("event_id", selectedEventId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedEventId,
  });

  // Fetch event-specific resources
  const { data: eventResources } = useQuery({
    queryKey: ["marketingPlan1Resources", selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return [];
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("is_published", true)
        .eq("folder_id", selectedEventId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedEventId,
  });

  const toggleTask = useMutation({
    mutationFn: async (taskKey: string) => {
      const isCurrentlyCompleted = completedTaskKeys?.includes(taskKey);
      if (!selectedEventId) return;
      const { error } = await supabase
        .from("marketing_task_status")
        .upsert({ 
          admin_id: user?.id, 
          task_id: taskKey, 
          event_id: selectedEventId,
          is_completed: !isCurrentlyCompleted 
        }, { onConflict: 'admin_id,task_id,event_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketingPlan1TaskStatus", selectedEventId] });
      showSuccess("Task status updated!");
    },
  });

  const addTask = useMutation({
    mutationFn: async (label: string) => {
      if (!selectedEventId || !user) return;
      const { error } = await supabase
        .from("marketing_tasks")
        .insert({
          admin_id: user.id,
          event_id: selectedEventId,
          label,
          category: newTaskCategory,
          energy: newTaskEnergy,
          has_action: true,
          action_type: "email",
          days_before: 1,
          sort_order: 0,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketingPlan1TaskDefinitions"] });
      setNewTaskLabel("");
      showSuccess("Task added!");
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskKey: string) => {
      if (!selectedEventId) return;
      const { error } = await supabase
        .from("marketing_task_status")
        .delete()
        .eq("event_id", selectedEventId)
        .eq("task_id", taskKey);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketingPlan1TaskStatus", selectedEventId] });
      showSuccess("Task removed!");
    },
  });

  const handleGeneratePlan = async () => {
    if (!selectedEvent) return;
    setIsGenerating(true);
    try {
      const prompt = `Generate a comprehensive marketing plan for event "${selectedEvent.title}" on ${selectedEvent.date} at ${selectedEvent.location || "TBA"}. Include: 1) Social media posts for Instagram and Facebook, 2) Email templates for member outreach, 3) A timeline of tasks with deadlines leading up to the event, 4) Key hashtags and engagement strategies. Focus on community building and making the event feel welcoming.`;
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1500,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate plan");
      
      const data = await response.json();
      showSuccess("Marketing plan generated!");
    } catch (error: any) {
      console.error("Generation error:", error);
      showError("Failed to generate plan: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredTasks = taskDefinitions?.filter(task =>
    task.label.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    task.category.toLowerCase().includes(debouncedSearch.toLowerCase())
  ) || [];

  const eventDate = selectedEvent ? new Date(selectedEvent.date) : new Date();
  const eventDateFormatted = selectedEvent ? new Date(selectedEvent.date).toLocaleDateString() : "Select an event";

  if (loadingEvents || loadingTasks) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-12 w-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen py-8 md:py-12 transition-colors duration-300",
      isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
    )}>
      <BackButton to="/admin" />
      
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold mb-4">
            <LayoutDashboard className="h-4 w-4" />
            <span className="text-sm uppercase tracking-widest">Marketing Plan v2</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black font-lora tracking-tighter mb-4">
            Marketing Plan Studio
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            Create, manage, and execute your event marketing strategy with AI assistance.
          </p>
        </header>

        {/* Event Selection */}
        <Card className="mb-8 shadow-xl border-none rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Select Event</label>
                <Select 
                  value={selectedEventId || ""} 
                  onValueChange={setSelectedEventId}
                  disabled={loadingEvents}
                >
                  <SelectTrigger className="h-14 rounded-xl shadow-sm font-bold">
                    <SelectValue placeholder="Choose an event to plan..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {events?.map((event) => (
                      <SelectItem key={event.id} value={event.id} className="font-bold">
                        <div className="flex items-center gap-3">
                          <CalendarIcon className="h-5 w-5 text-primary" />
                          <div>
                            <div className="text-base">{event.title}</div>
                            <div className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedEventId && (
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-xl" 
                    onClick={() => setIsEditMode(!isEditMode)}
                    title={isEditMode ? "Disable Edit Mode" : "Enable Edit Mode"}
                  >
                    <Edit className={cn("h-5 w-5 transition-transform", isEditMode && "rotate-90 scale-110")} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-xl" 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  >
                    {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {!selectedEventId ? (
          <Card className="p-24 text-center border-dashed border-4 rounded-[5rem] bg-muted/10">
            <CalendarIcon className="h-24 w-24 text-muted-foreground mx-auto mb-6 opacity-30" />
            <p className="text-3xl font-bold text-muted-foreground font-lora">Select an event to begin planning.</p>
          </Card>
        ) : (
          <>
            {/* Event Overview */}
            <Card className="mb-8 shadow-xl border-none rounded-[2.5rem] overflow-hidden animate-fade-in-up">
              <CardContent className="p-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center md:text-left space-y-2">
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Event</h3>
                    <h2 className="text-3xl font-black font-lora">{selectedEvent?.title}</h2>
                    <p className="text-lg text-muted-foreground">{selectedEvent?.description}</p>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-black text-primary">{eventDateFormatted}</div>
                      <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Date</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black text-primary">{eventTargetCount} Targets</div>
                      <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Outreach</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black text-primary">{eventResourceCount} Resources</div>
                      <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Assets</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Generated Plan Section */}
            <Card className="mb-8 shadow-xl border-none rounded-[2.5rem] overflow-hidden animate-fade-in-up">
              <CardHeader className="bg-primary/5 pb-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <CardTitle className="text-2xl font-black font-lora">AI Generated Plan</CardTitle>
                </div>
                <CardDescription className="text-base font-medium text-muted-foreground">
                  Let our AI assistant create a comprehensive strategy for your event.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="bg-muted/30 p-6 rounded-2xl border-2 border-dashed border-primary/10 text-center">
                  <Button 
                    size="lg" 
                    className="h-16 px-12 text-xl font-black rounded-2xl shadow-lg"
                    onClick={handleGeneratePlan}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-5 w-5" />
                        Generate Marketing Plan
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Task Management */}
            <Card className="shadow-xl border-none rounded-[2.5rem] overflow-hidden animate-fade-in-up">
              <CardHeader className="bg-muted/30 pb-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-black font-lora flex items-center gap-3">
                      <ListTodo className="h-7 w-7 text-primary" />
                      Task Management
                    </CardTitle>
                    <CardDescription className="text-base font-medium text-muted-foreground">
                      Track and manage all marketing tasks for this event.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground">
                      {completedTaskKeys?.length || 0}/{taskDefinitions?.length || 0} Completed
                    </span>
                    <Progress 
                      value={taskDefinitions ? (completedTaskKeys?.length || 0) / taskDefinitions.length * 100 : 0} 
                      className="h-3 w-36" 
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {/* Add Task Form */}
                <div className="mb-8 p-6 bg-muted/20 rounded-2xl border border-border/50">
                  <h4 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Add New Task</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                      placeholder="Task label..."
                      value={newTaskLabel}
                      onChange={(e) => setNewTaskLabel(e.target.value)}
                      disabled={!selectedEventId}
                      className="h-14 rounded-xl font-bold text-lg"
                    />
                    <Select 
                      value={newTaskCategory} 
                      onValueChange={setNewTaskCategory}
                      disabled={!selectedEventId}
                    >
                      <SelectTrigger className="h-14 rounded-xl font-bold">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Social Media">Social Media</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="Content">Content Creation</SelectItem>
                        <SelectItem value="Outreach">Outreach</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select 
                      value={newTaskEnergy} 
                      onValueChange={(v) => setNewTaskEnergy(v as "high" | "low")}
                      disabled={!selectedEventId}
                    >
                      <SelectTrigger className="h-14 rounded-xl font-bold">
                        <SelectValue placeholder="Energy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      size="lg" 
                      className="h-14 rounded-xl font-black" 
                      onClick={() => addTask.mutate(newTaskLabel)}
                      disabled={!newTaskLabel || !selectedEventId}
                    >
                      Add Task
                    </Button>
                  </div>
                </div>

                {/* Task List */}
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {filteredTasks?.map((task) => {
                    const isDone = completedTaskKeys?.includes(task.task_key);
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                          isDone 
                            ? "bg-green-500/10 border-green-500/30 opacity-60" 
                            : "bg-muted/30 border-border/50 hover:border-primary/30 hover:shadow-sm"
                        )}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div 
                            className={cn(
                              "p-3 rounded-xl cursor-pointer transition-transform",
                              isDone ? "bg-green-500/20" : "bg-background hover:bg-primary/5"
                            )}
                            onClick={() => toggleTask.mutate(task.task_key)}
                          >
                            {isDone ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <span className={cn("text-lg font-bold", isDone && "line-through text-muted-foreground")}>
                              {task.label}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[10px] font-black uppercase px-2 py-0.5 border-0",
                                task.energy === "high" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                              )}
                            >
                              {task.energy === "high" ? "High Energy" : "Low Energy"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.has_action && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary"
                                    onClick={() => onActionClick?.(task.task_key)}
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Send Email</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive"
                            onClick={() => deleteTask.mutate(task.task_key)}
                            disabled={isDone}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {filteredTasks?.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      {debouncedSearch ? "No tasks found" : "No tasks yet. Add your first task above."}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default MarketingPlan1;