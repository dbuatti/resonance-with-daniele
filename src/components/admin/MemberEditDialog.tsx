"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CardDescription } from "@/components/ui/card";
import AvatarUpload from "@/components/AvatarUpload";
import VoiceTypeSelector from "@/components/profile/VoiceTypeSelector";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useQueryClient } from "@tanstack/react-query";

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required").optional().or(z.literal("")),
  last_name: z.string().min(1, "Last name is required").optional().or(z.literal("")),
  voice_type: z.array(z.string()).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  voice_type: string[] | null;
}

interface MemberEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  member: Profile | null;
}

const MemberEditDialog: React.FC<MemberEditDialogProps> = ({ isOpen, onOpenChange, member }) => {
  const queryClient = useQueryClient();
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [removeAvatarRequested, setRemoveAvatarRequested] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      voice_type: [],
    },
  });

  useEffect(() => {
    if (member) {
      form.reset({
        first_name: member.first_name || "",
        last_name: member.last_name || "",
        voice_type: member.voice_type || [],
      });
      setSelectedAvatarFile(null);
      setRemoveAvatarRequested(false);
    }
  }, [member, form, isOpen]);

  const handleAvatarFileChange = (file: File | null) => {
    setSelectedAvatarFile(file);
    setRemoveAvatarRequested(false);
  };

  const handleRemoveAvatarRequested = () => {
    setSelectedAvatarFile(null);
    setRemoveAvatarRequested(true);
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!member) return;
    setIsSaving(true);

    try {
      let newAvatarUrl: string | null = member.avatar_url || null;

      if (removeAvatarRequested && member.avatar_url) {
        const urlParts = member.avatar_url.split('/');
        const pathInStorage = urlParts.slice(urlParts.indexOf('avatars') + 1).join('/');
        await supabase.storage.from("avatars").remove([pathInStorage]);
        newAvatarUrl = null;
      }

      if (selectedAvatarFile) {
        const fileExt = selectedAvatarFile.name.split(".").pop();
        const filePath = `${member.id}/${Math.random()}.${fileExt}`;
        await supabase.storage.from("avatars").upload(filePath, selectedAvatarFile);
        const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
        newAvatarUrl = publicUrlData?.publicUrl || null;
      }

      await supabase.auth.admin.updateUserById(member.id, {
        user_metadata: {
          first_name: data.first_name || null,
          last_name: data.last_name || null,
          avatar_url: newAvatarUrl,
        },
      });

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: member.id,
          first_name: data.first_name || null,
          last_name: data.last_name || null,
          avatar_url: newAvatarUrl,
          voice_type: data.voice_type && data.voice_type.length > 0 ? data.voice_type : null,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      showSuccess("Member profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['adminMembers'] });
      queryClient.invalidateQueries({ queryKey: ['profile', member.id] });
      onOpenChange(false);
    } catch (error: any) {
      showError(`Failed to update profile: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-lora">Edit Profile for {member?.first_name || member?.email}</DialogTitle>
          <CardDescription>Update the personal details for this member.</CardDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={member?.email || ""} disabled className="bg-muted" />
            </div>
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl><Input {...field} disabled={isSaving} /></FormControl>
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
                  <FormControl><Input {...field} disabled={isSaving} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AvatarUpload
              currentAvatarUrl={member?.avatar_url || null}
              onFileChange={handleAvatarFileChange}
              onRemoveRequested={handleRemoveAvatarRequested}
              isSaving={isSaving}
              selectedFile={selectedAvatarFile}
            />
            <FormField
              control={form.control}
              name="voice_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voice Type(s)</FormLabel>
                  <FormControl>
                    <VoiceTypeSelector value={field.value || []} onChange={field.onChange} disabled={isSaving} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MemberEditDialog;