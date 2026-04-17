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
import { Checkbox } from "@/components/ui/checkbox";

const songSuggestionSchema = z.object({
  title: z.string().min(1, "Song title is required"),
  artist: z.string().min(1, "Artist name is required"),
  reason: z.string().optional(),
  submit_anonymously: z.boolean().optional(),
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
      submit_anonymously: false,
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
        user_id: userIdToSubmit,
        title: data.title,
        artist: data.artist,
        reason: data.reason || null,
      });

      if (error) {
        console.error("Error submitting song suggestion:", error);
        showError("Failed to submit song suggestion: " + error.message);
      } else {
        showSuccess("Song suggestion added successfully!");
        form.reset({ submit_anonymously: false });
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
      <Card className="p-4 shadow-sm rounded-xl bg-muted/50">
        <Skeleton className="h-5 w-1/2 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="p-4 shadow-sm rounded-xl text-center border-l-4 border-primary bg-muted/50">
        <CardHeader className="p-0 mb-3">
          <CardTitle className="text-lg font-lora flex items-center justify-center gap-2">
            <Music className="h-5 w-5 text-primary" /> Suggest a Song
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <CardDescription className="mb-3 text-xs">
            Log in to suggest new songs for the choir.
          </CardDescription>
          <Button asChild size="sm" className="w-full rounded-lg font-bold">
            <Link to="/login">Log In to Suggest</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6 shadow-sm rounded-2xl bg-muted/50">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-lg font-lora flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" /> Suggest a Song
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Song Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Bohemian Rhapsody" {...field} disabled={isSubmittedSuccessfully} className="h-9 rounded-lg text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="artist"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Artist</FormLabel>
                  <FormControl>
                    <Input placeholder="Queen" {...field} disabled={isSubmittedSuccessfully} className="h-9 rounded-lg text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Why this song? (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="I love the harmonies..."
                      className="resize-none min-h-[60px] rounded-lg text-sm"
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
                <FormItem className="flex flex-row items-start space-x-2 space-y-0 rounded-lg border p-2 bg-background/50">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmittedSuccessfully}
                    />
                  </FormControl>
                  <div className="space-y-0.5 leading-none">
                    <FormLabel className="text-[10px] font-bold">
                      Submit Anonymously
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              size="sm"
              className={cn("w-full transition-all duration-300 font-bold h-10 rounded-xl", isSubmittedSuccessfully && "bg-green-600 hover:bg-green-700")}
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