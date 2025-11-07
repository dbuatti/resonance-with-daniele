"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Resource, ResourceFolder } from "@/types/Resource"; // Import ResourceFolder
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Link as LinkIcon, CheckCircle2, Folder } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/auth";
import { showError, showSuccess } from "@/utils/toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ResourceUpload from './ResourceUpload';

// Define the schema for the resource form
const resourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(['file', 'url'], { required_error: "Resource type is required" }),
  url: z.string().optional().nullable(),
  is_published: z.boolean().default(true),
  folder_id: z.string().optional().nullable(),
  voice_part: z.string().optional().nullable(), // New field
});

type ResourceFormData = z.infer<typeof resourceSchema>;

interface ResourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingResource: Resource | null;
  currentFolderId: string | null; // The folder ID where the user is currently located
}

const voiceParts = [
  "Soprano 1", "Soprano 2", "Soprano", 
  "Alto 1", "Alto 2", "Alto", 
  "Tenor 1", "Tenor 2", "Tenor", 
  "Bass 1", "Bass 2", "Bass",
  "Full Choir", "Unison", "Other"
];

const ResourceDialog: React.FC<ResourceDialogProps> = ({ isOpen, onClose, editingResource, currentFolderId }) => {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeFileRequested, setRemoveFileRequested] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: "",
      description: "",
      type: 'file',
      url: null,
      is_published: true,
      folder_id: null,
      voice_part: null, // Default value for new field
    },
  });

  const currentType = form.watch('type');

  // Fetch all folders for the dropdown
  const fetchAllFolders = async (): Promise<ResourceFolder[]> => {
    const { data, error } = await supabase
      .from("resource_folders")
      .select("id, name, parent_folder_id, user_id, created_at, updated_at") // Select all required fields
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching all folders:", error);
      throw new Error("Failed to load folders for selection.");
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

  // Effect to reset form and state when dialog opens/changes resource
  useEffect(() => {
    if (editingResource) {
      form.reset({
        title: editingResource.title,
        description: editingResource.description || "",
        type: editingResource.type,
        url: editingResource.url || null,
        is_published: editingResource.is_published,
        folder_id: editingResource.folder_id || null,
        voice_part: editingResource.voice_part || null, // Set voice_part for editing
      });
      setSelectedFile(null);
      setRemoveFileRequested(false);
    } else {
      form.reset({
        title: "",
        description: "",
        type: 'file',
        url: null,
        is_published: true,
        folder_id: currentFolderId || null,
        voice_part: null, // Default value for new field
      });
      setSelectedFile(null);
      setRemoveFileRequested(false);
    }
  }, [editingResource, form, isOpen, currentFolderId]);

  const handleFileChange = useCallback((file: File | null) => {
    setSelectedFile(file);
    setRemoveFileRequested(false);
  }, []);

  const handleRemoveRequested = useCallback(() => {
    setSelectedFile(null);
    setRemoveFileRequested(true);
  }, []);

  const uploadFile = async (file: File, resourceId: string): Promise<{ url: string | null, error: Error | null }> => {
    if (!user) return { url: null, error: new Error("User not authenticated.") };

    const fileExt = file.name.split(".").pop();
    const fileName = `${resourceId}/${Date.now()}.${fileExt}`;
    const filePath = fileName;

    console.log(`[ResourceDialog] Uploading file to: resources/${filePath}`);

    const { error: uploadErr } = await supabase.storage
      .from("resources")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadErr) {
      console.error("[ResourceDialog] Error uploading file:", uploadErr);
      return { url: null, error: uploadErr };
    }

    const { data: publicUrlData } = supabase.storage
      .from("resources")
      .getPublicUrl(filePath);
      
    return { url: publicUrlData?.publicUrl || null, error: null };
  };

  const deleteFile = async (fileUrl: string): Promise<{ error: Error | null }> => {
    if (!fileUrl) return { error: null };

    try {
      const url = new URL(fileUrl);
      const pathInStorage = url.pathname.split('/resources/')[1];
      
      if (!pathInStorage) {
        console.warn("[ResourceDialog] Could not determine storage path from URL:", fileUrl);
        return { error: null };
      }

      console.log(`[ResourceDialog] Deleting file from storage: ${pathInStorage}`);
      const { error } = await supabase.storage
        .from("resources")
        .remove([pathInStorage]);

      if (error) {
        console.error("[ResourceDialog] Error removing file:", error);
        return { error };
      }
      return { error: null };
    } catch (e: any) {
      console.error("[ResourceDialog] Error parsing URL for deletion:", e);
      return { error: new Error("Failed to parse file URL for deletion.") };
    }
  };

  const onSubmit = async (data: ResourceFormData) => {
    if (!user) {
      showError("You must be logged in to manage resources.");
      return;
    }

    // Validation checks specific to resource type
    if (data.type === 'file' && !selectedFile && !editingResource?.url && !removeFileRequested) {
      showError("Please select a file to upload.");
      return;
    }
    if (data.type === 'url' && (!data.url || !z.string().url().safeParse(data.url).success)) {
      showError("Please enter a valid URL for the link resource.");
      return;
    }

    setIsSaving(true);
    let finalUrl: string | null = editingResource?.url || null;
    let resourceId = editingResource?.id;
    let uploadError: Error | null = null;
    let deleteError: Error | null = null;

    try {
      // 1. Handle File Deletion (if requested or type changed from file to url)
      const shouldDeleteOldFile = 
        (removeFileRequested && editingResource?.url) ||
        (editingResource?.type === 'file' && data.type === 'url' && editingResource?.url);

      if (shouldDeleteOldFile) {
        const { error } = await deleteFile(editingResource.url!);
        if (error) {
          deleteError = error;
          throw new Error("Failed to delete old file.");
        }
        finalUrl = null;
      }

      // 2. Handle File Upload (if a new file is selected)
      if (selectedFile) {
        // If creating a new resource, we need an ID first. If editing, use existing ID.
        if (!resourceId) {
          resourceId = crypto.randomUUID();
        }
        
        const { url, error } = await uploadFile(selectedFile, resourceId);
        if (error) {
          uploadError = error;
          throw new Error("Failed to upload new file.");
        }
        finalUrl = url;
      }

      // 3. Determine final URL based on type
      if (data.type === 'url') {
        finalUrl = data.url || null;
      } else if (data.type === 'file' && !finalUrl) {
        // If it's a file type but no file is uploaded/retained, throw error
        throw new Error("File resource type requires an uploaded file.");
      }

      // 4. Upsert Resource Metadata
      const resourceData = {
        id: resourceId,
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        url: finalUrl,
        type: data.type,
        is_published: data.is_published,
        folder_id: data.folder_id || null,
        voice_part: data.voice_part || null, // Include new field
      };

      const { error: dbError } = await supabase
        .from("resources")
        .upsert(resourceData, { onConflict: "id" });

      if (dbError) {
        console.error("Error saving resource metadata:", dbError);
        throw new Error("Failed to save resource details: " + dbError.message);
      }

      showSuccess(`Resource "${data.title}" ${editingResource ? 'updated' : 'created'} successfully!`);
      
      // Invalidate queries for the current folder and the root
      queryClient.invalidateQueries({ queryKey: ['resources', currentFolderId] });
      queryClient.invalidateQueries({ queryKey: ['resources', data.folder_id] });
      queryClient.invalidateQueries({ queryKey: ['resources', null] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardCounts'] });

      onClose();
    } catch (error: any) {
      console.error("Resource operation failed:", error);
      showError(error.message || "An unexpected error occurred during resource operation.");
    } finally {
      setIsSaving(false);
    }
  };

  const title = editingResource ? "Edit Resource" : "Create New Resource";
  const submitButtonText = editingResource ? "Save Changes" : "Create Resource";
  const hasFileOrUrl = (editingResource?.url && !removeFileRequested) || selectedFile;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col p-0 overflow-y-auto"> {/* DialogContent handles scrolling */}
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle className="font-lora">{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <div className="grid gap-6 p-6 flex-grow"> {/* This is the scrollable area */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Sheet Music - Bohemian Rhapsody" {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Practice track for Soprano part..." {...field} className="min-h-[80px]" disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource Type</FormLabel>
                    <Select onValueChange={(value: 'file' | 'url') => {
                      field.onChange(value);
                      setSelectedFile(null);
                      setRemoveFileRequested(false);
                      form.setValue('url', null);
                    }} defaultValue={field.value} disabled={isSaving}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select resource type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="file">
                          <div className="flex items-center gap-2"><FileText className="h-4 w-4" /> File Upload (PDF/Audio)</div>
                        </SelectItem>
                        <SelectItem value="url">
                          <div className="flex items-center gap-2"><LinkIcon className="h-4 w-4" /> External Link (URL)</div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="voice_part"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voice Part (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "null" ? null : value)}
                      value={field.value || "null"}
                      disabled={isSaving}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select voice part" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">
                          General / Full Choir
                        </SelectItem>
                        {voiceParts.map((part) => (
                          <SelectItem key={part} value={part}>
                            {part}
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
                name="folder_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Folder Location</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "null" ? null : value)}
                      value={field.value || "null"}
                      disabled={isSaving || loadingFolders}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select folder (Root)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">
                          <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4 text-muted-foreground" /> Home (Root)
                          </div>
                        </SelectItem>
                        {allFolders?.map((folder) => (
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

              {currentType === 'file' && (
                <ResourceUpload
                  currentFileUrl={editingResource?.type === 'file' && !removeFileRequested ? editingResource.url : null}
                  onFileChange={handleFileChange}
                  onRemoveRequested={handleRemoveRequested}
                  isSaving={isSaving}
                  selectedFile={selectedFile}
                  folderPathDisplay={getFolderPathDisplay(form.watch('folder_id') || null)}
                />
              )}

              {currentType === 'url' && (
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>External URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://youtube.com/watch?v=..." 
                          {...field} 
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          disabled={isSaving} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="is_published"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Publish Resource
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        If checked, this resource will be visible to all logged-in members.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="p-6 pt-4 border-t border-border flex-shrink-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || (currentType === 'file' && !hasFileOrUrl)}>
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

export default ResourceDialog;