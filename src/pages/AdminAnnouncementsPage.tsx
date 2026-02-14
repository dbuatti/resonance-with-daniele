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
      <h1 className="text-4xl font-bold text-center font-lora">Manage Announcements</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
        Create, edit, and delete important announcements for your choir members.
      </p>

      <div className="flex justify-center mb-6">
        <Button onClick={() => { setEditingAnnouncement(null); setIsDialogOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Announcement
        </Button>
      </div>

      <Card className="w-full max-w-4xl mx-auto p-6 shadow-lg rounded-xl">
        <CardHeader><CardTitle className="text-2xl font-lora">All Announcements</CardTitle></CardHeader>
        <CardContent>
          {announcements && announcements.length === 0 ? (
            <div className="text-center text-muted-foreground py-8"><p className="text-xl font-semibold">No announcements found yet.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Title</TableHead><TableHead>Content</TableHead><TableHead>Link</TableHead><TableHead>Published On</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {announcements?.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell className="font-medium">{announcement.title}</TableCell>
                      <TableCell className="text-muted-foreground line-clamp-2 max-w-xs">{announcement.content}</TableCell>
                      <TableCell>
                        {announcement.link_url ? (
                          <a href={announcement.link_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            <ExternalLink className="h-4 w-4" /> View Link
                          </a>
                        ) : "N/A"}
                      </TableCell>
                      <TableCell>{format(new Date(announcement.created_at), "PPP")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setEditingAnnouncement(announcement); setIsDialogOpen(true); }}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-2" /> Delete</Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(announcement.id)}>Delete</AlertDialogAction></AlertDialogFooter>
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