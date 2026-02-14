"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, ExternalLink } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AnnouncementDialog from "@/components/admin/AnnouncementDialog";
import BackButton from "@/components/ui/BackButton";

interface Announcement {
  id: string;
  user_id: string;
  title: string;
  content: string;
  link_url: string | null;
  created_at: string;
  updated_at: string;
}

const AdminAnnouncementsPage: React.FC = () => {
  const { user, loading: loadingSession } = useSession();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loadingSession && (!user || !user.is_admin)) {
      navigate("/");
      showError("Access Denied: You must be an administrator to view this page.");
    }
  }, [user, loadingSession, navigate]);

  const fetchAnnouncements = async (): Promise<Announcement[]> => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error("Failed to load announcements.");
    return data || [];
  };

  const { data: announcements, isLoading: loadingAnnouncements, error: fetchError } = useQuery<Announcement[], Error>({
    queryKey: ['adminAnnouncements'],
    queryFn: fetchAnnouncements,
    enabled: !loadingSession && !!user?.is_admin,
    staleTime: 60 * 1000,
  });

  const handleDelete = async (announcementId: string) => {
    if (!user) return;
    const { error } = await supabase.from("announcements").delete().eq("id", announcementId);
    if (error) {
      showError(`Failed to delete announcement: ${error.message}`);
    } else {
      showSuccess("Announcement deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['adminAnnouncements'] });
      queryClient.invalidateQueries({ queryKey: ['latestAnnouncements'] });
    }
  };

  if (loadingAnnouncements) return <div className="p-8"><Skeleton className="h-10 w-full" /></div>;
  if (!user || !user.is_admin) return null;

  return (
    <div className="space-y-6 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <BackButton className="mb-6" to="/admin" />
        
        <header className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold text-center font-lora">Manage Announcements</h1>
          <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
            Create, edit, and delete important announcements for your choir members.
          </p>
        </header>

        <div className="flex justify-center mb-12">
          <Button size="lg" onClick={() => { setEditingAnnouncement(null); setIsDialogOpen(true); }} className="rounded-xl font-bold">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Announcement
          </Button>
        </div>

        <Card className="w-full max-w-4xl mx-auto shadow-xl border-none overflow-hidden rounded-2xl">
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <CardTitle className="text-2xl font-lora">All Announcements</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {announcements && announcements.length === 0 ? (
              <div className="text-center text-muted-foreground py-20">
                <p className="text-xl font-semibold">No announcements found yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow>
                      <TableHead className="pl-6 py-4">Title</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Link</TableHead>
                      <TableHead>Published On</TableHead>
                      <TableHead className="text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {announcements?.map((announcement) => (
                      <TableRow key={announcement.id} className="hover:bg-muted/10 transition-colors">
                        <TableCell className="pl-6 py-4 font-bold">{announcement.title}</TableCell>
                        <TableCell className="text-muted-foreground line-clamp-2 max-w-xs">{announcement.content}</TableCell>
                        <TableCell>
                          {announcement.link_url ? (
                            <a href={announcement.link_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                              <ExternalLink className="h-4 w-4" /> View Link
                            </a>
                          ) : "N/A"}
                        </TableCell>
                        <TableCell>{format(new Date(announcement.created_at), "PPP")}</TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingAnnouncement(announcement); setIsDialogOpen(true); }} className="h-8 px-3 text-xs font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary">
                              <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
                                  <AlertDialogDescription>This action cannot be undone. This will permanently remove the announcement.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(announcement.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
      </div>

      <AnnouncementDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        editingAnnouncement={editingAnnouncement} 
        userId={user.id} 
      />
    </div>
  );
};

export default AdminAnnouncementsPage;