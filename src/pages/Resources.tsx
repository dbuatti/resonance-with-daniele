"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Link as LinkIcon, FileText, Loader2, Search } from "lucide-react";
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

// Define the schema for a resource
const resourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  url: z.string().url("Must be a valid URL").min(1, "URL is required"),
});

type ResourceFormData = z.infer<typeof resourceSchema>;

interface Resource {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  url: string;
  created_at: string;
}

const Resources: React.FC = () => {
  const { user, loading: loadingUserSession } = useSession();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  useEffect(() => {
    console.log("[Resources Page] useEffect: Initial fetch resources or search term changed.");
    const debounceTimeout = setTimeout(() => {
      fetchResources(searchTerm);
    }, 300); // Debounce search to avoid too many requests

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, user]);

  useEffect(() => {
    if (editingResource) {
      console.log("[Resources Page] useEffect: Setting edit form defaults for resource:", editingResource.id);
      editForm.reset({
        title: editingResource.title,
        description: editingResource.description || "",
        url: editingResource.url,
      });
    }
  }, [editingResource, editForm]);

  const fetchResources = async (currentSearchTerm: string) => {
    setLoadingResources(true);
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
      showError("Failed to load resources.");
    } else {
      setResources(data || []);
      console.log("[Resources Page] Resources fetched successfully:", data?.length, "resources.");
    }
    setLoadingResources(false);
    console.log("[Resources Page] Resources loading state set to false.");
  };

  const onAddSubmit = async (data: ResourceFormData) => {
    console.log("[Resources Page] Add form submitted. Data:", data);
    if (!user) {
      showError("You must be logged in to add resources.");
      console.error("[Resources Page] Attempted to add resource without a user.");
      return;
    }

    const { title, description, url } = data;
    console.log(`[Resources Page] Inserting new resource for user ${user.id}:`, { title, url });
    const { error } = await supabase.from("resources").insert({
      user_id: user.id,
      title,
      description,
      url,
    });

    if (error) {
      console.error("[Resources Page] Error adding resource:", error);
      showError("Failed to add resource.");
    } else {
      showSuccess("Resource added successfully!");
      addForm.reset();
      setIsAddDialogOpen(false);
      fetchResources(searchTerm);
      console.log("[Resources Page] Resource added and list refreshed.");
    }
  };

  const onEditSubmit = async (data: ResourceFormData) => {
    console.log("[Resources Page] Edit form submitted. Data:", data, "Editing Resource ID:", editingResource?.id);
    if (!user || !editingResource) {
      showError("You must be logged in and select a resource to edit.");
      console.error("[Resources Page] Attempted to edit resource without user or selected resource.");
      return;
    }

    const { title, description, url } = data;
    console.log(`[Resources Page] Updating resource ${editingResource.id} for user ${user.id}:`, { title, url });
    const { error } = await supabase
      .from("resources")
      .update({
        title,
        description,
        url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingResource.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[Resources Page] Error updating resource:", error);
      showError("Failed to update resource.");
    } else {
      showSuccess("Resource updated successfully!");
      setIsEditDialogOpen(false);
      setEditingResource(null);
      fetchResources(searchTerm);
      console.log("[Resources Page] Resource updated and list refreshed.");
    }
  };

  const handleDelete = async (resourceId: string) => {
    console.log("[Resources Page] Delete requested for resource ID:", resourceId);
    if (!user) {
      showError("You must be logged in to delete resources.");
      console.error("[Resources Page] Attempted to delete resource without a user.");
      return;
    }

    console.log(`[Resources Page] Deleting resource ${resourceId} for user ${user.id}.`);
    const { error } = await supabase
      .from("resources")
      .delete()
      .eq("id", resourceId)
      .eq("user_id", user.id);

    if (error) {
      console.error("[Resources Page] Error deleting resource:", error);
      showError("Failed to delete resource.");
    } else {
      showSuccess("Resource deleted successfully!");
      fetchResources(searchTerm);
      console.log("[Resources Page] Resource deleted and list refreshed.");
    }
  };

  console.log("[Resources Page] Rendering Resources component. Loading Resources:", loadingResources, "Resources count:", resources.length);

  return (
    <div className="space-y-6 py-8"> {/* Removed container mx-auto */}
      <h1 className="text-4xl font-bold text-center font-lora">
        {loadingResources ? <Skeleton className="h-10 w-3/4 mx-auto" /> : "Choir Resources"}
      </h1>
      {loadingResources ? (
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
            disabled={loadingResources}
          />
        </div>
        {user ? (
          <>
            {console.log("[Resources Page] User is logged in, showing 'Add New Resource' button.")}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
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
                    <Input id="title" {...addForm.register("title")} />
                    {addForm.formState.errors.title && (
                      <p className="text-red-500 text-sm">{addForm.formState.errors.title.message}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="url">URL</Label>
                    <Input id="url" type="url" {...addForm.register("url")} placeholder="https://example.com/resource.pdf" />
                    {addForm.formState.errors.url && (
                      <p className="text-red-500 text-sm">{addForm.formState.errors.url.message}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea id="description" {...addForm.register("description")} />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={addForm.formState.isSubmitting}>
                      {addForm.formState.isSubmitting ? (
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
          <>
            {console.log("[Resources Page] User is NOT logged in, showing 'Log in to add resources' message.")}
            <p className="text-md text-muted-foreground">Log in to add new resources.</p>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {loadingResources ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="shadow-lg rounded-xl">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
          ))
        ) : resources.length === 0 ? (
          <>
            {console.log("[Resources Page] No resources found, displaying empty state.")}
            <div className="col-span-full text-center p-8 bg-card rounded-xl shadow-lg flex flex-col items-center justify-center space-y-4">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <p className="text-xl text-muted-foreground font-semibold font-lora">No resources found yet!</p>
              <p className="text-md text-muted-foreground mt-2">
                {user
                  ? "Be the first to add one using the 'Add New Resource' button above!"
                  : "Log in to add and access choir resources."}
              </p>
              {!user && (
                <Button asChild className="mt-4">
                  <Link to="/login">Login to Add Resources</Link>
                </Button>
              )}
              {user && (
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-4">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Resource
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
                        <Input id="title" {...addForm.register("title")} />
                        {addForm.formState.errors.title && (
                          <p className="text-red-500 text-sm">{addForm.formState.errors.title.message}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="url">URL</Label>
                        <Input id="url" type="url" {...addForm.register("url")} placeholder="https://example.com/resource.pdf" />
                        {addForm.formState.errors.url && (
                          <p className="text-red-500 text-sm">{addForm.formState.errors.url.message}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea id="description" {...addForm.register("description")} />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={addForm.formState.isSubmitting}>
                          {addForm.formState.isSubmitting ? (
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
              )}
            </div>
          </>
        ) : (
          resources.map((resource) => (
            <Card key={resource.id} className="shadow-lg rounded-xl hover:shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-medium font-lora">
                  {resource.title}
                </CardTitle>
                <FileText className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                {resource.description && <p className="text-sm text-muted-foreground">{resource.description}</p>}
                <Button asChild className="w-full">
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    <LinkIcon className="mr-2 h-4 w-4" /> View Resource
                  </a>
                </Button>
                {user && user.id === resource.user_id && (
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingResource(resource);
                        setIsEditDialogOpen(true);
                        console.log("[Resources Page] Editing resource:", resource.id);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your resource.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(resource.id)}>
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
                <Input id="edit-title" {...editForm.register("title")} />
                {editForm.formState.errors.title && (
                  <p className="text-red-500 text-sm">{editForm.formState.errors.title.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-url">URL</Label>
                <Input id="edit-url" type="url" {...editForm.register("url")} />
                {editForm.formState.errors.url && (
                  <p className="text-red-500 text-sm">{editForm.formState.errors.url.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea id="edit-description" {...editForm.register("description")} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={editForm.formState.isSubmitting}>
                  {editForm.formState.isSubmitting ? (
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