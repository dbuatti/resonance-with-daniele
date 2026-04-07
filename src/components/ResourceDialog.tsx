"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Resource, ResourceFolder } from "@/types/Resource"; 
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Link as LinkIcon, CheckCircle2, Folder, Youtube, Mic2 } from "lucide-react";
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

const resourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(['file', 'url', 'youtube', 'lyrics'], { required_error: "Resource type is required" }),
  url: z.string().optional().nullable(),
  is_published: z.boolean().default(true),
  folder_id: z.string().optional().nullable(),
  voice_part: z.string().optional().nullable(),
});

type ResourceFormData = z.infer<typeof resourceSchema>;

interface ResourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingResource: Resource | null;
  currentFolderId: string | null;
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
      voice_part: null,
    },
  });

  const currentType = form.watch('type');

  const fetchAllFolders = async (): Promise<ResourceFolder[]> => {
    const { data, error } = await supabase
      .from("resource_folders")
      .select("*")
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

  useEffect(() => {
    if (editingResource) {
      form.reset({
        title: editingResource.title,
        description: editingResource.description || "",
        type: editingResource.type,
        url: editingResource.url || null,
        is_published: editingResource.is_published,
        folder_id: editingResource.folder_id || null,
        voice_part: editingResource.voice_part || null,
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
        voice_part: null,
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
      
      if (!pathInStorage) return { error: null };

      const { error } = await supabase.storage
        .from("resources")
        .remove([pathInStorage]);

      if (error) return { error };
      return { error: null };
    } catch (e: any) {
      return { error: new Error("Failed to parse file URL for deletion.") };
    }
  };

  const onSubmit = async (data: ResourceFormData) => {
    if (!user) {
      showError("You must be logged in to manage resources.");
      return;
    }

    const isFileResource = data.type === 'file' || data.type === 'lyrics';
    const isUrlResource = data.type === 'url' || data.type === 'youtube';

    if (isFileResource && !selectedFile && !editingResource?.url && !removeFileRequested) {
      showError("Please select a file to upload.");
      return;
    }
    if (isUrlResource && (!data.url || !z.string().url().safeParse(data.url).success)) {
      showError("Please enter a valid URL.");
      return;
    }

    setIsSaving(true);
    let finalUrl: string | null = editingResource?.url || null;
    let resourceId = editingResource?.id;
    let finalOriginalFilename: string | null = editingResource?.original_filename || null;
    let finalFileSize: number | null = editingResource?.file_size || null;

    try {
      const wasFile = editingResource?.type === 'file' || editingResource?.type === 'lyrics';
      const isNowUrl = data.type === 'url' || data.type === 'youtube';

      const shouldDeleteOldFile = 
        (removeFileRequested && editingResource?.url) ||
        (wasFile && isNowUrl && editingResource?.url);

      if (shouldDeleteOldFile) {
        const { error } = await deleteFile(editingResource.url!);
        if (error) throw new Error("Failed to delete old file.");
        finalUrl = null;
        finalOriginalFilename = null;
        finalFileSize = null;
      }

      if (selectedFile && isFileResource) {
        if (!resourceId) resourceId = crypto.randomUUID();
        const { url, error } = await uploadFile(selectedFile, resourceId);
        if (error) throw new Error("Failed to upload new file.");
        finalUrl = url;
        finalOriginalFilename = selectedFile.name;
        finalFileSize = selectedFile.size;
      }

      if (isUrlResource) {
        finalUrl = data.url || null;
        finalOriginalFilename = null;
        finalFileSize = null;
      } else if (isFileResource && !finalUrl) {
        throw new Error("File resource type requires an uploaded file.");
      }

      const resourceData = {
        id: resourceId,
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        url: finalUrl,
        type: data.type,
        is_published: data.is_published,
        folder_id: data.folder_id || null,
        voice_part: data.voice_part || null,
        original_filename: finalOriginalFilename,
        file_size: finalFileSize,
      };

      const { error: dbError } = await supabase
        .from("resources")
        .upsert(resourceData, { onConflict: "id" });

      if (dbError) throw new Error("Failed to save resource details: " + dbError.message);

      showSuccess(`Resource "${data.title}" ${editingResource ? 'updated' : 'created'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['allResourcesForLibrary'] });
      onClose();
    } catch (error: any) {
      showError(error.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const title = editingResource ? "Edit Resource" : "Create New Resource";
  const submitButtonText = editingResource ? "Save Changes" : "Create Resource";
  const hasFileOrUrl = (editingResource?.url && !removeFileRequested) || selectedFile;
  const isFileResource = currentType === 'file' || currentType === 'lyrics';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col p-0 overflow-y-auto">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle className="font-lora">{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <div className="grid gap-6 p-6 flex-grow">
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
                    <Select onValueChange={(value: 'file' | 'url' | 'youtube' | 'lyrics') => {
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
                          <div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Sheet Music (PDF/Audio)</div>
                        </SelectItem>
                        <SelectItem value="lyrics">
                          <div className="flex items-center gap-2"><Mic2 className="h-4 w-4" /> Lyrics (PDF/Text)</div>
                        </SelectItem>
                        <SelectItem value="youtube">
                          <div className="flex items-center gap-2"><Youtube className="h-4 w-4" /> YouTube Clip</div>
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
                        <SelectItem value="null">General / Full Choir</SelectItem>
                        {voiceParts.map((part) => (
                          <SelectItem key={part} value={part}>{part}</SelectItem>
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

              {(currentType === 'file' || currentType === 'lyrics') && (
                <ResourceUpload
                  currentFileUrl={(currentType === 'file' || currentType === 'lyrics') && !removeFileRequested ? editingResource?.url || null : null}
                  originalFilename={(currentType === 'file' || currentType === 'lyrics') && !removeFileRequested ? editingResource?.original_filename || null : null}
                  onFileChange={handleFileChange}
                  onRemoveRequested={handleRemoveRequested}
                  isSaving={isSaving}
                  selectedFile={selectedFile}
                  folderPathDisplay={getFolderPathDisplay(form.watch('folder_id') || null)}
                />
              )}

              {(currentType === 'url' || currentType === 'youtube') && (
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{currentType === 'youtube' ? 'YouTube URL' : 'External URL'}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={currentType === 'youtube' ? "https://youtube.com/watch?v=..." : "https://external-link.com"} 
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
                      <FormLabel>Publish Resource</FormLabel>
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
              <Button type="submit" disabled={isSaving || (isFileResource && !hasFileOrUrl)}>
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