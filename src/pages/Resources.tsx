"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Link as LinkIcon, FileText, Loader2 } from "lucide-react";
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
    fetchResources();
  }, []);

  useEffect(() => {
    if (editingResource) {
      editForm.reset({
        title: editingResource.title,
        description: editingResource.description || "",
        url: editingResource.url,
      });
    }
  }, [editingResource, editForm]);

  const fetchResources = async () => {
    setLoadingResources(true);
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching resources:", error);
      showError("Failed to load resources.");
    } else {
      setResources(data || []);
    }
    setLoadingResources(false);
  };

  const onAddSubmit = async (data: ResourceFormData) => {
    if (!user || !user.is_admin) { // Check for admin status
      showError("Only administrators can add resources.");
      return;
    }

    const { title, description, url } = data;
    const { error } = await supabase.from("resources").insert({
      user_id: user.id,
      title,
      description,
      url,
    });

    if (error) {
      console.error("Error adding resource:", error);
      showError("Failed to add resource.");
    } else {
      showSuccess("Resource added successfully!");
      addForm.reset();
      setIsAddDialogOpen(false);
      fetchResources();
    }
  };

  const onEditSubmit = async (data: ResourceFormData) => {
    if (!user || !user.is_admin || !editingResource) { // Check for admin status
      showError("Only administrators can edit resources.");
      return;
    }

    const { title, description, url } = data;
    const { error } = await supabase
      .from("resources")
      .update({
        title,
        description,
        url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingResource.id); // Admin can update any resource, no user_id check needed here due to RLS

    if (error) {
      console.error("Error updating resource:", error);
      showError("Failed to update resource.");
    } else {
      showSuccess("Resource updated successfully!");
      setIsEditDialogOpen(false);
      setEditingResource(null);
      fetchResources();
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!user || !user.is_admin) { // Check for admin status
      showError("Only administrators can delete resources.");
      return;
    }

    const { error } = await supabase
      .from("resources")
      .delete()
      .eq("id", resourceId); // Admin can delete any resource, no user_id check needed here due to RLS

    if (error) {
      console.error("Error deleting resource:", error);
      showError("Failed to delete resource.");
    } else {
      showSuccess("Resource deleted successfully!");
      fetchResources();
    }
  };

  return (
    <div className="space-y-6 py-8 animate-fade-in-up">
      {loadingResources ? (
        <div className="text-center">
          <Skeleton className="h-10 w-3/4 mx-auto mb-4" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
        </div>
      ) : (
        <>
          <h1 className="text-4xl font-bold text-center font-lora">Choir Resources</h1>
          <p className="text-lg text-center text-muted-foreground">
            This is where you'll find all the sheet music, practice tracks, and other materials I've prepared for the choir.
          </p>
        </>
      )}

      <div className="flex justify-center">
        {loadingResources ? (
          <Skeleton className="h-10 w-48" />
        ) : user?.is_admin ? ( // Only show add button if user is admin
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
        ) : (
          user ? (
            <p className="text-md text-muted-foreground">Only administrators can add new resources.</p>
          ) : (
            <p className="text-md text-muted-foreground">Log in to view and access choir resources.</p>
          )
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {loadingResources ? (
          // Render skeleton cards when loading
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
          <div className="col-span-full text-center p-8 bg-card rounded-xl shadow-lg flex flex-col items-center justify-center space-y-4">
            <FileText className="h-16 w-16 text-muted-foreground" />
            <p className="text-xl text-muted-foreground font-semibold font-lora">No resources found yet!</p>
            <p className="text-md text-muted-foreground mt-2">
              {user?.is_admin
                ? "Be the first to add one using the 'Add New Resource' button above!"
                : "Check back soon for new resources!"}
            </p>
            {!user && (
              <Button asChild className="mt-4">
                <Link to="/login">Login to View Resources</Link>
              </Button>
            )}
            {user?.is_admin && (
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
        ) : (
          resources.map((resource) => (
            <Card key={resource.id} className="shadow-lg rounded-xl transition-all duration-200 hover:shadow-xl hover:scale-[1.01]">
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
                {user?.is_admin && ( // Only show edit/delete if user is admin
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingResource(resource);
                        setIsEditDialogOpen(true);
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

      {/* Edit Resource Dialog */}
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