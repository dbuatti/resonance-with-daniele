"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useDelayedLoading } from "@/hooks/use-delayed-loading"; // Import the new hook

const surveySchema = z.object({
  how_heard: z.string().optional(),
  motivation: z.array(z.string()).optional(),
  attended_session: z.boolean().optional(),
  singing_experience: z.string().optional(),
  session_frequency: z.string().optional(),
  preferred_time: z.string().optional(),
  music_genres: z.array(z.string()).optional(),
  choir_goals: z.string().optional(),
  inclusivity_importance: z.string().optional(),
  suggestions: z.string().optional(),
});

type SurveyFormData = z.infer<typeof surveySchema>;

const SurveyForm: React.FC = () => {
  const { user, loading: loadingUserSession } = useSession();
  const [surveyDataLoaded, setSurveyDataLoaded] = useState(false);

  const isLoadingAny = loadingUserSession || !surveyDataLoaded;
  const showDelayedSkeleton = useDelayedLoading(isLoadingAny); // Use the delayed loading hook

  const form = useForm<SurveyFormData>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      how_heard: "",
      motivation: [],
      attended_session: undefined,
      singing_experience: "",
      session_frequency: "",
      preferred_time: "",
      music_genres: [],
      choir_goals: "",
      inclusivity_importance: "",
      suggestions: "",
    },
  });

  const previousUserIdRef = useRef<string | undefined>(undefined);

  // Effect to fetch survey data when user or session loading state changes
  useEffect(() => {
    console.log("[SurveyForm] useEffect: User session loading:", loadingUserSession, "User:", user?.id, "Survey data loaded:", surveyDataLoaded, "Previous User ID Ref:", previousUserIdRef.current);

    if (loadingUserSession) {
      return;
    }

    // If user ID changes, reset surveyDataLoaded to trigger a new fetch
    if (user?.id !== previousUserIdRef.current) {
      console.log("[SurveyForm] User ID changed, resetting surveyDataLoaded.");
      setSurveyDataLoaded(false);
      previousUserIdRef.current = user?.id; // Update ref
      // Also reset form states immediately to avoid showing old data
      form.reset({
        how_heard: "", motivation: [], attended_session: undefined, singing_experience: "",
        session_frequency: "", preferred_time: "", music_genres: [], choir_goals: "",
        inclusivity_importance: "", suggestions: "",
      });
    }

    if (!user) {
      console.log("[SurveyForm] useEffect: No user, resetting survey states.");
      setSurveyDataLoaded(true); // No user, so no survey data to load, consider it "loaded"
      form.reset({
        how_heard: "", motivation: [], attended_session: undefined, singing_experience: "",
        session_frequency: "", preferred_time: "", music_genres: [], choir_goals: "",
        inclusivity_importance: "", suggestions: "",
      });
      return;
    }

    // Only load survey if user is present AND survey data hasn't been loaded yet
    if (user && !surveyDataLoaded) {
      const loadSurveyData = async () => {
        console.log(`[SurveyForm] loadSurveyData: Fetching survey data for user ID: ${user.id}`);
        const { data, error } = await supabase
          .from("profiles")
          .select("how_heard, motivation, attended_session, singing_experience, session_frequency, preferred_time, music_genres, choir_goals, inclusivity_importance, suggestions")
          .eq("id", user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("[SurveyForm] loadSurveyData: Error fetching survey data:", error);
          showError("Failed to load survey data.");
        } else if (data) {
          console.log("[SurveyForm] loadSurveyData: Survey data fetched:", data);
          form.reset({
            how_heard: data.how_heard || "",
            motivation: data.motivation || [],
            attended_session: data.attended_session ?? undefined,
            singing_experience: data.singing_experience || "",
            session_frequency: data.session_frequency || "",
            preferred_time: data.preferred_time || "",
            music_genres: data.music_genres || [],
            choir_goals: data.choir_goals || "",
            inclusivity_importance: data.inclusivity_importance || "",
            suggestions: data.suggestions || "",
          });
        } else {
          console.log("[SurveyForm] loadSurveyData: No survey data found for user, initializing with empty values.");
          form.reset({
            how_heard: "", motivation: [], attended_session: undefined, singing_experience: "",
            session_frequency: "", preferred_time: "", music_genres: [], choir_goals: "",
            inclusivity_importance: "", suggestions: "",
          });
        }
        setSurveyDataLoaded(true); // Mark survey data as loaded
        console.log("[SurveyForm] loadSurveyData: Survey data loaded state set to true.");
      };
      loadSurveyData();
    }
  }, [user?.id, loadingUserSession, surveyDataLoaded]); // Dependencies: user?.id, loadingUserSession, and surveyDataLoaded

  const onSubmit = async (data: SurveyFormData) => {
    if (!user) {
      showError("You must be logged in to update survey data.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          how_heard: data.how_heard || null,
          motivation: data.motivation && data.motivation.length > 0 ? data.motivation : null,
          attended_session: data.attended_session ?? null,
          singing_experience: data.singing_experience || null,
          session_frequency: data.session_frequency || null,
          preferred_time: data.preferred_time || null,
          music_genres: data.music_genres && data.music_genres.length > 0 ? data.music_genres : null,
          choir_goals: data.choir_goals || null,
          inclusivity_importance: data.inclusivity_importance || null,
          suggestions: data.suggestions || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (error) {
      console.error("Error updating survey data:", error);
      showError("Failed to update survey data: " + error.message);
    } else {
      showSuccess("Survey data updated successfully!");
      // Manually update form state after successful save
      form.reset({
        how_heard: data.how_heard || "",
        motivation: data.motivation || [],
        attended_session: data.attended_session ?? undefined,
        singing_experience: data.singing_experience || "",
        session_frequency: data.session_frequency || "",
        preferred_time: data.preferred_time || "",
        music_genres: data.music_genres || [],
        choir_goals: data.choir_goals || "",
        inclusivity_importance: data.inclusivity_importance || "",
        suggestions: data.suggestions || "",
      });
      setSurveyDataLoaded(true); // Mark survey data as loaded to prevent re-fetch by useEffect
    }
  };

  // The main loading condition for the component
  if (showDelayedSkeleton) { // Use the delayed skeleton state
    return (
      <Card className="p-6 md:p-8 shadow-lg rounded-xl">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-5 w-1/2" />
        </CardHeader>
        <CardContent className="grid gap-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-6 md:p-8 shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold font-lora">Market Research Survey</CardTitle>
        <CardDescription className="text-muted-foreground">
          Help me understand my community better by answering a few questions. You can update your responses anytime!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="how_heard"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How did you hear about Resonance with Daniele?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Social Media">Social Media</SelectItem>
                      <SelectItem value="Friend/Word of Mouth">Friend/Word of Mouth</SelectItem>
                      <SelectItem value="Online Search">Online Search (Google, etc.)</SelectItem>
                      <SelectItem value="Local Event/Flyer">Local Event/Flyer</SelectItem>
                      <SelectItem value="DanieleBuatti.com">DanieleBuatti.com</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motivation"
              render={() => (
                <FormItem>
                  <FormLabel>What is your primary motivation for joining a choir? (Select all that apply)</FormLabel>
                  <div className="space-y-2">
                    {["Socialising", "Improving vocal skills", "Stress relief", "Performance opportunities", "Learning new music", "Community connection", "Other"].map((item) => (
                      <FormField
                        key={item}
                        control={form.control}
                        name="motivation"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), item])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {item}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attended_session"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Have you attended a choir session with Daniele yet?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value === "true")}
                      value={field.value === true ? "true" : field.value === false ? "false" : ""}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="true" />
                        </FormControl>
                        <FormLabel className="font-normal">Yes</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="false" />
                        </FormControl>
                        <FormLabel className="font-normal">No</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="singing_experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What is your general singing experience level?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your experience level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner (Little to no experience)</SelectItem>
                      <SelectItem value="Intermediate">Intermediate (Some experience, comfortable with basics)</SelectItem>
                      <SelectItem value="Advanced">Advanced (Experienced singer, comfortable with harmonies)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* New Questions */}
            <FormField
              control={form.control}
              name="session_frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How often would you like to attend choir sessions?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Fortnightly">Fortnightly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Occasionally">Occasionally</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferred_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What time of day works best for you to attend choir sessions?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preferred time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Morning">Morning</SelectItem>
                      <SelectItem value="Afternoon">Afternoon</SelectItem>
                      <SelectItem value="Evening">Evening</SelectItem>
                      <SelectItem value="Weekends">Weekends</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="music_genres"
              render={() => (
                <FormItem>
                  <FormLabel>What types of music would you most enjoy singing in the choir? (Select all that apply)</FormLabel>
                  <div className="space-y-2">
                    {["Pop", "Musical Theatre", "Classical", "Jazz", "Folk", "Other"].map((item) => (
                      <FormField
                        key={item}
                        control={form.control}
                        name="music_genres"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), item])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {item}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="choir_goals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What are you hoping to get out of the choir experience?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., improve vocal technique, meet new people, perform on stage, relax and have fun..."
                      className="resize-y min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="inclusivity_importance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How important is it for you to attend a welcoming and inclusive environment?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select importance" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Very important">Very important</SelectItem>
                      <SelectItem value="Somewhat important">Somewhat important</SelectItem>
                      <SelectItem value="Neutral">Neutral</SelectItem>
                      <SelectItem value="Not important">Not important</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="suggestions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Do you have any suggestions for making Resonance with Daniele better?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your thoughts and ideas here..."
                      className="resize-y min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Survey Responses"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SurveyForm;