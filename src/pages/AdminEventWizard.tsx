import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Calendar as CalendarIcon, Link as LinkIcon, Plus, Trash2, ChevronRight, ChevronLeft, CheckCircle2, Sparkles, DollarSign, Tag } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import RolloverWidget from "@/components/admin/RolloverWidget";
import BackButton from "@/components/ui/BackButton";

const VENUE_TEMPLATES = [
  { id: "hall", label: "Standard Hall Hire", amount: 200, category: "Venue" },
  { id: "tech", label: "Sound Technician", amount: 150, category: "Production" },
  { id: "insurance", label: "Event Insurance", amount: 50, category: "Admin" },
  { id: "marketing", label: "Social Media Ads", amount: 100, category: "Marketing" },
];

const PHASE_1_TASKS = [
  { id: "create-humanitix", label: "Create Humanitix page" },
  { id: "pick-date", label: "Pick a date" },
  { id: "fb-event", label: "Facebook event (built-in to Humanitix)" },
  { id: "select-songs", label: "Select songs" },
  { id: "confirm-venue", label: "Contact venue to confirm date" },
];

const AdminEventWizard = () => {
  const { user } = useSession();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    date: undefined as Date | undefined,
    humanitixLink: "",
    expenses: [] as { description: string; amount: number; category: string }[],
    tasks: PHASE_1_TASKS.map(t => ({ ...t, completed: false }))
  });

  // Custom Expense Form State
  const [customExpense, setCustomExpense] = useState({
    description: "",
    amount: "",
    category: "General"
  });

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleAddCustomExpense = () => {
    if (!customExpense.description || !customExpense.amount) return;
    
    setFormData(prev => ({
      ...prev,
      expenses: [...prev.expenses, { 
        description: customExpense.description, 
        amount: parseFloat(customExpense.amount), 
        category: customExpense.category 
      }]
    }));

    setCustomExpense({ description: "", amount: "", category: "General" });
  };

  const applyTemplate = (template: typeof VENUE_TEMPLATES[0]) => {
    setCustomExpense({
      description: template.label,
      amount: template.amount.toString(),
      category: template.category
    });
  };

  const removeExpense = (index: number) => {
    setFormData(prev => ({
      ...prev,
      expenses: prev.expenses.filter((_, i) => i !== index)
    }));
  };

  const toggleTask = (id: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    }));
  };

  const handleCreateEvent = async () => {
    if (!user) return;
    setIsCreating(true);

    try {
      const { data: event, error: eventError } = await supabase
        .from("events")
        .insert({
          user_id: user.id,
          title: formData.title || "Untitled Event",
          date: formData.date ? format(formData.date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
          humanitix_link: formData.humanitixLink || null,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      if (formData.expenses.length > 0) {
        const { error: expError } = await supabase
          .from("event_expenses")
          .insert(formData.expenses.map(e => ({ ...e, event_id: event.id })));
        if (expError) throw expError;
      }

      const taskStatuses = formData.tasks.map(t => ({
        admin_id: user.id,
        event_id: event.id,
        task_id: t.id,
        is_completed: t.completed
      }));

      const { error: taskError } = await supabase
        .from("marketing_task_status")
        .insert(taskStatuses);
      
      if (taskError) throw taskError;

      showSuccess("Event created successfully!");
      navigate("/admin/marketing");
    } catch (err: any) {
      showError(err.message || "Failed to create event");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <BackButton to="/admin/marketing" className="mb-8" />
      
      <div className="space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-black font-lora">New Event Wizard</h1>
          <p className="text-muted-foreground font-medium">Quickly set up your next session.</p>
        </header>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-black uppercase tracking-widest text-muted-foreground">
            <span>Step {step} of 3</span>
            <span>{Math.round((step / 3) * 100)}% Complete</span>
          </div>
          <Progress value={(step / 3) * 100} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 1 && (
              <Card className="border-none shadow-xl rounded-[2rem]">
                <CardHeader>
                  <CardTitle className="font-lora text-2xl">Basic Details</CardTitle>
                  <CardDescription>All fields are optional for draft creation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="font-bold">Event Title</Label>
                    <Input 
                      id="title" 
                      placeholder="e.g. Resonance Session #12" 
                      value={formData.title}
                      onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Event Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-12 justify-start text-left font-normal rounded-xl",
                            !formData.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={date => setFormData(f => ({ ...f, date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="link" className="font-bold">Humanitix Link</Label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="link" 
                        placeholder="https://events.humanitix.com/..." 
                        value={formData.humanitixLink}
                        onChange={e => setFormData(f => ({ ...f, humanitixLink: e.target.value }))}
                        className="h-12 pl-10 rounded-xl"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <RolloverWidget />

                <Card className="border-none shadow-xl rounded-[2rem]">
                  <CardHeader>
                    <CardTitle className="font-lora text-2xl">Venue & Costs</CardTitle>
                    <CardDescription>Click a template to edit, or enter custom values below.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Templates Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {VENUE_TEMPLATES.map(template => (
                        <Button
                          key={template.id}
                          variant="outline"
                          className="h-auto py-4 flex flex-col items-start gap-1 rounded-xl border-primary/10 hover:border-primary/30 hover:bg-primary/5 transition-all"
                          onClick={() => applyTemplate(template)}
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{template.category}</span>
                          <span className="text-sm font-bold text-primary">{template.label}</span>
                          <span className="text-lg font-black">${template.amount}</span>
                        </Button>
                      ))}
                    </div>

                    {/* Manual Entry Form */}
                    <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Plus className="h-3 w-3" /> Add / Edit Expense
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase">Description</Label>
                          <Input 
                            placeholder="e.g. Custom Hall Hire" 
                            value={customExpense.description}
                            onChange={e => setCustomExpense(prev => ({ ...prev, description: e.target.value }))}
                            className="h-10 rounded-lg bg-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase">Amount ($)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="number"
                              placeholder="0.00" 
                              value={customExpense.amount}
                              onChange={e => setCustomExpense(prev => ({ ...prev, amount: e.target.value }))}
                              className="h-10 pl-9 rounded-lg bg-background"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1 space-y-2">
                          <Label className="text-[10px] font-bold uppercase">Category</Label>
                          <Input 
                            placeholder="e.g. Venue" 
                            value={customExpense.category}
                            onChange={e => setCustomExpense(prev => ({ ...prev, category: e.target.value }))}
                            className="h-10 rounded-lg bg-background"
                          />
                        </div>
                        <Button 
                          className="self-end h-10 px-6 font-black rounded-lg"
                          onClick={handleAddCustomExpense}
                          disabled={!customExpense.description || !customExpense.amount}
                        >
                          Add to List
                        </Button>
                      </div>
                    </div>

                    {/* Current List */}
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Current Expenses</h4>
                      {formData.expenses.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No expenses added yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {formData.expenses.map((exp, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/50">
                              <div>
                                <p className="text-sm font-bold">{exp.description}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{exp.category}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="font-bold">${exp.amount}</span>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeExpense(i)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {step === 3 && (
              <Card className="border-none shadow-xl rounded-[2rem]">
                <CardHeader>
                  <CardTitle className="font-lora text-2xl">Phase 1 Setup</CardTitle>
                  <CardDescription>Check off what you've already done.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.tasks.map(task => (
                    <div 
                      key={task.id} 
                      className={cn(
                        "flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer",
                        task.completed ? "bg-primary/5 border-primary/20" : "bg-card border-border/50 hover:border-primary/20"
                      )}
                      onClick={() => toggleTask(task.id)}
                    >
                      <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id)} />
                      <span className={cn("text-sm font-bold", task.completed && "text-primary")}>{task.label}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between pt-4">
          <Button 
            variant="ghost" 
            onClick={prevStep} 
            disabled={step === 1}
            className="font-bold"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          
          {step < 3 ? (
            <Button onClick={nextStep} className="font-black px-8 rounded-xl shadow-lg">
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleCreateEvent} 
              disabled={isCreating}
              className="font-black px-8 rounded-xl shadow-lg bg-primary hover:bg-primary/90"
            >
              {isCreating ? "Creating..." : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" /> Create Event
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminEventWizard;