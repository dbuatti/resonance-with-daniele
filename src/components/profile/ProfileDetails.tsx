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
import { User as UserIcon, LogOut, Loader2, Save, ShieldCheck } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

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
      <Card className="w-full max-w-2xl mx-auto p-6 md:p-8 shadow-lg rounded-2xl border-none">
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
    <Card className="w-full max-w-2xl mx-auto soft-shadow border-none rounded-[2.5rem] overflow-hidden animate-fade-in-up">
      <CardHeader className="text-center bg-muted/30 pb-10 border-b border-border/50">
        <div className="relative inline-block mx-auto mb-6">
          <Avatar className="w-32 h-32 border-4 border-background shadow-2xl">
            {displayAvatarUrl ? (
              <AvatarImage src={displayAvatarUrl} className="object-cover" />
            ) : (
              <AvatarFallback className="bg-primary text-primary-foreground">
                <UserIcon className="h-16 w-16" />
              </AvatarFallback>
            )}
          </Avatar>
          {profile?.is_admin && (
            <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 text-[10px] uppercase tracking-widest font-black shadow-xl">
              <ShieldCheck className="h-3 w-3 mr-1.5" /> Admin
            </Badge>
          )}
        </div>
        <CardTitle className="text-4xl font-black font-lora tracking-tight">Personal Details</CardTitle>
        <CardDescription className="text-lg font-medium text-muted-foreground mt-2">
          Manage your identity within the Resonance community.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 md:p-12">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
            <div className="grid gap-8">
              <div className="grid gap-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Email Address</Label>
                <Input value={user.email || ""} disabled className="h-12 bg-muted/50 font-bold rounded-xl border-none" />
                <p className="text-[10px] text-muted-foreground italic font-medium">Your email is used for secure login and cannot be changed here.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">First Name</FormLabel>
                      <FormControl><Input {...field} disabled={isSavingProfile} className="h-12 rounded-xl font-bold" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Last Name</FormLabel>
                      <FormControl><Input {...field} disabled={isSavingProfile} className="h-12 rounded-xl font-bold" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Profile Picture</Label>
                <AvatarUpload
                  currentAvatarUrl={profile?.avatar_url || null}
                  onFileChange={handleAvatarFileChange}
                  onRemoveRequested={handleRemoveAvatarRequested}
                  isSaving={isSavingProfile}
                  selectedFile={selectedAvatarFile}
                />
              </div>

              <FormField
                control={form.control}
                name="voice_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Your Voice Type(s)</FormLabel>
                    <FormControl>
                      <div className="p-6 bg-muted/30 rounded-[2rem] border-2 border-dashed border-border/50">
                        <VoiceTypeSelector value={field.value || []} onChange={field.onChange} disabled={isSavingProfile} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-6 space-y-4">
              <Button type="submit" className="w-full h-16 font-black text-xl rounded-2xl shadow-2xl shadow-primary/20 hover-lift" disabled={isSavingProfile}>
                {isSavingProfile ? (
                  <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> Saving Changes...</>
                ) : (
                  <><Save className="mr-3 h-6 w-6" /> Save Profile</>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={logout} 
                className="w-full h-12 text-muted-foreground hover:text-destructive hover:bg-destructive/5 font-black uppercase tracking-[0.2em] text-[10px]" 
                disabled={isLoggingOut}
              >
                {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />} Sign Out
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProfileDetails;