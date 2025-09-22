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

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setLoadingProfile(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, avatar_url")
          .eq("id", user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine for new users
          console.error("Error fetching profile:", error);
          showError("Failed to load profile data.");
        } else if (data) {
          form.reset({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
          });
          setCurrentAvatarUrl(data.avatar_url);
        }
        setLoadingProfile(false);
      }
    };

    if (!loadingUserSession) {
      fetchProfile();
    }
  }, [user, loadingUserSession, form]);

  const updateAvatarUrlInProfile = async (url: string | null) => {
    if (!user) return;

    // 1. Update the 'profiles' table
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          avatar_url: url,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("Error updating avatar URL in profile table:", profileError);
      showError("Failed to update avatar URL in profile.");
      return;
    }

    // 2. Update the user's metadata in Supabase Auth to ensure session sync
    // This is crucial for the `useSession` hook to reflect the change immediately
    const { data: { user: updatedAuthUser }, error: authError } = await supabase.auth.updateUser({
      data: { avatar_url: url },
    });

    if (authError) {
      console.error("Error updating avatar URL in auth user metadata:", authError);
      showError("Failed to update avatar URL in user session.");
      return;
    }

    // Log the updated user object to confirm the metadata change
    console.log("Supabase Auth User updated:", updatedAuthUser);

    setCurrentAvatarUrl(url);
    showSuccess("Avatar updated successfully!");
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) {
      showError("You must be logged in to update your profile.");
      return;
    }

    const { first_name, last_name } = data;
    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          first_name: first_name || null,
          last_name: last_name || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (error) {
      console.error("Error updating profile:", error);
      showError("Failed to update profile.");
    } else {
      showSuccess("Profile updated successfully!");
      // Optionally, refresh user session to update user_metadata if needed
      // await supabase.auth.refreshSession();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loadingUserSession || loadingProfile) {
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
    return (
      <div className="min-h-screen flex items-center justify-center animate-fade-in-up">
        <p className="text-lg text-muted-foreground">Please log in to view your profile.</p>
      </div>
    );
  }

  const currentFirstName = form.watch("first_name");
  const currentLastName = form.watch("last_name");

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 space-y-8 animate-fade-in-up"> {/* Added space-y-8 for separation */}
      <Card className="max-w-2xl mx-auto p-6 md:p-8 shadow-lg rounded-xl">
        <CardHeader className="text-center">
          <Avatar className="w-24 h-24 mx-auto mb-4">
            {currentAvatarUrl ? (
              <AvatarImage src={currentAvatarUrl} alt={`${currentFirstName || user.email}'s avatar`} className="object-cover" />
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
                userId={user.id}
                currentAvatarUrl={currentAvatarUrl}
                onUploadSuccess={updateAvatarUrlInProfile}
                onRemoveSuccess={() => updateAvatarUrlInProfile(null)}
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