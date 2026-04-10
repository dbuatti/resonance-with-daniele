"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Folder, CheckCircle2, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/auth";
import { showError, showSuccess } from "@/utils/toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ResourceFolder } from "@/types/Resource";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { format } from "date-fns";

// Define the schema for the folder form
const folderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  parent_folder_id: z.string().optional().nullable(),
  event_id: z.string().optional().nullable(),
});

type FolderFormData = z.infer<typeof folderSchema>;

interface ResourceFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingFolder: ResourceFolder | null;
  currentParentFolderId: string | null; // The folder ID where the user is currently located
}

const ResourceFolderDialog: React.FC<ResourceFolderDialogProps> = ({
  isOpen,
  onClose,
  editingFolder,
  currentParentFolderId,
}) => {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FolderFormData>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: "",
      parent_folder_id: null,
      event_id: null,
    },
  });

  // Fetch all folders for the parent selection dropdown
  const fetchAllFolders = async (): Promise<ResourceFolder[]> => {
    const { data, error } = await supabase
      .from("resource_folders")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  };

  const { data: allFolders, isLoading: loadingFolders } = useQuery({
    queryKey: ['allResourceFolders'],
    queryFn: fetchAllFolders,
    enabled: isOpen,
  });

  // Fetch all events for the event selection dropdown
  const { data: allEvents, isLoading: loadingEvents } = useQuery({
    queryKey: ['allEventsForFolderLink'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, date")
        .order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  // Effect to reset form and state when dialog opens/changes folder
  useEffect(() => {
    if (editingFolder) {
      form.reset({
        name: editingFolder.name,
        parent_folder_id: editingFolder.parent_folder_id || null,
        event_id: editingFolder.event_id || null,
      });
    } else {
      form.reset({
        name: "",
        parent_folder_id: currentParentFolderId || null,
        event_id: null,
      });
    }
  }, [editingFolder, form, isOpen, currentParentFolderId]);

  const getFolderPathDisplay = (folderId: string | null) => {
    if (folderId === null) return "Home (Root)";
    const folder = allFolders?.find(f => f.id === folderId);
    if (!folder) return "Unknown Folder";

    let path = folder.name;
    let current = folder;
    while (current.parent_folder_id) {
      const parent = allFolders?.find(f => f.id === current.parent_folder_id);
      if (parent) {
        path = `${parent.name} / ${path}`;
        current = parent;
      } else {
        break;
      }
    }
    return path;
  };

  const onSubmit = async (data: FolderFormData) => {
    if (!user) return;
    setIsSaving(true);
    
    const folderData = {
      id: editingFolder?.id,
      user_id: user.id,
      name: data.name,
      parent_folder_id: data.parent_folder_id || null,
      event_id: data.event_id || null,
      is_nominated_for_dashboard: editingFolder?.is_nominated_for_dashboard ?? false,
    };

    try {
      const { error } = await supabase
        .from("resource_folders")
        .upsert(folderData, { onConflict: "id" });

      if (error) throw error;

      showSuccess(`Folder "${data.name}" saved successfully!`);
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['allResourceFolders'] });
      onClose();
    } catch (error: any) {
      showError("Failed to save folder: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const validParentFolders = allFolders?.filter(f => f.id !== editingFolder?.id) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-lora">{editingFolder ? "Edit Folder" : "Create New Folder"}</DialogTitle>
          <DialogDescription>
            Organize your resources and link them to specific events.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Sheet Music" {...field} disabled={isSaving} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parent_folder_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Folder</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "null" ? null : value)}
                    value={field.value || "null"}
                    disabled={isSaving || loadingFolders}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent folder (Root)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-muted-foreground" /> Home (Root)
                        </div>
                      </SelectItem>
                      {validParentFolders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4 text-muted-foreground" /> {getFolderPathDisplay(folder.id)}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="event_id"
              render={({ field }) => (
                <FormItem className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <FormLabel className="flex items-center gap-2 text-primary">
                    <Calendar className="h-4 w-4" /> Link to Event (Optional)
                  </FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "null" ? null : value)}
                    value={field.value || "null"}
                    disabled={isSaving || loadingEvents}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select an event" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">No Event Link</SelectItem>
                      {allEvents?.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title} ({format(new Date(event.date), "MMM d")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                {editingFolder ? "Save Changes" : "Create Folder"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ResourceFolderDialog;