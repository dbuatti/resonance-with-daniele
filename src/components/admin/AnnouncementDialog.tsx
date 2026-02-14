"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CardDescription } from "@/components/ui/card";
import InternalLinkSelector from "@/components/InternalLinkSelector";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useQueryClient } from "@tanstack/react-query";

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  link_url: z.string().optional().nullable().refine(val => !val || z.string().url().safeParse(val).success, {
    message: "Must be a valid URL or empty",
  }),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

interface Announcement {
  id: string;
  user_id: string;
  title: string;
  content: string;
  link_url: string | null;
}

interface AnnouncementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingAnnouncement: Announcement | null;
  userId: string;
}

const AnnouncementDialog: React.FC<AnnouncementDialogProps> = ({ isOpen, onClose, editingAnnouncement, userId }) => {
  const queryClient = useQueryClient();
  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      content: "",
      link_url: "",
    },
  });

  useEffect(() => {
    if (editingAnnouncement) {
      form.reset({
        title: editingAnnouncement.title,
        content: editingAnnouncement.content,
        link_url: editingAnnouncement.link_url || "",
      });
    } else {
      form.reset({
        title: "",
        content: "",
        link_url: "",
      });
    }
  }, [editingAnnouncement, form, isOpen]);

  const onSubmit = async (data: AnnouncementFormData) => {
    try {
      const payload = {
        user_id: userId,
        title: data.title,
        content: data.content,
        link_url: data.link_url || null,
      };

      let error;
      if (editingAnnouncement) {
        const { error: updateError } = await supabase
          .from("announcements")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editingAnnouncement.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from("announcements").insert(payload);
        error = insertError;
      }

      if (error) throw error;

      showSuccess(`Announcement ${editingAnnouncement ? "updated" : "published"} successfully!`);
      queryClient.invalidateQueries({ queryKey: ["adminAnnouncements"] });
      queryClient.invalidateQueries({ queryKey: ["latestAnnouncements"] });
      onClose();
    } catch (error: any) {
      showError(`Failed to save announcement: ${error.message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-lora">{editingAnnouncement ? "Edit Announcement" : "Create New Announcement"}</DialogTitle>
          <CardDescription>Write a message to share with the choir.</CardDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input {...field} disabled={form.formState.isSubmitting} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl><Textarea {...field} className="min-h-[100px]" disabled={form.formState.isSubmitting} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="link_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link URL (Optional)</FormLabel>
                  <FormControl>
                    <InternalLinkSelector value={field.value || ""} onChange={field.onChange} disabled={form.formState.isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-2">
              <Label>Or enter external URL manually</Label>
              <Input 
                placeholder="https://external-link.com" 
                value={form.watch("link_url") || ""}
                onChange={(e) => form.setValue("link_url", e.target.value, { shouldValidate: true })}
                disabled={form.formState.isSubmitting}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Publish Announcement"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementDialog;