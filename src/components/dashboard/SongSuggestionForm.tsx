"use client";

import React from "react";
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
import { Loader2, Music } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const songSuggestionSchema = z.object({
  title: z.string().min(1, "Song title is required"),
  artist: z.string().min(1, "Artist name is required"),
});

type SongSuggestionFormData = z.infer<typeof songSuggestionSchema>;

interface SongSuggestionFormProps {
  onSuggestionAdded?: () => void;
}

const SongSuggestionForm: React.FC<SongSuggestionFormProps> = ({ onSuggestionAdded }) => {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const form = useForm<SongSuggestionFormData>({
    resolver: zodResolver(songSuggestionSchema),
    defaultValues: {
      title: "",
      artist: "",
    },
  });

  const onSubmit = async (data: SongSuggestionFormData) => {
    if (!user) {
      showError("You must be logged in to suggest a song.");
      return;
    }

    try {
      const { error } = await supabase.from("song_suggestions").insert({
        user_id: user.id,
        title: data.title,
        artist: data.artist,
      });

      if (error) {
        console.error("Error submitting song suggestion:", error);
        showError("Failed to submit song suggestion: " + error.message);
      } else {
        showSuccess("Song suggestion added successfully!");
        form.reset();
        queryClient.invalidateQueries({ queryKey: ['songSuggestions'] }); // Invalidate to refetch and update UI
        if (onSuggestionAdded) {
          onSuggestionAdded();
        }
      }
    } catch (error: any) {
      console.error("Unexpected error during song suggestion submission:", error);
      showError("An unexpected error occurred: " + error.message);
    }
  };

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
                    <Input placeholder="Bohemian Rhapsody" {...field} />
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
                    <Input placeholder="Queen" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
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