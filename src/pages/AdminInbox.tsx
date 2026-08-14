"use client";

import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import AdminWorkbenchShell from "@/components/admin/AdminWorkbenchShell";
import AnnouncementDialog from "@/components/admin/AnnouncementDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Edit, Trash2, ExternalLink, CheckCircle2, EyeOff, MessageSquare, Megaphone } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  user_id: string;
  title: string;
  content: string;
  link_url: string | null;
  created_at: string;
  updated_at: string;
}

interface IssueReport {
  id: string;
  user_id: string | null;
  email: string;
  issue_description: string;
  page_url: string | null;
  created_at: string;
  is_read: boolean;
}

const AdminInbox: React.FC = () => {
  const { user } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "announcements";
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: announcements, isLoading: loadingAnnouncements } = useQuery<Announcement[]>({
    queryKey: ['adminAnnouncements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.is_admin,
  });

  const { data: reports, isLoading: loadingReports } = useQuery<IssueReport[]>({
    queryKey: ['adminIssueReports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issue_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.is_admin,
  });

  const handleDeleteAnnouncement = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) showError(error.message);
    else {
      showSuccess("Announcement deleted.");
      queryClient.invalidateQueries({ queryKey: ['adminAnnouncements'] });
      queryClient.invalidateQueries({ queryKey: ['latestAnnouncements'] });
    }
    setDeletingId(null);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setIsDialogOpen(true);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from("issue_reports").update({ is_read: true }).eq("id", id);
    if (error) showError(error.message);
    else queryClient.invalidateQueries({ queryKey: ['adminIssueReports'] });
  };

  const handleDeleteReport = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("issue_reports").delete().eq("id", id);
    if (error) showError(error.message);
    else {
      showSuccess("Report removed.");
      queryClient.invalidateQueries({ queryKey: ['adminIssueReports'] });
    }
    setDeletingId(null);
  };

  const unreadCount = reports?.filter((r) => !r.is_read).length || 0;

  const setTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    if (tab === "announcements") next.delete("tab");
    else next.set("tab", tab);
    setSearchParams(next, { replace: true });
  };

  return (
    <AdminWorkbenchShell
      title="Inbox"
      description="Announcements and support requests from the community."
      badge="Inbox"
      actions={
        activeTab === "announcements" ? (
          <Button onClick={() => { setEditingAnnouncement(null); setIsDialogOpen(true); }} className="h-12 px-5 rounded-xl font-black shadow-lg">
            <PlusCircle className="mr-2 h-4 w-4" /> New Announcement
          </Button>
        ) : (
          unreadCount > 0 && (
            <Badge className="bg-primary text-primary-foreground px-4 py-2 rounded-full font-black text-xs">
              {unreadCount} unread
            </Badge>
          )
        )
      }
    >
      <Tabs value={activeTab} onValueChange={setTab} className="space-y-8">
        <TabsList className="bg-muted/50 p-1 rounded-2xl h-14 w-full flex overflow-x-auto no-scrollbar">
          <TabsTrigger value="announcements" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"><Megaphone className="h-4 w-4 mr-2 shrink-0" /> Announcements</TabsTrigger>
          <TabsTrigger value="issue-reports" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <MessageSquare className="h-4 w-4 mr-2 shrink-0" /> Issue Reports
            {unreadCount > 0 && <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-destructive-foreground">{unreadCount}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="space-y-6">
          {loadingAnnouncements ? null : (
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
                                    <AlertDialogAction onClick={() => handleDeleteAnnouncement(a.id)} className="rounded-xl font-bold bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
                    <Megaphone className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-10" />
                    <p className="text-xl font-bold text-muted-foreground font-lora">No announcements yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="issue-reports" className="space-y-6">
          {loadingReports ? null : (
            <Card className="w-full soft-shadow border-none overflow-hidden rounded-[2.5rem]">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="pl-10 py-6 text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Email</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Issue</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Page</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                        <TableHead className="text-right pr-10 text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports?.map((report) => (
                        <TableRow key={report.id} className={cn("hover:bg-muted/10 transition-colors", !report.is_read && "bg-primary/[0.02]")}>
                          <TableCell className="pl-10 py-5">
                            <Badge variant={report.is_read ? "secondary" : "default"} className="rounded-full text-[9px] font-black uppercase tracking-widest">
                              {report.is_read ? "Read" : "New"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{report.email}</TableCell>
                          <TableCell className="max-w-md">
                            <p className="line-clamp-2 text-sm font-medium text-muted-foreground">
                              {report.issue_description}
                            </p>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-muted-foreground">
                            {report.page_url ? (
                              <a href={report.page_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {(() => { try { return new URL(report.page_url).pathname; } catch { return report.page_url; } })()}
                              </a>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="font-medium text-muted-foreground">
                            {format(new Date(report.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right pr-10">
                            <div className="flex items-center justify-end gap-1">
                              {!report.is_read && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-green-600 hover:bg-green-500/10" onClick={() => markAsRead(report.id)}>
                                      <EyeOff className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Mark as read</TooltipContent>
                                </Tooltip>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10" disabled={deletingId === report.id}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-[2.5rem]">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Report?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently remove this report.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteReport(report.id)} className="rounded-xl font-bold bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
                {(!reports || reports.length === 0) && (
                  <div className="py-20 text-center">
                    <CheckCircle2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-10" />
                    <p className="text-xl font-bold text-muted-foreground font-lora">No issue reports yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {user && (
        <AnnouncementDialog
          isOpen={isDialogOpen}
          onClose={() => { setIsDialogOpen(false); setEditingAnnouncement(null); }}
          editingAnnouncement={editingAnnouncement}
          userId={user.id}
        />
      )}
    </AdminWorkbenchShell>
  );
};

export default AdminInbox;