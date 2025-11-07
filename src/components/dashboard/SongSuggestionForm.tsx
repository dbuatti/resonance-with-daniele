"use client";

import React, { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Music, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox

const songSuggestionSchema = z.object({
  title: z.string().min(1, "Song title is required"),
  artist: z.string().min(1, "Artist name is required"),
  reason: z.string().optional(),
  submit_anonymously: z.boolean().optional(), // New field for anonymous submission
});

type SongSuggestionFormData = z.infer<typeof songSuggestionSchema>;

interface SongSuggestionFormProps {
  onSuggestionAdded?: () => void;
}

const SongSuggestionForm: React.FC<SongSuggestionFormProps> = ({ onSuggestionAdded }) => {
  const { user, loading: loadingSession } = useSession();
  const queryClient = useQueryClient();
  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState(false);

  const form = useForm<SongSuggestionFormData>({
    resolver: zodResolver(songSuggestionSchema),
    defaultValues: {
      title: "",
      artist: "",
      reason: "",
      submit_anonymously: false, // Default to not anonymous
    },
  });

  const onSubmit = async (data: SongSuggestionFormData) => {
    if (!user) {
      showError("You must be logged in to suggest a song.");
      return;
    }

    const userIdToSubmit = data.submit_anonymously ? null : user.id;

    try {
      const { error } = await supabase.from("song_suggestions").insert({
        user_id: userIdToSubmit, // Use null if submitting anonymously
        title: data.title,
        artist: data.artist,
        reason: data.reason || null,
      });

      if (error) {
        console.error("Error submitting song suggestion:", error);
        showError("Failed to submit song suggestion: " + error.message);
      } else {
        showSuccess("Song suggestion added successfully!");
        form.reset({ submit_anonymously: false }); // Reset form, keep anonymous checkbox unchecked
        setIsSubmittedSuccessfully(true);
        setTimeout(() => setIsSubmittedSuccessfully(false), 3000);
        queryClient.invalidateQueries({ queryKey: ['songSuggestions'] });
        if (onSuggestionAdded) {
          onSuggestionAdded();
        }
      }
    } catch (error: any) {
      console.error("Unexpected error during song suggestion submission:", error);
      showError("An unexpected error occurred: " + error.message);
    }
  };

  if (loadingSession) {
    return (
      <Card className="p-6 shadow-lg rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="p-6 shadow-lg rounded-xl text-center border-l-4 border-primary">
        <CardHeader className="flex flex-row items-center justify-center space-y-0 p-0 mb-4">
          <CardTitle className="text-xl font-lora flex items-center gap-2">
            <Music className="h-6 w-6 text-primary" /> Suggest a Song
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <CardDescription className="mb-4">
            You must be logged in to suggest new songs for the choir.
          </CardDescription>
          <Button asChild className="w-full">
            <Link to="/login">Log In to Suggest</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-6 shadow-lg rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
        <CardTitle className="text-xl font-lora flex items-center gap-2">
          <Music className="h-6 w-6 text-primary" /> Suggest a Song
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <CardDescription className="mb-4">
          Have a song in mind you'd love the choir to sing? Suggest it here!
        </CardDescription>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Song Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Bohemian Rhapsody" {...field} disabled={isSubmittedSuccessfully} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="artist"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artist</FormLabel>
                  <FormControl>
                    <Input placeholder="Queen" {...field} disabled={isSubmittedSuccessfully} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why this song? (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="I love the harmonies in this song, and it would be a fun challenge for the choir!"
                      className="resize-y min-h-[80px]"
                      {...field}
                      disabled={isSubmittedSuccessfully}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="submit_anonymously"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmittedSuccessfully}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Submit Anonymously
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      If checked, your name will not be displayed next to the suggestion.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className={cn("w-full transition-all duration-300", isSubmittedSuccessfully && "bg-green-600 hover:bg-green-700")}
              disabled={form.formState.isSubmitting || isSubmittedSuccessfully}
            >
              {isSubmittedSuccessfully ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Suggested!
                </>
              ) : form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                "Suggest Song"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SongSuggestionForm;