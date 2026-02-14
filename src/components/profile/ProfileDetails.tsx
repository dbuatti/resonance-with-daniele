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
  const { user, profile, loading: loadingSession, isLoggingOut, logout } = useSession();
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
    if (!loadingSession && user && profile) {
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
    setSelectedAvatarFile(file);
    setRemoveAvatarRequested(false);
  };

  const handleRemoveAvatarRequested = () => {
    setSelectedAvatarFile(null);
    setRemoveAvatarRequested(true);
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsSavingProfile(true);

    try {
      if (!user) {
        showError("You must be logged in to update your profile.");
        return;
      }

      let newAvatarUrl: string | null = profile?.avatar_url || null;

      if (removeAvatarRequested && profile?.avatar_url) {
        const urlParts = profile.avatar_url.split('/');
        const pathInStorage = urlParts.slice(urlParts.indexOf('avatars') + 1).join('/');
        await supabase.storage.from("avatars").remove([pathInStorage]);
        newAvatarUrl = null;
      }

      if (selectedAvatarFile) {
        const fileExt = selectedAvatarFile.name.split(".").pop();
        const filePath = `${user.id}/${Math.random()}.${fileExt}`;
        await supabase.storage.from("avatars").upload(filePath, selectedAvatarFile);
        const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
        newAvatarUrl = publicUrlData?.publicUrl || null;
      }

      await supabase.auth.updateUser({
        data: { 
          first_name: data.first_name || null,
          last_name: data.last_name || null,
          avatar_url: newAvatarUrl 
        },
      });

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          first_name: data.first_name || null,
          last_name: data.last_name || null,
          avatar_url: newAvatarUrl,
          voice_type: data.voice_type && data.voice_type.length > 0 ? data.voice_type : null,
          updated_at: new Date().toISOString(),
        });

      if (profileUpdateError) throw profileUpdateError;

      showSuccess("Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['adminMembers'] });
    } catch (error: any) {
      showError(`An unexpected error occurred: ${error.message}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (loadingSession) {
    return (
      <Card className="w-full p-6 md:p-8 shadow-lg rounded-xl">
        <CardHeader className="text-center">
          <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
          <Skeleton className="h-8 w-1/2 mx-auto mb-2" />
        </CardHeader>
        <CardContent className="grid gap-6">
          <Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-lg text-muted-foreground">Please log in to view your profile.</p></div>;
  }

  const displayAvatarUrl = selectedAvatarFile ? URL.createObjectURL(selectedAvatarFile) : profile?.avatar_url;

  return (
    <Card className="w-full p-6 md:p-8 shadow-lg rounded-xl">
      <CardHeader className="text-center">
        <Avatar className="w-24 h-24 mx-auto mb-4">
          {displayAvatarUrl ? (
            <AvatarImage src={displayAvatarUrl} className="object-cover" />
          ) : (
            <AvatarFallback className="bg-primary text-primary-foreground"><UserIcon className="h-12 w-12" /></AvatarFallback>
          )}
        </Avatar>
        <CardTitle className="text-3xl font-bold font-lora">My Profile</CardTitle>
        <CardDescription className="text-muted-foreground">Manage your personal information.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={user.email || ""} disabled className="bg-muted" />
            </div>
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl><Input {...field} disabled={isSavingProfile} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl><Input {...field} disabled={isSavingProfile} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AvatarUpload
              currentAvatarUrl={profile?.avatar_url || null}
              onFileChange={handleAvatarFileChange}
              onRemoveRequested={handleRemoveAvatarRequested}
              isSaving={isSavingProfile}
              selectedFile={selectedAvatarFile}
            />
            <FormField
              control={form.control}
              name="voice_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Voice Type(s)</FormLabel>
                  <FormControl>
                    <VoiceTypeSelector value={field.value || []} onChange={field.onChange} disabled={isSavingProfile} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSavingProfile}>
              {isSavingProfile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Profile"}
            </Button>
            <Button variant="outline" onClick={logout} className="w-full text-destructive hover:bg-destructive hover:text-white" disabled={isLoggingOut}>
              {isLoggingOut ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging Out...</> : <><LogOut className="mr-2 h-4 w-4" /> Sign Out</>}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProfileDetails;