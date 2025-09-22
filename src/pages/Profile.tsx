"use client";

import React, { useState, useEffect } from "react";
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
import SurveyForm from "@/components/profile/SurveyForm"; // Import the new SurveyForm component

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required").optional().or(z.literal("")),
  last_name: z.string().min(1, "Last name is required").optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const Profile: React.FC = () => {
  const { user, loading: loadingUserSession } = useSession();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [removeAvatarRequested, setRemoveAvatarRequested] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      console.log("[Profile Page] useEffect: Fetching profile data.");
      if (user) {
        setLoadingProfile(true);
        console.log(`[Profile Page] Fetching profile for user ID: ${user.id}`);
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, avatar_url")
          .eq("id", user.id); // Removed .single()

        if (error) { // Removed error.code !== 'PGRST116' check as it's now handled by data.length
          console.error("[Profile Page] Error fetching profile:", error);
          showError("Failed to load profile data.");
        } else if (data && data.length > 0) {
          console.log("[Profile Page] Profile data fetched:", data[0]);
          form.reset({
            first_name: data[0].first_name || "",
            last_name: data[0].last_name || "",
          });
          setCurrentAvatarUrl(data[0].avatar_url);
        } else {
          console.log("[Profile Page] No profile data found for user, initializing with empty values.");
          form.reset({ first_name: "", last_name: "" });
          setCurrentAvatarUrl(null);
        }
        setLoadingProfile(false);
        console.log("[Profile Page] Profile loading state set to false.");
      } else {
        console.log("[Profile Page] No user session, skipping profile fetch.");
        setLoadingProfile(false);
      }
    };

    if (!loadingUserSession) {
      console.log("[Profile Page] User session loaded, proceeding to fetch profile.");
      fetchProfile();
    } else {
      console.log("[Profile Page] User session still loading.");
    }
  }, [user, loadingUserSession, form]);

  const handleAvatarFileChange = (file: File | null) => {
    console.log("[Profile Page] Avatar file changed:", file ? file.name : 'null');
    setSelectedAvatarFile(file);
    setRemoveAvatarRequested(false); // If a new file is selected, cancel removal request
  };

  const handleRemoveAvatarRequested = () => {
    console.log("[Profile Page] Avatar removal requested.");
    setSelectedAvatarFile(null); // Clear any selected new file
    setRemoveAvatarRequested(true);
  };

  const onSubmit = async (data: ProfileFormData) => {
    console.log("[Profile Page] Form submitted. Data:", data);
    if (!user) {
      showError("You must be logged in to update your profile.");
      console.error("[Profile Page] Attempted to submit profile without a user.");
      return;
    }

    form.setValue("first_name", data.first_name);
    form.setValue("last_name", data.last_name);

    let newAvatarUrl: string | null = currentAvatarUrl;
    let uploadError: Error | null = null;
    let deleteError: Error | null = null;

    // Handle avatar removal
    if (removeAvatarRequested && currentAvatarUrl) {
      console.log("[Profile Page] Processing avatar removal.");
      const urlParts = currentAvatarUrl.split('/');
      const fileNameWithFolder = urlParts.slice(urlParts.indexOf('avatars') + 1).join('/');
      const { error } = await supabase.storage
        .from("avatars")
        .remove([fileNameWithFolder]);

      if (error) {
        console.error("[Profile Page] Error removing avatar:", error);
        deleteError = error;
      } else {
        newAvatarUrl = null; // Successfully removed
        showSuccess("Avatar removed successfully!");
        console.log("[Profile Page] Avatar removed from storage.");
      }
    }

    // Handle new avatar upload
    if (selectedAvatarFile) {
      console.log("[Profile Page] Processing new avatar upload.");
      const fileExt = selectedAvatarFile.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, selectedAvatarFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadErr) {
        console.error("[Profile Page] Error uploading avatar:", uploadErr);
        uploadError = uploadErr;
      } else {
        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);
        newAvatarUrl = publicUrlData?.publicUrl || null;
        showSuccess("Avatar uploaded successfully!");
        console.log("[Profile Page] Avatar uploaded to storage. New URL:", newAvatarUrl);
      }
    }

    if (uploadError || deleteError) {
      showError("Failed to update avatar. Please try again.");
      form.setError("first_name", { message: "Avatar update failed." }); // Generic error for form
      console.error("[Profile Page] Avatar update failed due to upload/delete error.");
      return;
    }

    // Update profile table with new name and avatar URL
    console.log("[Profile Page] Updating profiles table.");
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          first_name: data.first_name || null,
          last_name: data.last_name || null,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (profileUpdateError) {
      console.error("[Profile Page] Error updating profile in DB:", profileUpdateError);
      showError("Failed to update profile: " + profileUpdateError.message);
      return;
    }
    console.log("[Profile Page] Profile table updated successfully.");

    // Update user's metadata in Supabase Auth to ensure session sync
    console.log("[Profile Page] Updating user metadata in Supabase Auth.");
    const { data: { user: updatedAuthUser }, error: authUpdateError } = await supabase.auth.updateUser({
      data: { 
        first_name: data.first_name || null, // Add first_name to auth metadata
        last_name: data.last_name || null,   // Add last_name to auth metadata
        avatar_url: newAvatarUrl 
      },
    });

    if (authUpdateError) {
      console.error("[Profile Page] Error updating avatar URL in auth user metadata:", authUpdateError);
      showError("Failed to update avatar URL in user session.");
      return;
    }
    console.log("[Profile Page] Supabase Auth User updated:", updatedAuthUser);

    setCurrentAvatarUrl(newAvatarUrl);
    setSelectedAvatarFile(null); // Clear selected file after successful upload
    setRemoveAvatarRequested(false); // Reset removal request
    showSuccess("Profile updated successfully!");
    console.log("[Profile Page] Profile update process completed successfully.");
  };

  const handleLogout = async () => {
    console.log("[Profile Page] Attempting to log out.");
    await supabase.auth.signOut();
    console.log("[Profile Page] User logged out.");
  };

  if (loadingUserSession || loadingProfile) {
    console.log("[Profile Page] Rendering skeleton due to loadingUserSession or loadingProfile.");
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 animate-fade-in-up">
        <Card className="max-w-2xl mx-auto p-6 md:p-8 shadow-lg rounded-xl">
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
      </div>
    );
  }

  if (!user) {
    console.log("[Profile Page] No user found, displaying login prompt.");
    return (
      <div className="min-h-screen flex items-center justify-center animate-fade-in-up">
        <p className="text-lg text-muted-foreground">Please log in to view your profile.</p>
      </div>
    );
  }

  const currentFirstName = form.watch("first_name");
  const currentLastName = form.watch("last_name");
  console.log("[Profile Page] Rendering profile form for user:", user.id);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 space-y-8 animate-fade-in-up"> {/* Added space-y-8 for separation */}
      <Card className="max-w-2xl mx-auto p-6 md:p-8 shadow-lg rounded-xl">
        <CardHeader className="text-center">
          <Avatar className="w-24 h-24 mx-auto mb-4">
            {(selectedAvatarFile && URL.createObjectURL(selectedAvatarFile)) || currentAvatarUrl ? (
              <AvatarImage src={(selectedAvatarFile && URL.createObjectURL(selectedAvatarFile)) || currentAvatarUrl || ""} alt={`${currentFirstName || user.email}'s avatar`} className="object-cover" />
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user.email || ""} disabled className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" {...form.register("first_name")} />
              {form.formState.errors.first_name && (
                <p className="text-red-500 text-sm">{form.formState.errors.first_name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" {...form.register("last_name")} />
              {form.formState.errors.last_name && (
                <p className="text-red-500 text-sm">{form.formState.errors.last_name.message}</p>
              )}
            </div>
            {user && (
              <AvatarUpload
                currentAvatarUrl={currentAvatarUrl}
                onFileChange={handleAvatarFileChange}
                onRemoveRequested={handleRemoveAvatarRequested}
                isSaving={form.formState.isSubmitting}
                selectedFile={selectedAvatarFile}
              />
            )}
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
            <Button variant="outline" onClick={handleLogout} className="w-full text-destructive hover:text-destructive-foreground hover:bg-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Survey Form Section */}
      <div className="max-w-2xl mx-auto">
        <SurveyForm />
      </div>
    </div>
  );
};

export default Profile;