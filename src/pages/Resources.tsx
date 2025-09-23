"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Link as LinkIcon, FileText, Loader2, Search, Headphones } from "lucide-react";
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
import ResourceUpload from "@/components/ResourceUpload"; // Import the new component

// Define the schema for a resource
const resourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")), // URL is optional if a file is uploaded
});

type ResourceFormData = z.infer<typeof resourceSchema>;

interface Resource {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  url: string; // This will now store the public URL from Supabase Storage or an external link
  created_at: string;
}

const Resources: React.FC = () => {
  const { user, loading: loadingUserSession } = useSession();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  // State for file uploads
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeFileRequested, setRemoveFileRequested] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // For overall upload/save state

  console.log("[Resources Page] User:", user ? user.id : 'null', "Loading User Session:", loadingUserSession);

  const addForm = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
    },
  });

  const editForm = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
    },
  });

  // Custom validation for add form: requires either URL or a selected file
  const validateAddForm = (data: ResourceFormData) => {
    if (!data.url && !selectedFile) {
      addForm.setError("url", { type: "manual", message: "Either a URL or an uploaded file is required." });
      return false;
    }
    if (data.url && selectedFile) {
      addForm.setError("url", { type: "manual", message: "Cannot have both a URL and an uploaded file. Please choose one." });
      return false;
    }
    return true;
  };

  // Custom validation for edit form: requires either URL or a selected file (if not removing existing)
  const validateEditForm = (data: ResourceFormData) => {
    if (!data.url && !selectedFile && !removeFileRequested && !editingResource?.url) {
      editForm.setError("url", { type: "manual", message: "Either a URL or an uploaded file is required." });
      return false;
    }
    if (data.url && selectedFile) {
      editForm.setError("url", { type: "manual", message: "Cannot have both a URL and an uploaded file. Please choose one." });
      return false;
    }
    return true;
  };

  // Query function for fetching resources
  const fetchResources = async (currentSearchTerm: string): Promise<Resource[]> => {
    console.log("[Resources Page] Fetching all resources from Supabase with search term:", currentSearchTerm);
    let query = supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });

    if (currentSearchTerm) {
      query = query.or(
        `title.ilike.%${currentSearchTerm}%,description.ilike.%${currentSearchTerm}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Resources Page] Error fetching resources:", error);
      throw new Error("Failed to load resources.");
    }
    console.log("[Resources Page] Resources fetched successfully:", data?.length, "resources.");
    return data || [];
  };

  // Use react-query for resources data
  const { data: resources, isLoading, isFetching, error: fetchError } = useQuery<
    Resource[], // TQueryFnData
    Error,          // TError
    Resource[], // TData (the type of the 'data' property)
    ['resources', string] // TQueryKey
  >({
    queryKey: ['resources', searchTerm], // Query key includes search term
    queryFn: () => fetchResources(searchTerm),
    enabled: !loadingUserSession, // Only run query if user session is not loading
    staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Data stays in cache for 10 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  useEffect(() => {
    if (editingResource) {
      console.log("[Resources Page] useEffect: Setting edit form defaults for resource:", editingResource.id);
      editForm.reset({
        title: editingResource.title,
        description: editingResource.description || "",
        url: editingResource.url || "", // Ensure URL is set for external links
      });
      setSelectedFile(null); // Clear selected file when opening edit dialog
      setRemoveFileRequested(false); // Reset remove request
    }
  }, [editingResource, editForm]);

  const uploadFileToStorage = async (file: File, userId: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}-${file.name}`; // Unique path for each user's file
    const filePath = fileName;

    console.log(`[Resources Page] Uploading file to storage: ${filePath}`);
    const { error: uploadErr } = await supabase.storage
      .from("resources_files") // Use a dedicated bucket for resources
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
      return; // Only delete files from our Supabase storage
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

  const onAddSubmit = async (data: ResourceFormData) => {
    if (!validateAddForm(data)) return;
    if (!user) {
      showError("You must be logged in to add resources.");
      console.error("[Resources Page] Attempted to add resource without a user.");
      return;
    }
    if (!user.is_admin) {
      showError("Only administrators can add resources.");
      return;
    }

    setIsUploading(true);
    let resourceUrl = data.url || null;

    try {
      if (selectedFile) {
        resourceUrl = await uploadFileToStorage(selectedFile, user.id);
      }

      console.log(`[Resources Page] Inserting new resource for user ${user.id}:`, { title: data.title, url: resourceUrl });
      const { error } = await supabase.from("resources").insert({
        user_id: user.id,
        title: data.title,
        description: data.description,
        url: resourceUrl,
      });

      if (error) {
        console.error("[Resources Page] Error adding resource:", error);
        showError("Failed to add resource: " + error.message);
      } else {
        showSuccess("Resource added successfully!");
        addForm.reset();
        setSelectedFile(null);
        setIsAddDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ['resources'] });
        console.log("[Resources Page] Resource added and list refreshed.");
      }
    } catch (error: any) {
      console.error("[Resources Page] Error during add resource process:", error);
      showError("Failed to add resource: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const onEditSubmit = async (data: ResourceFormData) => {
    if (!validateEditForm(data)) return;
    if (!user || !editingResource) {
      showError("You must be logged in and select a resource to edit.");
      console.error("[Resources Page] Attempted to edit resource without user or selected resource.");
      return;
    }
    if (!user.is_admin) {
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
        if (editingResource.url) { // If there was an old file, delete it first
          await deleteFileFromStorage(editingResource.url);
        }
        newResourceUrl = await uploadFileToStorage(selectedFile, user.id);
      } else if (!removeFileRequested) { // If no new file and not removing, use form URL
        newResourceUrl = data.url || null;
      }

      console.log(`[Resources Page] Updating resource ${editingResource.id} for user ${user.id}:`, { title: data.title, url: newResourceUrl });
      const { error } = await supabase
        .from("resources")
        .update({
          title: data.title,
          description: data.description,
          url: newResourceUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingResource.id); // RLS will handle user_id check for admins

      if (error) {
        console.error("[Resources Page] Error updating resource:", error);
        showError("Failed to update resource: " + error.message);
      } else {
        showSuccess("Resource updated successfully!");
        setIsEditDialogOpen(false);
        setEditingResource(null);
        setSelectedFile(null);
        setRemoveFileRequested(false);
        queryClient.invalidateQueries({ queryKey: ['resources'] });
        console.log("[Resources Page] Resource updated and list refreshed.");
      }
    } catch (error: any) {
      console.error("[Resources Page] Error during edit resource process:", error);
      showError("Failed to update resource: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (resourceId: string, resourceUrl: string) => {
    console.log("[Resources Page] Delete requested for resource ID:", resourceId);
    if (!user) {
      showError("You must be logged in to delete resources.");
      console.error("[Resources Page] Attempted to delete resource without a user.");
      return;
    }
    if (!user.is_admin) {
      showError("Only administrators can delete resources.");
      return;
    }

    setIsUploading(true); // Use this for general operation loading
    try {
      if (resourceUrl) {
        await deleteFileFromStorage(resourceUrl);
      }

      console.log(`[Resources Page] Deleting resource ${resourceId} for user ${user.id}.`);
      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", resourceId); // RLS will handle user_id check for admins

      if (error) {
        console.error("[Resources Page] Error deleting resource:", error);
        showError("Failed to delete resource: " + error.message);
      } else {
        showSuccess("Resource deleted successfully!");
        queryClient.invalidateQueries({ queryKey: ['resources'] });
        console.log("[Resources Page] Resource deleted and list refreshed.");
      }
    } catch (error: any) {
      console.error("[Resources Page] Error during delete resource process:", error);
      showError("Failed to delete resource: " + error.message);
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

  // Determine if skeleton should be shown: only if loading AND no data is available
  const showSkeleton = isLoading && !resources;

  console.log("[Resources Page] Rendering Resources component. isLoading:", isLoading, "isFetching:", isFetching, "Resources count:", resources?.length);

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

      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
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
        {user?.is_admin && ( // Only show add button for admins
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
              <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" {...addForm.register("title")} disabled={isUploading} />
                  {addForm.formState.errors.title && (
                    <p className="text-red-500 text-sm">{addForm.formState.errors.title.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea id="description" {...addForm.register("description")} disabled={isUploading} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">External URL (Optional)</Label>
                  <Input id="url" type="url" {...addForm.register("url")} placeholder="https://example.com/resource.pdf" disabled={isUploading || !!selectedFile} />
                  {addForm.formState.errors.url && (
                    <p className="text-red-500 text-sm">{addForm.formState.errors.url.message}</p>
                  )}
                  {selectedFile && <p className="text-sm text-muted-foreground">URL field disabled because a file is selected.</p>}
                </div>
                <ResourceUpload
                  selectedFile={selectedFile}
                  onFileChange={setSelectedFile}
                  onRemoveRequested={() => {}} // Not applicable for add form
                  currentFileUrl={null}
                  isSaving={isUploading}
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
        ) : (
          <p className="text-md text-muted-foreground">Log in as an admin to add new resources.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {showSkeleton ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="shadow-lg rounded-xl">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : resources && resources.length === 0 ? (
          <div className="col-span-full text-center p-8 bg-card rounded-xl shadow-lg flex flex-col items-center justify-center space-y-4">
            <FileText className="h-16 w-16 text-muted-foreground" />
            <p className="text-xl text-muted-foreground font-semibold font-lora">No resources found yet!</p>
            <p className="text-md text-muted-foreground mt-2">
              {user?.is_admin
                ? "Be the first to add one using the 'Add New Resource' button above!"
                : "Log in as an admin to add and access choir resources."}
            </p>
            {!user?.is_admin && (
              <Button asChild className="mt-4">
                <Link to="/login">Login as Admin to Add Resources</Link>
              </Button>
            )}
          </div>
        ) : (
          resources?.map((resource) => (
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
                {user?.is_admin && ( // Only show edit/delete for admins
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingResource(resource);
                        setIsEditDialogOpen(true);
                        console.log("[Resources Page] Editing resource:", resource.id);
                      }}
                      disabled={isUploading}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Edit
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
                          <AlertDialogAction onClick={() => handleDelete(resource.id, resource.url)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {editingResource && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-lora">Edit Resource</DialogTitle>
              <CardDescription>Update the details for your choir resource.</CardDescription>
            </DialogHeader>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" {...editForm.register("title")} disabled={isUploading} />
                {editForm.formState.errors.title && (
                  <p className="text-red-500 text-sm">{editForm.formState.errors.title.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea id="edit-description" {...editForm.register("description")} disabled={isUploading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-url">External URL (Optional)</Label>
                <Input
                  id="edit-url"
                  type="url"
                  {...editForm.register("url")}
                  disabled={isUploading || !!selectedFile || removeFileRequested}
                  placeholder="https://example.com/resource.pdf"
                />
                {editForm.formState.errors.url && (
                  <p className="text-red-500 text-sm">{editForm.formState.errors.url.message}</p>
                )}
                {(!!selectedFile || removeFileRequested) && <p className="text-sm text-muted-foreground">URL field disabled due to file selection or removal request.</p>}
              </div>
              <ResourceUpload
                selectedFile={selectedFile}
                onFileChange={setSelectedFile}
                onRemoveRequested={setRemoveFileRequested}
                currentFileUrl={editingResource.url}
                isSaving={isUploading}
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
    </div>
  );
};

export default Resources;