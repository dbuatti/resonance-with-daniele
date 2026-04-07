"use client";

import React, { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, MapPin, Music, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSaturday, isSunday } from "date-fns";
import BackButton from "@/components/ui/BackButton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const feedbackSchema = z.object({
  overall_feeling: z.string().min(1, "Please select how the session felt"),
  overall_feeling_other: z.string().optional(),
  venue_feedback: z.string().min(1, "Please tell us about the venue"),
  repertoire_feedback: z.string().min(1, "Please tell us about the repertoire"),
  enjoyed_most: z.string().min(1, "Please tell us what you enjoyed"),
  improvements: z.string().optional(),
  time_slot_rating: z.string().min(1, "Please rate the time slot"),
  future_repertoire: z.string().optional(),
  future_ideas: z.string().optional(),
  price_point: z.string().min(1, "Please select a price point"),
  interest_next_month: z.array(z.string()).optional(),
  best_times_ongoing: z.array(z.string()).optional(),
  regular_attendance_interest: z.string().min(1, "Please select your interest level"),
  attendance_frequency: z.string().min(1, "Please select a frequency"),
  recommend_score: z.string().min(1, "Please provide a score"),
  how_heard: z.string().optional(),
  additional_comments: z.string().optional(),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

const EventFeedback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId");
  const { user, loading: loadingSession } = useSession();
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: event, isLoading: loadingEvent } = useQuery({
    queryKey: ["eventForFeedback", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const nextMonthData = useMemo(() => {
    if (!event?.date) return { monthName: "Next Month", dates: [] };
    const eventDate = new Date(event.date);
    const nextMonth = addMonths(eventDate, 1);
    const monthName = format(nextMonth, "MMMM");
    const start = startOfMonth(nextMonth);
    const end = endOfMonth(nextMonth);
    const allDays = eachDayOfInterval({ start, end });
    const weekends = allDays
      .filter(day => isSaturday(day) || isSunday(day))
      .map(day => format(day, "EEEE MMMM do"));
    return { monthName, dates: weekends };
  }, [event?.date]);

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      interest_next_month: [],
      best_times_ongoing: [],
    },
  });

  const onSubmit = async (data: FeedbackFormData) => {
    if (!user || !eventId) return;
    try {
      const { error } = await supabase.from("event_feedback").insert({
        event_id: eventId,
        user_id: user.id,
        overall_feeling: data.overall_feeling,
        overall_feeling_other: data.overall_feeling_other || null,
        venue_feedback: data.venue_feedback,
        repertoire_feedback: data.repertoire_feedback,
        enjoyed_most: data.enjoyed_most,
        improvements: data.improvements || null,
        time_slot_rating: data.time_slot_rating,
        future_repertoire: data.future_repertoire || null,
        future_ideas: data.future_ideas || null,
        price_point: data.price_point,
        interest_next_month: data.interest_next_month,
        best_times_ongoing: data.best_times_ongoing,
        regular_attendance_interest: data.regular_attendance_interest,
        attendance_frequency: data.attendance_frequency,
        recommend_score: parseInt(data.recommend_score),
        how_heard: data.how_heard || null,
        additional_comments: data.additional_comments || null,
      });
      if (error) throw error;
      showSuccess("Thank you for your feedback!");
      setIsSubmitted(true);
    } catch (error: any) {
      showError("Failed to submit feedback: " + error.message);
    }
  };

  if (loadingSession || loadingEvent) return <div className="p-20 text-center"><Loader2 className="animate-spin h-12 w-12 mx-auto text-primary" /></div>;
  if (!eventId || !event) return <div className="container mx-auto px-4 py-20 text-center"><h2 className="text-2xl font-bold mb-4">Event Not Found</h2><Button onClick={() => navigate("/")}>Return Home</Button></div>;

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 py-20 text-center space-y-6">
        <div className="bg-green-100 text-green-700 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto shadow-lg"><CheckCircle2 className="h-12 w-12" /></div>
        <h1 className="text-4xl font-black font-lora">Feedback Received!</h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">Thank you for helping me improve Resonance. Your voice matters.</p>
        <Button size="lg" className="rounded-xl font-bold" onClick={() => navigate("/")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
      <BackButton to="/" className="mb-8" />
      <header className="text-center space-y-4 mb-12">
        <Badge className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">Post-Session Feedback</Badge>
        <h1 className="text-4xl md:text-6xl font-black font-lora tracking-tighter">{event.title}</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">How was the session on {format(new Date(event.date), "MMMM do")}?</p>
      </header>

      <Card className="shadow-2xl rounded-[2.5rem] border-none overflow-hidden">
        <CardContent className="p-8 md:p-12">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
              
              <FormField
                control={form.control}
                name="overall_feeling"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-xl font-black font-lora">How did the session feel for you overall?</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {["Loved It", "Good", "Neutral", "Not for me"].map((option) => (
                          <FormItem key={option}>
                            <FormControl><RadioGroupItem value={option} className="sr-only" /></FormControl>
                            <FormLabel className={cn("flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all text-center font-bold", field.value === option ? "border-primary bg-primary/5 text-primary" : "border-muted hover:border-primary/20")}>{option}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="venue_feedback"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-bold font-lora flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> What did you think of the venue?</FormLabel>
                      <FormControl><Textarea placeholder="Location, acoustics, comfort..." {...field} className="rounded-xl min-h-[100px]" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="repertoire_feedback"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-bold font-lora flex items-center gap-2"><Music className="h-4 w-4 text-primary" /> How did you feel about the repertoire?</FormLabel>
                      <FormControl><Textarea placeholder="Song choice, difficulty, style..." {...field} className="rounded-xl min-h-[100px]" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="enjoyed_most"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-bold font-lora">What did you enjoy most?</FormLabel>
                      <FormControl><Textarea placeholder="The harmonies, the people..." {...field} className="rounded-xl min-h-[100px]" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="improvements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-bold font-lora">What could be improved for next time?</FormLabel>
                      <FormControl><Textarea placeholder="Anything that didn't quite land..." {...field} className="rounded-xl min-h-[100px]" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="time_slot_rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-bold font-lora">What did you think of the 10am–1pm time slot?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Select an option" /></SelectTrigger></FormControl>
                        <SelectContent>{["Perfect", "A bit early", "A bit late", "Too long", "Too short", "Other"].map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
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
                      <FormLabel className="text-lg font-bold font-lora">What price point feels right for future 3-hour sessions?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Select an option" /></SelectTrigger></FormControl>
                        <SelectContent>{["$20–$30", "$30–$40", "$40–$50", "$50+", "Other"].map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="future_repertoire"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-bold font-lora">What repertoire would you enjoy in future?</FormLabel>
                      <FormControl><Input placeholder="Artist or song suggestions..." {...field} className="rounded-xl h-12" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="future_ideas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-bold font-lora flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Ideas for repertoire going forward?</FormLabel>
                      <FormControl><Input placeholder="Themes, genres, specific songs..." {...field} className="rounded-xl h-12" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6 p-6 bg-muted/30 rounded-3xl">
                <h3 className="text-xl font-black font-lora">Planning Ahead</h3>
                <FormField
                  control={form.control}
                  name="interest_next_month"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Would you be free/interested in another session in {nextMonthData.monthName}?</FormLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                        {nextMonthData.dates.map((dateStr) => (
                          <FormField key={dateStr} control={form.control} name="interest_next_month" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 rounded-xl bg-background border border-transparent hover:border-primary/20 transition-all">
                              <FormControl><Checkbox checked={field.value?.includes(dateStr)} onCheckedChange={(checked) => checked ? field.onChange([...(field.value || []), dateStr]) : field.onChange(field.value?.filter((value) => value !== dateStr))} /></FormControl>
                              <FormLabel className="font-bold cursor-pointer">{dateStr}</FormLabel>
                            </FormItem>
                          )} />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="recommend_score"
                render={({ field }) => (
                  <FormItem className="space-y-6">
                    <FormLabel className="text-xl font-black font-lora">How likely are you to recommend this session to a friend?</FormLabel>
                    <FormControl>
                      <div className="flex justify-between gap-1 md:gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <button key={num} type="button" onClick={() => field.onChange(num.toString())} className={cn("flex-1 h-12 rounded-lg font-black transition-all border-2", field.value === num.toString() ? "bg-primary border-primary text-white shadow-lg scale-110" : "bg-background border-muted text-muted-foreground hover:border-primary/40")}>{num}</button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-16 text-xl font-black rounded-2xl shadow-2xl" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Submitting...</> : "Submit Feedback"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventFeedback;