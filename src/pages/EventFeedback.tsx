"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/auth";
import { showSuccess, showError } from "@/utils/toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, MapPin, Music, Sparkles, EyeOff, UserPlus, Search, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSaturday, isSunday, parseISO } from "date-fns";
import BackButton from "@/components/ui/BackButton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const feedbackSchema = z.object({
  event_id: z.string().min(1, "Please select which event you attended"),
  overall_feeling: z.string().min(1, "Please select how the session felt"),
  is_first_time: z.boolean().default(false),
  how_heard: z.string().min(1, "Please let us know how you heard about us"),
  venue_feedback: z.string().min(1, "Please tell us about the venue"),
  repertoire_feedback: z.string().min(1, "Please tell us about the repertoire"),
  enjoyed_most: z.string().min(1, "Please tell us what you enjoyed"),
  improvements: z.string().optional(),
  time_slot_rating: z.string().min(1, "Please rate the time slot"),
  future_ideas: z.string().optional(),
  price_point: z.string().min(1, "Please select a price point"),
  interest_next_month: z.array(z.string()).optional(),
  best_times_ongoing: z.array(z.string()).optional(),
  regular_attendance_interest: z.string().min(1, "Please select your interest level"),
  attendance_frequency: z.string().min(1, "Please select a frequency"),
  recommend_score: z.string().min(1, "Please provide a score"),
  additional_comments: z.string().optional(),
  is_anonymous: z.boolean().default(false),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

const EventFeedback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlEventId = searchParams.get("eventId");
  const { user, loading: loadingSession } = useSession();
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: pastEvents, isLoading: loadingEvents } = useQuery({
    queryKey: ["pastEventsForFeedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, date")
        .order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      event_id: urlEventId || "",
      interest_next_month: [],
      best_times_ongoing: [],
      is_anonymous: false,
      is_first_time: false,
    },
  });

  useEffect(() => {
    if (urlEventId) {
      form.setValue("event_id", urlEventId);
    }
  }, [urlEventId, form]);

  const selectedEventId = form.watch("event_id");
  const selectedEvent = useMemo(() => 
    pastEvents?.find(e => e.id === selectedEventId),
    [pastEvents, selectedEventId]
  );

  const nextMonthData = useMemo(() => {
    if (!selectedEvent?.date) return { monthName: "Next Month", dates: [] };
    const eventDate = new Date(selectedEvent.date);
    const nextMonth = addMonths(eventDate, 1);
    const monthName = format(nextMonth, "MMMM");
    const start = startOfMonth(nextMonth);
    const end = endOfMonth(start);
    const allDays = eachDayOfInterval({ start, end });
    const weekends = allDays
      .filter(day => isSaturday(day) || isSunday(day))
      .map(day => format(day, "EEEE MMMM do"));
    return { monthName, dates: weekends };
  }, [selectedEvent?.date]);

  const onSubmit = async (data: FeedbackFormData) => {
    try {
      const { error } = await supabase.from("event_feedback").insert({
        event_id: data.event_id,
        user_id: user?.id || null,
        overall_feeling: data.overall_feeling,
        is_first_time: data.is_first_time,
        how_heard: data.how_heard,
        venue_feedback: data.venue_feedback,
        repertoire_feedback: data.repertoire_feedback,
        enjoyed_most: data.enjoyed_most,
        improvements: data.improvements || null,
        time_slot_rating: data.time_slot_rating,
        future_ideas: data.future_ideas || null,
        price_point: data.price_point,
        interest_next_month: data.interest_next_month,
        best_times_ongoing: data.best_times_ongoing,
        regular_attendance_interest: data.regular_attendance_interest,
        attendance_frequency: data.attendance_frequency,
        recommend_score: parseInt(data.recommend_score),
        additional_comments: data.additional_comments || null,
        is_anonymous: data.is_anonymous,
      });
      if (error) throw error;
      showSuccess("Thank you for your feedback!");
      setIsSubmitted(true);
    } catch (error: any) {
      showError("Failed to submit feedback: " + error.message);
    }
  };

  if (loadingSession || loadingEvents) return <div className="py-20 text-center"><Loader2 className="animate-spin h-10 w-10 mx-auto text-primary" /></div>;

  if (isSubmitted) {
    return (
      <div className="py-20 text-center space-y-8">
        <div className="bg-green-100 text-green-700 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto shadow-lg"><CheckCircle2 className="h-10 w-10" /></div>
        <h1 className="text-4xl font-black font-lora">Feedback Received!</h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto font-medium">Thank you for helping me improve Resonance. Your voice matters.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button size="lg" className="rounded-xl font-bold" onClick={() => navigate("/")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-12 max-w-3xl mx-auto">
      <BackButton to="/" />
      
      <header className="space-y-4">
        <Badge className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Post-Session Feedback</Badge>
        <h1 className="text-4xl md:text-6xl font-black font-lora tracking-tighter">Share Your Thoughts</h1>
        <p className="text-xl text-muted-foreground font-medium">Help me make the next session even better.</p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-16">
          
          <div className="space-y-8 p-8 bg-muted/30 rounded-[2rem] border border-border/50">
            <FormField
              control={form.control}
              name="event_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xl font-black font-lora flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-primary" /> Which session did you attend?
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-14 rounded-xl text-lg font-bold border-2 border-primary/10 bg-background">
                        <SelectValue placeholder="Select an event..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl">
                      {pastEvents?.map((event) => (
                        <SelectItem key={event.id} value={event.id} className="font-bold py-3">
                          {event.title} ({format(parseISO(event.date), "MMM do, yyyy")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {selectedEventId && (
            <div className="space-y-16 animate-fade-in-up">
              <div className="space-y-10">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1 bg-primary rounded-full" />
                  <h2 className="text-2xl font-black font-lora">The Experience</h2>
                </div>

                <FormField
                  control={form.control}
                  name="overall_feeling"
                  render={({ field }) => (
                    <FormItem className="space-y-6">
                      <FormLabel className="text-lg font-bold">How did the session feel for you overall?</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {["Loved It", "Good", "Neutral", "Not for me"].map((option) => (
                            <FormItem key={option}>
                              <FormControl><RadioGroupItem value={option} className="sr-only" /></FormControl>
                              <FormLabel className={cn("flex flex-col items-center justify-center p-5 rounded-2xl border-2 cursor-pointer transition-all text-center font-black h-full", field.value === option ? "border-primary bg-primary/5 text-primary shadow-lg" : "border-border bg-card hover:border-primary/20")}>{option}</FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <FormField
                    control={form.control}
                    name="is_first_time"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel className="text-lg font-bold flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" /> Was this your first time?</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={(val) => field.onChange(val === "true")} className="flex gap-6">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="true" id="first-yes" />
                              <FormLabel htmlFor="first-yes" className="font-bold">Yes, first time!</FormLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="false" id="first-no" />
                              <FormLabel htmlFor="first-no" className="font-bold">No, I'm a regular.</FormLabel>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="how_heard"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold flex items-center gap-2"><Search className="h-5 w-5 text-primary" /> How did you hear about us?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="rounded-xl h-12 font-bold"><SelectValue placeholder="Select source" /></SelectTrigger></FormControl>
                          <SelectContent className="rounded-xl">
                            {["Instagram", "Facebook", "Friend / Word of Mouth", "Email Newsletter", "Google Search", "Flyer / Poster", "Other"].map(opt => (<SelectItem key={opt} value={opt} className="font-bold">{opt}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <FormField
                    control={form.control}
                    name="enjoyed_most"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold">What did you enjoy most?</FormLabel>
                        <FormControl><Textarea placeholder="The harmonies, the people, the energy..." {...field} className="rounded-xl min-h-[120px] font-medium" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="improvements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold">What could be improved?</FormLabel>
                        <FormControl><Textarea placeholder="Anything that didn't quite land..." {...field} className="rounded-xl min-h-[120px] font-medium" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-10">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1 bg-primary rounded-full" />
                  <h2 className="text-2xl font-black font-lora">Logistics</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <FormField
                    control={form.control}
                    name="venue_feedback"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> The Venue</FormLabel>
                        <FormControl><Textarea placeholder="Location, acoustics, comfort..." {...field} className="rounded-xl min-h-[100px] font-medium" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="repertoire_feedback"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold flex items-center gap-2"><Music className="h-5 w-5 text-primary" /> The Repertoire</FormLabel>
                        <FormControl><Textarea placeholder="Song choice, difficulty, style..." {...field} className="rounded-xl min-h-[100px] font-medium" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <FormField
                    control={form.control}
                    name="time_slot_rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold">10am–1pm Time Slot</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="rounded-xl h-12 font-bold"><SelectValue placeholder="How was the timing?" /></SelectTrigger></FormControl>
                          <SelectContent className="rounded-xl">
                            {["Perfect", "A bit early", "A bit late", "Too long", "Too short", "Other"].map(opt => (<SelectItem key={opt} value={opt} className="font-bold">{opt}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price_point"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold">Price Point ($30)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="rounded-xl h-12 font-bold"><SelectValue placeholder="Does the price feel right?" /></SelectTrigger></FormControl>
                          <SelectContent className="rounded-xl">
                            {["Perfect", "A bit high", "A bit low", "Other"].map(opt => (<SelectItem key={opt} value={opt} className="font-bold">{opt}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-10 p-8 bg-muted/30 rounded-[2rem] border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1 bg-primary rounded-full" />
                  <h2 className="text-2xl font-black font-lora">Planning Ahead</h2>
                </div>

                <FormField
                  control={form.control}
                  name="future_ideas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-bold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Any songs or styles for next time?</FormLabel>
                      <FormControl><Textarea placeholder="I'd love to sing some..." {...field} className="rounded-xl min-h-[100px] bg-background font-medium" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interest_next_month"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-sm font-black uppercase tracking-widest text-muted-foreground">Would you be free for another session in {nextMonthData.monthName}?</FormLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        {nextMonthData.dates.map((dateStr) => (
                          <FormField key={dateStr} control={form.control} name="interest_next_month" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 rounded-xl bg-background border border-border/50 hover:border-primary/30 transition-all shadow-sm">
                              <FormControl><Checkbox checked={field.value?.includes(dateStr)} onCheckedChange={(checked) => checked ? field.onChange([...(field.value || []), dateStr]) : field.onChange(field.value?.filter((value) => value !== dateStr))} /></FormControl>
                              <FormLabel className="font-bold cursor-pointer">{dateStr}</FormLabel>
                            </FormItem>
                          )} />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <FormField
                    control={form.control}
                    name="regular_attendance_interest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold">Interest in regular sessions?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="rounded-xl h-12 bg-background font-bold"><SelectValue placeholder="Select interest level" /></SelectTrigger></FormControl>
                          <SelectContent className="rounded-xl">
                            {["Very Interested", "Somewhat Interested", "Neutral", "Not for me"].map(opt => (<SelectItem key={opt} value={opt} className="font-bold">{opt}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="attendance_frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold">Preferred Frequency?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="rounded-xl h-12 bg-background font-bold"><SelectValue placeholder="How often?" /></SelectTrigger></FormControl>
                          <SelectContent className="rounded-xl">
                            {["Weekly", "Fortnightly", "Monthly", "Occasionally"].map(opt => (<SelectItem key={opt} value={opt} className="font-bold">{opt}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="recommend_score"
                render={({ field }) => (
                  <FormItem className="space-y-8">
                    <FormLabel className="text-2xl font-black font-lora text-center block">How likely are you to recommend this to a friend?</FormLabel>
                    <FormControl>
                      <div className="flex justify-between gap-1 md:gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <button key={num} type="button" onClick={() => field.onChange(num.toString())} className={cn("flex-1 h-14 rounded-xl font-black transition-all border-2", field.value === num.toString() ? "bg-primary border-primary text-white shadow-lg scale-110" : "bg-background border-border text-muted-foreground hover:border-primary/40")}>{num}</button>
                        ))}
                      </div>
                    </FormControl>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                      <span>Not Likely</span>
                      <span>Extremely Likely</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_anonymous"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-4 space-y-0 rounded-[2rem] border-2 border-primary/10 p-8 bg-primary/5">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="h-6 w-6 rounded-lg border-2"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-xl font-black flex items-center gap-2">
                        <EyeOff className="h-5 w-5 text-primary" /> Submit Anonymously
                      </FormLabel>
                      <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                        If checked, your name will not be visible to Daniele.
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-20 text-2xl font-black rounded-[2rem] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <><Loader2 className="mr-3 h-8 w-8 animate-spin" /> Submitting...</> : "Send My Feedback"}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};

export default EventFeedback;