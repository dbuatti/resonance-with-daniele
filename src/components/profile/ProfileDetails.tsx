"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { showSuccess, showError } from "@/utils/toast";
import { User as UserIcon, LogOut, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import AvatarUpload from "@/components/AvatarUpload";
import { useQueryClient } from "@tanstack/react-query";
import VoiceTypeSelector from "./VoiceTypeSelector";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required").optional().or(z.literal("")),
  last_name: z.string().min(1, "Last name is required").optional().or(z.literal("")),
  voice_type: z.array(z.string()).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfileDetails: React.FC = () => {
  const { user, profile, loading: loadingSession, isLoggingOut, logout } = useSession(); // Use centralized logout
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [removeAvatarRequested, setRemoveAvatarRequested] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      voice_type: [],
    },
  });

  useEffect(() => {
    console.log("[ProfileDetails Page] useEffect: loadingSession:", loadingSession, "User:", user?.id, "Profile from context:", profile ? 'present' : 'null');

    if (!loadingSession && user && profile) {
      console.log("[ProfileDetails Page] Setting form values from context profile:", profile);
      form.reset({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        voice_type: profile.voice_type || [],
      });
    } else if (!loadingSession && !user) {
      form.reset({ first_name: "", last_name: "", voice_type: [] });
      setSelectedAvatarFile(null);
      setRemoveAvatarRequested(false);
    }
  }, [loadingSession, user, profile, form]);

  const handleAvatarFileChange = (file: File | null) => {
    console.log("[ProfileDetails Page] Avatar file changed:", file ? file.name : 'null');
    setSelectedAvatarFile(file);
    setRemoveAvatarRequested(false);
  };

  const handleRemoveAvatarRequested = () => {
    console.log("[ProfileDetails Page] Avatar removal requested.");
    setSelectedAvatarFile(null);
    setRemoveAvatarRequested(true);
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsSavingProfile(true);
    console.log("[ProfileDetails Page] Form submitted. Data:", data);

    try {
      if (!user) {
        showError("You must be logged in to update your profile.");
        console.error("[ProfileDetails Page] Attempted to submit profile without a user.");
        return;
      }
      if (isLoggingOut) {
        showError("Cannot save profile while logging out.");
        console.warn("[ProfileDetails Page] Attempted to save profile while logout was in progress.");
        return;
      }

      let newAvatarUrl: string | null = profile?.avatar_url || null;
      let uploadError: Error | null = null;
      let deleteError: Error | null = null;

      if (removeAvatarRequested && profile?.avatar_url) {
        console.log("[ProfileDetails Page] Processing avatar removal.");
        const urlParts = profile.avatar_url.split('/');
        const pathInStorage = urlParts.slice(urlParts.indexOf('avatars') + 1).join('/');
        const { error } = await supabase.storage
          .from("avatars")
          .remove([pathInStorage]);

        if (error) {
          console.error("[ProfileDetails Page] Error removing avatar:", error);
          deleteError = error;
        } else {
          newAvatarUrl = null;
          showSuccess("Avatar removed successfully!");
          console.log("[ProfileDetails Page] Avatar removed from storage.");
        }
      }

      if (selectedAvatarFile) {
        console.log("[ProfileDetails Page] Processing new avatar upload.");
        const fileExt = selectedAvatarFile.name.split(".").pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(filePath, selectedAvatarFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadErr) {
          console.error("[ProfileDetails Page] Error uploading avatar:", uploadErr);
          uploadError = uploadErr;
        } else {
          const { data: publicUrlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);
          newAvatarUrl = publicUrlData?.publicUrl || null;
          showSuccess("Avatar uploaded successfully!");
          console.log("[ProfileDetails Page] Avatar uploaded to storage. New URL:", newAvatarUrl);
        }
      }

      if (uploadError || deleteError) {
        showError("Failed to update avatar. Please try again.");
        form.setError("first_name", { message: "Avatar update failed." });
        console.error("[ProfileDetails Page] Avatar update failed due to upload/delete error.");
        return;
      }

      console.log("[ProfileDetails Page] Updating user metadata in Supabase Auth.");
      const { data: authResponseData, error: authUpdateError } = await supabase.auth.updateUser({
        data: { 
          first_name: data.first_name || null,
          last_name: data.last_name || null,
          avatar_url: newAvatarUrl 
        },
      });
      console.log("[ProfileDetails Page] Supabase Auth updateUser response data:", authResponseData);
      console.log("[ProfileDetails Page] Supabase Auth updateUser response error:", authUpdateError);

      if (authUpdateError) {
        console.error("[ProfileDetails Page] Error updating avatar URL in auth user metadata:", authUpdateError);
        showError("Failed to update user session: " + authUpdateError.message);
        return;
      }
      console.log("[ProfileDetails Page] Supabase Auth User updated successfully:", authResponseData.user);

      console.log("[ProfileDetails Page] Updating profiles table.");
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            first_name: data.first_name || null,
            last_name: data.last_name || null,
            avatar_url: newAvatarUrl,
            voice_type: data.voice_type && data.voice_type.length > 0 ? data.voice_type : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (profileUpdateError) {
        console.error("[ProfileDetails Page] Error updating profile in DB:", profileUpdateError);
        showError("Failed to update profile: " + profileUpdateError.message);
        return;
      }
      console.log("[ProfileDetails Page] Profile table updated successfully.");

      form.reset({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        voice_type: data.voice_type || [],
      });
      setSelectedAvatarFile(null);
      setRemoveAvatarRequested(false);
      showSuccess("Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['adminMembers'] });
      console.log("[ProfileDetails Page] Profile update process completed successfully.");

    } catch (error: any) {
      console.error("[ProfileDetails Page] Unexpected error during profile update:", error);
      showError("An unexpected error occurred: " + error.message);
    } finally {
      setIsSavingProfile(false);
      console.log("[ProfileDetails Page] Finally block executed. isSavingProfile set to false.");
    }
  };

  const handleLogout = async () => {
    await logout(); // Call the centralized logout function
  };

  if (loadingSession) {
    console.log("[ProfileDetails Page] Rendering skeleton due to loadingSession.");
    return (
      <Card className="w-full p-6 md:p-8 shadow-lg rounded-xl">
        <CardHeader className="text-center">
          <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
          <Skeleton className="h-8 w-1/2 mx-auto mb-2" />
          <Skeleton className="h-5 w-2/3 mx-auto" />
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    console.log("[ProfileDetails Page] No user found, displaying login prompt.");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Please log in to view your profile.</p>
      </div>
    );
  }

  const currentFirstName = form.watch("first_name");
  const currentLastName = form.watch("last_name");
  const displayAvatarUrl = selectedAvatarFile ? URL.createObjectURL(selectedAvatarFile) : profile?.avatar_url;

  console.log("[ProfileDetails Page] Rendering profile form for user:", user.id);

  return (
    <Card className="w-full p-6 md:p-8 shadow-lg rounded-xl">
      <CardHeader className="text-center">
        <Avatar className="w-24 h-24 mx-auto mb-4">
          {displayAvatarUrl ? (
            <AvatarImage src={displayAvatarUrl} alt={`${currentFirstName || user.email}'s avatar`} className="object-cover" />
          ) : (
            <AvatarFallback className="bg-primary text-primary-foreground">
              <UserIcon className="h-12 w-12" />
            </AvatarFallback>
          )}
        </Avatar>
        <CardTitle className="text-3xl font-bold font-lora">My Profile</CardTitle>
        <CardDescription className="text-muted-foreground">Manage your personal information.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user.email || ""} disabled className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" {...form.register("first_name")} disabled={isSavingProfile || isLoggingOut} />
              {form.formState.errors.first_name && (
                <p className="text-red-500 text-sm">{form.formState.errors.first_name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" {...form.register("last_name")} disabled={isSavingProfile || isLoggingOut} />
              {form.formState.errors.last_name && (
                <p className="text-red-500 text-sm">{form.formState.errors.last_name.message}</p>
              )}
            </div>
            {user && (
              <AvatarUpload
                currentAvatarUrl={profile?.avatar_url || null}
                onFileChange={handleAvatarFileChange}
                onRemoveRequested={handleRemoveAvatarRequested}
                isSaving={isSavingProfile || isLoggingOut}
                selectedFile={selectedAvatarFile}
              />
            )}

            <FormField
              control={form.control}
              name="voice_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Voice Type(s)</FormLabel>
                  <FormControl>
                    <VoiceTypeSelector
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSavingProfile || isLoggingOut}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSavingProfile || isLoggingOut}>
              {isSavingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full text-destructive hover:text-destructive-foreground hover:bg-destructive"
              disabled={isSavingProfile || isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging Out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProfileDetails;