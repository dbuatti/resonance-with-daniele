"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Link as LinkIcon, FileText, Loader2, Search, Headphones, Folder, FolderOpen, ChevronRight, ChevronLeft, Move } from "lucide-react"; // Added Move icon
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ResourceUpload from "@/components/ResourceUpload";
import ResourceFolderCard from "@/components/ResourceFolderCard";
import MoveResourceDialog from "@/components/MoveResourceDialog"; // Import the new component

// Define schemas
const resourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  folder_id: z.string().uuid().nullable().optional(), // Added folder_id
});

const folderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  parent_folder_id: z.string().uuid().nullable().optional(),
});

type ResourceFormData = z.infer<typeof resourceSchema>;
type FolderFormData = z.infer<typeof folderSchema>;

interface Resource {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  url: string;
  created_at: string;
  folder_id: string | null; // Added folder_id
}

interface ResourceFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const Resources: React.FC = () => {
  const { user, loading: loadingUserSession } = useSession();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([{ id: null, name: "Home" }]);

  const [isAddResourceDialogOpen, setIsAddResourceDialogOpen] = useState(false);
  const [isEditResourceDialogOpen, setIsEditResourceDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const [isAddFolderDialogOpen, setIsAddFolderDialogOpen] = useState(false);
  const [isEditFolderDialogOpen, setIsEditFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ResourceFolder | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState<string | null>(null); // Track which folder is being deleted

  const [isMoveResourceDialogOpen, setIsMoveResourceDialogOpen] = useState(false); // New state for move dialog
  const [movingResource, setMovingResource] = useState<Resource | null>(null); // New state for resource being moved

  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  // State for file uploads
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeFileRequested, setRemoveFileRequested] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // For overall upload/save state

  const addResourceForm = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
      folder_id: currentFolderId,
    },
  });

  const editResourceForm = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
      folder_id: null,
    },
  });

  const addFolderForm = useForm<FolderFormData>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: "",
      parent_folder_id: currentFolderId,
    },
  });

  const editFolderForm = useForm<FolderFormData>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: "",
      parent_folder_id: null,
    },
  });

  // Custom validation for add resource form: requires either URL or a selected file
  const validateAddResourceForm = (data: ResourceFormData) => {
    if (!data.url && !selectedFile) {
      addResourceForm.setError("url", { type: "manual", message: "Either a URL or an uploaded file is required." });
      return false;
    }
    if (data.url && selectedFile) {
      addResourceForm.setError("url", { type: "manual", message: "Cannot have both a URL and an uploaded file. Please choose one." });
      return false;
    }
    return true;
  };

  // Custom validation for edit resource form: requires either URL or a selected file (if not removing existing)
  const validateEditResourceForm = (data: ResourceFormData) => {
    if (!data.url && !selectedFile && !removeFileRequested && !editingResource?.url) {
      editResourceForm.setError("url", { type: "manual", message: "Either a URL or an uploaded file is required." });
      return false;
    }
    if (data.url && selectedFile) {
      editResourceForm.setError("url", { type: "manual", message: "Cannot have both a URL and an uploaded file. Please choose one." });
      return false;
    }
    return true;
  };

  // --- Fetching Data (Folders and Resources) ---
  const fetchFolders = async (parentId: string | null): Promise<ResourceFolder[]> => {
    console.log(`[Resources Page] Fetching folders for parent_folder_id: ${parentId}`);
    let query = supabase
      .from("resource_folders")
      .select("*")
      .order("name", { ascending: true });

    if (parentId === null) {
      query = query.is("parent_folder_id", null);
    } else {
      query = query.eq("parent_folder_id", parentId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching folders:", error);
      throw new Error("Failed to load folders.");
    }
    return data || [];
  };

  const fetchResources = async (parentId: string | null, currentSearchTerm: string): Promise<Resource[]> => {
    console.log(`[Resources Page] Fetching resources for folder_id: ${parentId}, search: ${currentSearchTerm}`);
    let query = supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });

    if (parentId === null) {
      query = query.is("folder_id", null);
    } else {
      query = query.eq("folder_id", parentId);
    }

    if (currentSearchTerm) {
      query = query.or(
        `title.ilike.%${currentSearchTerm}%,description.ilike.%${currentSearchTerm}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching resources:", error);
      throw new Error("Failed to load resources.");
    }
    return data || [];
  };

  const { data: folders, isLoading: loadingFolders, error: foldersError } = useQuery<
    ResourceFolder[], Error, ResourceFolder[], ['resourceFolders', string | null]
  >({
    queryKey: ['resourceFolders', currentFolderId],
    queryFn: () => fetchFolders(currentFolderId),
    enabled: !loadingUserSession,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: resources, isLoading: loadingResources, error: resourcesError } = useQuery<
    Resource[], Error, Resource[], ['resources', string | null, string]
  >({
    queryKey: ['resources', currentFolderId, searchTerm],
    queryFn: () => fetchResources(currentFolderId, searchTerm),
    enabled: !loadingUserSession,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // --- Breadcrumb Logic ---
  useEffect(() => {
    const updateBreadcrumbs = async () => {
      if (currentFolderId === null) {
        setBreadcrumbs([{ id: null, name: "Home" }]);
        return;
      }

      const newBreadcrumbs: { id: string | null; name: string }[] = [{ id: null, name: "Home" }];
      let currentId: string | null = currentFolderId;
      const path: { id: string | null; name: string }[] = [];

      while (currentId) {
        const { data, error } = await supabase
          .from("resource_folders")
          .select("id, name, parent_folder_id")
          .eq("id", currentId)
          .single();

        if (error || !data) {
          console.error("Error fetching folder for breadcrumbs:", error);
          break;
        }
        path.unshift({ id: data.id, name: data.name });
        currentId = data.parent_folder_id;
      }
      setBreadcrumbs([...newBreadcrumbs, ...path]);
    };

    updateBreadcrumbs();
  }, [currentFolderId]);

  // --- Resource Management ---
  useEffect(() => {
    if (editingResource) {
      editResourceForm.reset({
        title: editingResource.title,
        description: editingResource.description || "",
        url: editingResource.url || "",
        folder_id: editingResource.folder_id,
      });
      setSelectedFile(null);
      setRemoveFileRequested(false);
    }
  }, [editingResource, editResourceForm]);

  const getFolderPath = useCallback(async (folderId: string | null): Promise<string> => {
    if (!folderId) return ""; // Root path

    const { data, error } = await supabase
      .from("resource_folders")
      .select("name, parent_folder_id")
      .eq("id", folderId)
      .single();

    if (error || !data) {
      console.error("Error getting folder path:", error);
      return ""; // Fallback to root path on error
    }

    const parentPath = data.parent_folder_id ? await getFolderPath(data.parent_folder_id) : "";
    return `${parentPath}${data.name}/`;
  }, []);

  const uploadFileToStorage = async (file: File, userId: string, folderId: string | null) => {
    const fileExt = file.name.split(".").pop();
    const folderPath = await getFolderPath(folderId);
    const fileName = `${userId}/${folderPath}${Date.now()}-${file.name}`;
    const filePath = fileName;

    console.log(`[Resources Page] Uploading file to storage: ${filePath}`);
    const { error: uploadErr } = await supabase.storage
      .from("resources_files")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadErr) {
      console.error("[Resources Page] Error uploading file:", uploadErr);
      throw uploadErr;
    }

    const { data: publicUrlData } = supabase.storage
      .from("resources_files")
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      throw new Error("Failed to get public URL for uploaded file.");
    }
    console.log("[Resources Page] File uploaded. Public URL:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  };

  const deleteFileFromStorage = async (fileUrl: string) => {
    if (!fileUrl.includes('supabase.co/storage/v1/object/public/resources_files/')) {
      console.log("[Resources Page] Not a Supabase Storage URL, skipping deletion:", fileUrl);
      return;
    }
    const urlParts = fileUrl.split('/');
    const pathInStorage = urlParts.slice(urlParts.indexOf('resources_files') + 1).join('/');
    console.log(`[Resources Page] Deleting file from storage: ${pathInStorage}`);
    const { error } = await supabase.storage
      .from("resources_files")
      .remove([pathInStorage]);

    if (error) {
      console.error("[Resources Page] Error removing file from storage:", error);
      throw error;
    }
    console.log("[Resources Page] File removed from storage.");
  };

  const onAddResourceSubmit = async (data: ResourceFormData) => {
    if (!validateAddResourceForm(data)) return;
    if (!user || !user.is_admin) {
      showError("Only administrators can add resources.");
      return;
    }

    setIsUploading(true);
    let resourceUrl = data.url || null;

    try {
      if (selectedFile) {
        resourceUrl = await uploadFileToStorage(selectedFile, user.id, data.folder_id || null);
      }

      console.log(`[Resources Page] Inserting new resource for user ${user.id}:`, { title: data.title, url: resourceUrl, folder_id: data.folder_id });
      const { error } = await supabase.from("resources").insert({
        user_id: user.id,
        title: data.title,
        description: data.description,
        url: resourceUrl,
        folder_id: data.folder_id || null,
      });

      if (error) {
        console.error("[Resources Page] Error adding resource:", error);
        showError("Failed to add resource: " + error.message);
      } else {
        showSuccess("Resource added successfully!");
        addResourceForm.reset({
          title: "", description: "", url: "", folder_id: currentFolderId
        });
        setSelectedFile(null);
        setIsAddResourceDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ['resources', currentFolderId, searchTerm] });
      }
    } catch (error: any) {
      console.error("[Resources Page] Error during add resource process:", error);
      showError("Failed to add resource: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const onEditResourceSubmit = async (data: ResourceFormData) => {
    if (!validateEditResourceForm(data)) return;
    if (!user || !user.is_admin || !editingResource) {
      showError("Only administrators can edit resources.");
      return;
    }

    setIsUploading(true);
    let newResourceUrl = editingResource.url;

    try {
      if (removeFileRequested && editingResource.url) {
        await deleteFileFromStorage(editingResource.url);
        newResourceUrl = null;
      }

      if (selectedFile) {
        if (editingResource.url) {
          await deleteFileFromStorage(editingResource.url);
        }
        newResourceUrl = await uploadFileToStorage(selectedFile, user.id, data.folder_id || null);
      } else if (!removeFileRequested) {
        newResourceUrl = data.url || null;
      }

      console.log(`[Resources Page] Updating resource ${editingResource.id} for user ${user.id}:`, { title: data.title, url: newResourceUrl, folder_id: data.folder_id });
      const { error } = await supabase
        .from("resources")
        .update({
          title: data.title,
          description: data.description,
          url: newResourceUrl,
          folder_id: data.folder_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingResource.id);

      if (error) {
        console.error("[Resources Page] Error updating resource:", error);
        showError("Failed to update resource: " + error.message);
      } else {
        showSuccess("Resource updated successfully!");
        setIsEditResourceDialogOpen(false);
        setEditingResource(null);
        setSelectedFile(null);
        setRemoveFileRequested(false);
        queryClient.invalidateQueries({ queryKey: ['resources', currentFolderId, searchTerm] });
      }
    } catch (error: any) {
      console.error("[Resources Page] Error during edit resource process:", error);
      showError("Failed to update resource: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResource = async (resourceId: string, resourceUrl: string) => {
    console.log("[Resources Page] Delete requested for resource ID:", resourceId);
    if (!user || !user.is_admin) {
      showError("Only administrators can delete resources.");
      return;
    }

    setIsUploading(true);
    try {
      if (resourceUrl) {
        await deleteFileFromStorage(resourceUrl);
      }

      console.log(`[Resources Page] Deleting resource ${resourceId}.`);
      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", resourceId);

      if (error) {
        console.error("[Resources Page] Error deleting resource:", error);
        showError("Failed to delete resource: " + error.message);
      } else {
        showSuccess("Resource deleted successfully!");
        queryClient.invalidateQueries({ queryKey: ['resources', currentFolderId, searchTerm] });
      }
    } catch (error: any) {
      console.error("[Resources Page] Error during delete resource process:", error);
      showError("An unexpected error occurred: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const getResourceIcon = (url: string) => {
    if (url.includes('.pdf')) {
      return <FileText className="h-6 w-6 text-muted-foreground" />;
    }
    if (url.includes('.mp3') || url.includes('.wav') || url.includes('.ogg') || url.includes('.m4a')) {
      return <Headphones className="h-6 w-6 text-muted-foreground" />;
    }
    return <LinkIcon className="h-6 w-6 text-muted-foreground" />;
  };

  // --- Folder Management ---
  useEffect(() => {
    if (editingFolder) {
      editFolderForm.reset({
        name: editingFolder.name,
        parent_folder_id: editingFolder.parent_folder_id,
      });
    }
  }, [editingFolder, editFolderForm]);

  const onAddFolderSubmit = async (data: FolderFormData) => {
    if (!user || !user.is_admin) {
      showError("Only administrators can add folders.");
      return;
    }

    setIsUploading(true); // Use this for folder operations too
    try {
      console.log(`[Resources Page] Inserting new folder for user ${user.id}:`, { name: data.name, parent_folder_id: data.parent_folder_id });
      const { error } = await supabase.from("resource_folders").insert({
        user_id: user.id,
        name: data.name,
        parent_folder_id: data.parent_folder_id || null,
      });

      if (error) {
        console.error("Error adding folder:", error);
        showError("Failed to add folder: " + error.message);
      } else {
        showSuccess("Folder added successfully!");
        addFolderForm.reset({ name: "", parent_folder_id: currentFolderId });
        setIsAddFolderDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ['resourceFolders', currentFolderId] });
      }
    } catch (error: any) {
      console.error("Unexpected error during add folder process:", error);
      showError("An unexpected error occurred: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const onEditFolderSubmit = async (data: FolderFormData) => {
    if (!user || !user.is_admin || !editingFolder) {
      showError("Only administrators can edit folders.");
      return;
    }

    setIsUploading(true);
    try {
      console.log(`[Resources Page] Updating folder ${editingFolder.id}:`, { name: data.name, parent_folder_id: data.parent_folder_id });
      const { error } = await supabase
        .from("resource_folders")
        .update({
          name: data.name,
          parent_folder_id: data.parent_folder_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingFolder.id);

      if (error) {
        console.error("Error updating folder:", error);
        showError("Failed to update folder: " + error.message);
      } else {
        showSuccess("Folder updated successfully!");
        setIsEditFolderDialogOpen(false);
        setEditingFolder(null);
        queryClient.invalidateQueries({ queryKey: ['resourceFolders', currentFolderId] });
        queryClient.invalidateQueries({ queryKey: ['resourceFolders', editingFolder.parent_folder_id] }); // Invalidate old parent if changed
      }
    } catch (error: any) {
      console.error("Unexpected error during edit folder process:", error);
      showError("An unexpected error occurred: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!user || !user.is_admin) {
      showError("Only administrators can delete folders.");
      return;
    }

    setIsDeletingFolder(folderId);
    try {
      // First, get all resources and subfolders within this folder to delete their associated files
      const { data: childResources, error: resError } = await supabase
        .from('resources')
        .select('id, url')
        .eq('folder_id', folderId);

      if (resError) throw resError;

      for (const res of childResources || []) {
        if (res.url) {
          await deleteFileFromStorage(res.url);
        }
      }

      // Supabase RLS with ON DELETE CASCADE should handle deleting child resources and subfolders
      console.log(`[Resources Page] Deleting folder ${folderId}.`);
      const { error } = await supabase
        .from("resource_folders")
        .delete()
        .eq("id", folderId);

      if (error) {
        console.error("Error deleting folder:", error);
        showError("Failed to delete folder: " + error.message);
      } else {
        showSuccess("Folder and its contents deleted successfully!");
        queryClient.invalidateQueries({ queryKey: ['resourceFolders', currentFolderId] });
        queryClient.invalidateQueries({ queryKey: ['resources', currentFolderId, searchTerm] });
        if (currentFolderId === folderId) { // If we deleted the current folder, navigate up
          const parentBreadcrumb = breadcrumbs[breadcrumbs.length - 2];
          setCurrentFolderId(parentBreadcrumb ? parentBreadcrumb.id : null);
        }
      }
    } catch (error: any) {
      console.error("Error during delete folder process:", error);
      showError("An unexpected error occurred: " + error.message);
    } finally {
      setIsDeletingFolder(null);
    }
  };

  // --- Overall Loading State ---
  const showSkeleton = (loadingFolders || loadingResources) && (!folders && !resources);

  // Determine the current folder path for display in ResourceUpload
  const currentFolderPathDisplay = breadcrumbs.map(b => b.name).join(' / ');

  return (
    <div className="space-y-6 py-8 px-4">
      <h1 className="text-4xl font-bold text-center font-lora">
        {showSkeleton ? <Skeleton className="h-10 w-3/4 mx-auto" /> : "Choir Resources"}
      </h1>
      {showSkeleton ? (
        <div className="text-lg text-center text-muted-foreground">
          <Skeleton className="h-6 w-1/2 mx-auto" />
        </div>
      ) : (
        <p className="text-lg text-center text-muted-foreground">
          This is where you'll find all the sheet music, practice tracks, and other materials I've prepared for the choir.
        </p>
      )}

      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground max-w-6xl mx-auto px-4">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.id || "root"}>
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            <Button
              variant="link"
              className="p-0 h-auto text-muted-foreground hover:text-primary"
              onClick={() => setCurrentFolderId(crumb.id)}
              disabled={index === breadcrumbs.length - 1 || isUploading}
            >
              {crumb.name}
            </Button>
          </React.Fragment>
        ))}
      </nav>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-6xl mx-auto">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search resources by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full"
            disabled={isLoading || isUploading}
          />
        </div>
        
        {user?.is_admin && (
          <>
            <Dialog open={isAddFolderDialogOpen} onOpenChange={setIsAddFolderDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={isUploading}>
                  <Folder className="mr-2 h-4 w-4" /> Add New Folder
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="font-lora">Add New Folder</DialogTitle>
                  <CardDescription>Create a new folder to organize your resources.</CardDescription>
                </DialogHeader>
                <form onSubmit={addFolderForm.handleSubmit(onAddFolderSubmit)} className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="folder-name">Folder Name</Label>
                    <Input id="folder-name" {...addFolderForm.register("name")} disabled={isUploading} />
                    {addFolderForm.formState.errors.name && (
                      <p className="text-red-500 text-sm">{addFolderForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isUploading}>
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                        </>
                      ) : (
                        "Create Folder"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddResourceDialogOpen} onOpenChange={setIsAddResourceDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={isUploading}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="font-lora">Add New Resource</DialogTitle>
                  <CardDescription>Provide details for a new choir resource.</CardDescription>
                </DialogHeader>
                <form onSubmit={addResourceForm.handleSubmit(onAddResourceSubmit)} className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" {...addResourceForm.register("title")} disabled={isUploading} />
                    {addResourceForm.formState.errors.title && (
                      <p className="text-red-500 text-sm">{addResourceForm.formState.errors.title.message}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea id="description" {...addResourceForm.register("description")} disabled={isUploading} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="url">External URL (Optional)</Label>
                    <Input id="url" type="url" {...addResourceForm.register("url")} placeholder="https://example.com/resource.pdf" disabled={isUploading || !!selectedFile} />
                    {addResourceForm.formState.errors.url && (
                      <p className="text-red-500 text-sm">{addResourceForm.formState.errors.url.message}</p>
                    )}
                    {selectedFile && <p className="text-sm text-muted-foreground">URL field disabled because a file is selected.</p>}
                  </div>
                  <ResourceUpload
                    selectedFile={selectedFile}
                    onFileChange={setSelectedFile}
                    onRemoveRequested={() => {}}
                    currentFileUrl={null}
                    isSaving={isUploading}
                    folderPathDisplay={currentFolderPathDisplay}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={isUploading}>
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                        </>
                      ) : (
                        "Add Resource"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <p className="text-md text-muted-foreground">Log in as an admin to manage resources.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 max-w-6xl mx-auto">
        {showSkeleton ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="shadow-lg rounded-xl">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (folders?.length === 0 && resources?.length === 0) ? (
          <div className="col-span-full text-center p-8 bg-card rounded-xl shadow-lg flex flex-col items-center justify-center space-y-4">
            <FolderOpen className="h-16 w-16 text-muted-foreground" />
            <p className="text-xl text-muted-foreground font-semibold font-lora">No folders or resources found here!</p>
            <p className="text-md text-muted-foreground mt-2">
              {user?.is_admin
                ? "Be the first to add a new folder or resource using the buttons above."
                : "This folder is empty."}
            </p>
            {!user?.is_admin && (
              <Button asChild className="mt-4">
                <Link to="/login">Login as Admin to Add Content</Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            {folders?.map((folder) => (
              <ResourceFolderCard
                key={folder.id}
                folder={folder}
                onNavigate={setCurrentFolderId}
                onEdit={(f) => { setEditingFolder(f); setIsEditFolderDialogOpen(true); }}
                onDelete={handleDeleteFolder}
                isDeleting={isDeletingFolder === folder.id}
              />
            ))}
            {resources?.map((resource) => (
              <Card key={resource.id} className="shadow-lg rounded-xl hover:shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-2xl font-medium font-lora">
                    {resource.title}
                  </CardTitle>
                  {getResourceIcon(resource.url)}
                </CardHeader>
                <CardContent className="space-y-2">
                  {resource.description && <p className="text-sm text-muted-foreground">{resource.description}</p>}
                  <Button asChild className="w-full">
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      <LinkIcon className="mr-2 h-4 w-4" /> View Resource
                    </a>
                  </Button>
                  {user?.is_admin && (
                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingResource(resource);
                          setIsEditResourceDialogOpen(true);
                        }}
                        disabled={isUploading}
                      >
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMovingResource(resource);
                          setIsMoveResourceDialogOpen(true);
                        }}
                        disabled={isUploading}
                      >
                        <Move className="h-4 w-4 mr-2" /> Move
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={isUploading}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your resource "{resource.title}" and any associated file.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteResource(resource.id, resource.url)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Edit Folder Dialog */}
      {editingFolder && (
        <Dialog open={isEditFolderDialogOpen} onOpenChange={setIsEditFolderDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-lora">Edit Folder</DialogTitle>
              <CardDescription>Update the name of your folder.</CardDescription>
            </DialogHeader>
            <form onSubmit={editFolderForm.handleSubmit(onEditFolderSubmit)} className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-folder-name">Folder Name</Label>
                <Input id="edit-folder-name" {...editFolderForm.register("name")} disabled={isUploading} />
                {editFolderForm.formState.errors.name && (
                  <p className="text-red-500 text-sm">{editFolderForm.formState.errors.name.message}</p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Resource Dialog */}
      {editingResource && (
        <Dialog open={isEditResourceDialogOpen} onOpenChange={setIsEditResourceDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-lora">Edit Resource</DialogTitle>
              <CardDescription>Update the details for your choir resource.</CardDescription>
            </DialogHeader>
            <form onSubmit={editResourceForm.handleSubmit(onEditResourceSubmit)} className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" {...editResourceForm.register("title")} disabled={isUploading} />
                {editResourceForm.formState.errors.title && (
                  <p className="text-red-500 text-sm">{editResourceForm.formState.errors.title.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea id="edit-description" {...editResourceForm.register("description")} disabled={isUploading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-url">External URL (Optional)</Label>
                <Input
                  id="edit-url"
                  type="url"
                  {...editResourceForm.register("url")}
                  disabled={isUploading || !!selectedFile || removeFileRequested}
                  placeholder="https://example.com/resource.pdf"
                />
                {editResourceForm.formState.errors.url && (
                  <p className="text-red-500 text-sm">{editResourceForm.formState.errors.url.message}</p>
                )}
                {(!!selectedFile || removeFileRequested) && <p className="text-sm text-muted-foreground">URL field disabled due to file selection or removal request.</p>}
              </div>
              <ResourceUpload
                selectedFile={selectedFile}
                onFileChange={setSelectedFile}
                onRemoveRequested={() => setRemoveFileRequested(true)}
                currentFileUrl={editingResource.url}
                isSaving={isUploading}
                folderPathDisplay={currentFolderPathDisplay}
              />
              <DialogFooter>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Move Resource Dialog */}
      <MoveResourceDialog
        isOpen={isMoveResourceDialogOpen}
        onOpenChange={setIsMoveResourceDialogOpen}
        resourceToMove={movingResource}
        onMoveSuccess={() => {
          setMovingResource(null);
          // Invalidate queries for the current folder to reflect the change
          queryClient.invalidateQueries({ queryKey: ['resources', currentFolderId, searchTerm] });
        }}
        currentFolderId={currentFolderId}
      />
    </div>
  );
};

export default Resources;