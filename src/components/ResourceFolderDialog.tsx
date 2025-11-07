"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Folder, CheckCircle2 } from "lucide-react";
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

// Define the schema for the folder form
const folderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  parent_folder_id: z.string().optional().nullable(),
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
    },
  });

  // Fetch all folders for the parent selection dropdown
  const fetchAllFolders = async (): Promise<ResourceFolder[]> => {
    const { data, error } = await supabase
      .from("resource_folders")
      .select("*") // Select all fields to include is_nominated_for_dashboard
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching all folders:", error);
      throw new Error("Failed to load folders.");
    }
    return data || [];
  };

  const { data: allFolders, isLoading: loadingFolders } = useQuery<
    ResourceFolder[],
    Error,
    ResourceFolder[],
    ['allResourceFolders']
  >({
    queryKey: ['allResourceFolders'],
    queryFn: fetchAllFolders,
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  // Effect to reset form and state when dialog opens/changes folder
  useEffect(() => {
    if (editingFolder) {
      form.reset({
        name: editingFolder.name,
        parent_folder_id: editingFolder.parent_folder_id || null,
      });
    } else {
      // When creating, default the parent to the current view's folder ID
      form.reset({
        name: "",
        parent_folder_id: currentParentFolderId || null,
      });
    }
  }, [editingFolder, form, isOpen, currentParentFolderId]);

  // Helper function to get the full path display for a folder
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

  // Function to check if a folder is an ancestor of the current editing folder (to prevent circular nesting)
  const isAncestor = (potentialAncestorId: string, currentFolderId: string) => {
    if (!allFolders) return false;
    let current = allFolders.find(f => f.id === currentFolderId);
    while (current) {
      if (current.parent_folder_id === potentialAncestorId) return true;
      current = allFolders.find(f => f.id === current.parent_folder_id);
    }
    return false;
  };

  // Filter out the folder being edited and its descendants from the parent selection list
  const getValidParentFolders = () => {
    if (!allFolders) return [];
    
    const invalidIds = new Set<string>();
    if (editingFolder) {
      // 1. Exclude the folder itself
      invalidIds.add(editingFolder.id);

      // 2. Exclude all descendants (cannot move a folder into its own child)
      const findDescendants = (parentId: string) => {
        allFolders.filter(f => f.parent_folder_id === parentId).forEach(child => {
          invalidIds.add(child.id);
          findDescendants(child.id);
        });
      };
      findDescendants(editingFolder.id);
    }

    return allFolders.filter(folder => !invalidIds.has(folder.id));
  };

  const onSubmit = async (data: FolderFormData) => {
    if (!user) {
      showError("You must be logged in to manage folders.");
      return;
    }

    // Final check for circular nesting if editing
    if (editingFolder && data.parent_folder_id && isAncestor(data.parent_folder_id, editingFolder.id)) {
        showError("Cannot move a folder into one of its own sub-folders.");
        return;
    }

    setIsSaving(true);
    const folderData = {
      id: editingFolder?.id,
      user_id: user.id,
      name: data.name,
      parent_folder_id: data.parent_folder_id || null,
      // Preserve nomination status if editing
      is_nominated_for_dashboard: editingFolder?.is_nominated_for_dashboard ?? false,
    };

    try {
      const { error } = await supabase
        .from("resource_folders")
        .upsert(folderData, { onConflict: "id" });

      if (error) {
        console.error("Error saving folder:", error);
        showError("Failed to save folder: " + error.message);
      } else {
        showSuccess(`Folder "${data.name}" ${editingFolder ? 'updated' : 'created'} successfully!`);
        
        // Invalidate all resource and folder queries
        queryClient.invalidateQueries({ queryKey: ['resources'] });
        queryClient.invalidateQueries({ queryKey: ['allResourceFolders'] });
        queryClient.invalidateQueries({ queryKey: ['adminDashboardCounts'] });

        onClose();
      }
    } catch (error: any) {
      console.error("Unexpected error during folder operation:", error);
      showError("An unexpected error occurred: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const title = editingFolder ? "Edit Folder" : "Create New Folder";
  const submitButtonText = editingFolder ? "Save Changes" : "Create Folder";
  const validParentFolders = getValidParentFolders();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-lora">{title}</DialogTitle>
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> {submitButtonText}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ResourceFolderDialog;