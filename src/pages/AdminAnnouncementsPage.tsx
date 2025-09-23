"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, PlusCircle, Edit, Trash2, BellRing, AlertCircle } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Define the schema for an announcement
const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

interface Announcement {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const AdminAnnouncementsPage: React.FC = () => {
  const { user, loading: loadingSession } = useSession();
  const navigate = useNavigate();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loadingSession && (!user || !user.is_admin)) {
      navigate("/");
      showError("Access Denied: You must be an administrator to view this page.");
    }
  }, [user, loadingSession, navigate]);

  const addForm = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const editForm = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  // Query function for fetching announcements
  const fetchAnnouncements = async (): Promise<Announcement[]> => {
    console.log("[AdminAnnouncementsPage] Fetching all announcements.");
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching announcements:", error);
      throw new Error("Failed to load announcements.");
    }
    console.log("[AdminAnnouncementsPage] Announcements fetched successfully:", data?.length, "announcements.");
    return data || [];
  };

  // Use react-query for announcements data
  const { data: announcements, isLoading: loadingAnnouncements, error: fetchError } = useQuery<
    Announcement[],
    Error,
    Announcement[],
    ['adminAnnouncements']
  >({
    queryKey: ['adminAnnouncements'],
    queryFn: fetchAnnouncements,
    enabled: !loadingSession && !!user?.is_admin, // Only fetch if session is not loading and user is admin
    staleTime: 60 * 1000, // Data is considered fresh for 1 minute
    gcTime: 5 * 60 * 1000, // Data stays in cache for 5 minutes
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (editingAnnouncement) {
      editForm.reset({
        title: editingAnnouncement.title,
        content: editingAnnouncement.content,
      });
    }
  }, [editingAnnouncement, editForm]);

  const onAddSubmit = async (data: AnnouncementFormData) => {
    if (!user) {
      showError("You must be logged in to add announcements.");
      return;
    }

    const { title, content } = data;
    const { error } = await supabase.from("announcements").insert({
      user_id: user.id,
      title,
      content,
    });

    if (error) {
      console.error("Error adding announcement:", error);
      showError("Failed to add announcement: " + error.message);
    } else {
      showSuccess("Announcement added successfully!");
      addForm.reset();
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['adminAnnouncements'] }); // Invalidate to refetch and update UI
      queryClient.invalidateQueries({ queryKey: ['latestAnnouncements'] }); // Invalidate the public announcements list
    }
  };

  const onEditSubmit = async (data: AnnouncementFormData) => {
    if (!user || !editingAnnouncement) {
      showError("You must be logged in and select an announcement to edit.");
      return;
    }

    const { title, content } = data;
    const { error } = await supabase
      .from("announcements")
      .update({
        title,
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingAnnouncement.id); // RLS handles user_id check

    if (error) {
      console.error("Error updating announcement:", error);
      showError("Failed to update announcement: " + error.message);
    } else {
      showSuccess("Announcement updated successfully!");
      setIsEditDialogOpen(false);
      setEditingAnnouncement(null);
      queryClient.invalidateQueries({ queryKey: ['adminAnnouncements'] }); // Invalidate to refetch and update UI
      queryClient.invalidateQueries({ queryKey: ['latestAnnouncements'] }); // Invalidate the public announcements list
    }
  };

  const handleDelete = async (announcementId: string) => {
    if (!user) {
      showError("You must be logged in to delete announcements.");
      return;
    }

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcementId); // RLS handles user_id check

    if (error) {
      console.error("Error deleting announcement:", error);
      showError("Failed to delete announcement: " + error.message);
    } else {
      showSuccess("Announcement deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['adminAnnouncements'] }); // Invalidate to refetch and update UI
      queryClient.invalidateQueries({ queryKey: ['latestAnnouncements'] }); // Invalidate the public announcements list
    }
  };

  if (loadingAnnouncements) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl p-6 shadow-lg rounded-xl">
          <CardHeader>
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-5 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-2 border-b last:border-b-0">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-6 w-1/6 ml-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return null; // Redirect handled by useEffect
  }

  if (fetchError) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl p-6 shadow-lg rounded-xl text-center">
          <CardTitle className="text-2xl font-lora text-destructive">Error Loading Data</CardTitle>
          <CardDescription className="text-muted-foreground">{fetchError.message}</CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8 px-4">
      <h1 className="text-4xl font-bold text-center font-lora">Manage Announcements</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
        Create, edit, and delete important announcements for your choir members.
      </p>

      <div className="flex justify-center mb-6">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-lora">Create New Announcement</DialogTitle>
              <CardDescription>Write a new message to share with the choir.</CardDescription>
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
                <Label htmlFor="content">Content</Label>
                <Textarea id="content" {...addForm.register("content")} className="min-h-[100px]" />
                {addForm.formState.errors.content && (
                  <p className="text-red-500 text-sm">{addForm.formState.errors.content.message}</p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={addForm.formState.isSubmitting}>
                  {addForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...
                    </>
                  ) : (
                    "Publish Announcement"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="w-full max-w-4xl mx-auto p-6 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-lora">All Announcements</CardTitle>
          <CardDescription>Overview of all published announcements.</CardDescription>
        </CardHeader>
        <CardContent>
          {announcements && announcements.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-xl font-semibold">No announcements found yet.</p>
              <p className="mt-2">Click "Create New Announcement" to publish your first message.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Published On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements?.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell className="font-medium">{announcement.title}</TableCell>
                      <TableCell className="text-muted-foreground line-clamp-2 max-w-xs">
                        {announcement.content}
                      </TableCell>
                      <TableCell>{format(new Date(announcement.created_at), "PPP")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingAnnouncement(announcement);
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
                                  This action cannot be undone. This will permanently delete the announcement "{announcement.title}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(announcement.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingAnnouncement && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-lora">Edit Announcement</DialogTitle>
              <CardDescription>Update the details of your announcement.</CardDescription>
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
                <Label htmlFor="edit-content">Content</Label>
                <Textarea id="edit-content" {...editForm.register("content")} className="min-h-[100px]" />
                {editForm.formState.errors.content && (
                  <p className="text-red-500 text-sm">{editForm.formState.errors.content.message}</p>
                )}
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

export default AdminAnnouncementsPage;