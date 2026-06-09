"use client";

import React, { useState } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, ExternalLink } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AnnouncementDialog from "@/components/admin/AnnouncementDialog";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import { Badge } from "@/components/ui/badge";

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
  const { user } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const fetchAnnouncements = async (): Promise<Announcement[]> => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  };

  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ['adminAnnouncements'],
    queryFn: fetchAnnouncements,
    enabled: !!user?.is_admin,
  });

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) showError(error.message);
    else {
      showSuccess("Announcement deleted.");
      queryClient.invalidateQueries({ queryKey: ['adminAnnouncements'] });
    }
    setDeletingId(null);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setIsDialogOpen(true);
  };

  return (
    <AdminPageLayout
      title="Announcements"
      description="Keep the circle informed. Create and manage updates that appear on member dashboards."
      badge="Updates"
      backTo="/admin"
      isLoading={isLoading}
      actions={
        <Button onClick={() => { setEditingAnnouncement(null); setIsDialogOpen(true); }} className="h-12 px-5 rounded-xl font-black shadow-lg">
          <PlusCircle className="mr-2 h-4 w-4" /> New Announcement
        </Button>
      }
    >
      <Card className="w-full soft-shadow border-none overflow-hidden rounded-[2.5rem]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="pl-10 py-6 text-[10px] font-black uppercase tracking-widest">Title</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Preview</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Link</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Created</TableHead>
                  <TableHead className="text-right pr-10 text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements?.map((a) => (
                  <TableRow key={a.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="pl-10 py-5 font-black font-lora">{a.title}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate font-medium">
                      {a.content}
                    </TableCell>
                    <TableCell>
                      {a.link_url ? (
                        <a href={a.link_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 font-medium text-sm">
                          <ExternalLink className="h-3 w-3" /> Link
                        </a>
                      ) : (
                        <span className="text-muted-foreground/50 font-medium">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-muted-foreground">
                      {format(new Date(a.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleEdit(a)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10" disabled={deletingId === a.id}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[2.5rem]">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove "{a.title}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(a.id)} className="rounded-xl font-bold bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
          {(!announcements || announcements.length === 0) && (
            <div className="py-20 text-center">
              <p className="text-xl font-bold text-muted-foreground font-lora">No announcements yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AnnouncementDialog
        isOpen={isDialogOpen}
        onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingAnnouncement(null); }}
        announcement={editingAnnouncement}
      />
    </AdminPageLayout>
  );
};

export default AdminAnnouncementsPage;
