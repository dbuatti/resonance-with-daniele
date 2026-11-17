"use client";

import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import AdminWorkbenchShell from "@/components/admin/AdminWorkbenchShell";
import AnnouncementDialog from "@/components/admin/AnnouncementDialog";
import FeedbackCenterPanel from "@/components/admin/FeedbackCenterPanel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Edit, Trash2, ExternalLink, CheckCircle2, EyeOff, MessageSquare, Megaphone, MessageSquareQuote } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import OverflowMenu from "@/components/ui/overflow-menu";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import EmptyState from "@/components/ui/empty-state";
import Section from "@/components/ui/section";

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
  const [deleteTarget, setDeleteTarget] = useState<{ type: "announcement" | "report"; id: string; label: string } | null>(null);

  const { data: announcements } = useQuery<Announcement[]>({
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

  const { data: reports } = useQuery<IssueReport[]>({
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

  const handleDeleteAnnouncement = async () => {
    if (!deleteTarget || deleteTarget.type !== "announcement") return;
    setDeletingId(deleteTarget.id);
    const { error } = await supabase.from("announcements").delete().eq("id", deleteTarget.id);
    if (error) showError(error.message);
    else {
      showSuccess("Announcement deleted.");
      queryClient.invalidateQueries({ queryKey: ['adminAnnouncements'] });
      queryClient.invalidateQueries({ queryKey: ['latestAnnouncements'] });
    }
    setDeletingId(null);
    setDeleteTarget(null);
  };

  const handleDeleteReport = async () => {
    if (!deleteTarget || deleteTarget.type !== "report") return;
    setDeletingId(deleteTarget.id);
    const { error } = await supabase.from("issue_reports").delete().eq("id", deleteTarget.id);
    if (error) showError(error.message);
    else {
      showSuccess("Report removed.");
      queryClient.invalidateQueries({ queryKey: ['adminIssueReports'] });
    }
    setDeletingId(null);
    setDeleteTarget(null);
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
      description="Publish announcements, triage community issues, and collect event feedback."
      badge="Inbox"
      actions={
        activeTab === "announcements" ? (
          <Button onClick={() => { setEditingAnnouncement(null); setIsDialogOpen(true); }} className="h-11 px-5 rounded-xl font-bold shadow-sm">
            <PlusCircle className="mr-2 h-4 w-4" /> New Announcement
          </Button>
        ) : activeTab === "issue-reports" && unreadCount > 0 ? (
          <Badge className="bg-primary text-primary-foreground px-4 py-2 rounded-full font-black text-xs">
            {unreadCount} unread
          </Badge>
        ) : undefined
      }
    >
      <Tabs value={activeTab} onValueChange={setTab} className="space-y-8">
        <TabsList className="bg-muted/50 p-1.5 rounded-2xl h-auto w-full grid grid-cols-3 gap-1">
          <TabsTrigger value="announcements" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm h-11">
            <Megaphone className="h-4 w-4 mr-2 shrink-0" /> Announcements
          </TabsTrigger>
          <TabsTrigger value="issue-reports" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm h-11">
            <MessageSquare className="h-4 w-4 mr-2 shrink-0" /> Issues
            {unreadCount > 0 && <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-black text-destructive-foreground">{unreadCount}</span>}
          </TabsTrigger>
          <TabsTrigger value="feedback" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm h-11">
            <MessageSquareQuote className="h-4 w-4 mr-2 shrink-0" /> Feedback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="space-y-6">
          <Section
            title="Announcements"
            description="Broadcast updates to your community. They appear on the member dashboard."
            icon={<Megaphone className="h-4 w-4" />}
            mutedHeader
            badge={<Badge variant="secondary" className="text-[10px] font-black rounded-full">{announcements?.length || 0}</Badge>}
          >
            {!announcements || announcements.length === 0 ? (
              <EmptyState
                icon={<Megaphone className="h-7 w-7" />}
                title="No announcements yet"
                description="Post an update to keep members in the loop about upcoming sessions and news."
                action={{ label: "New Announcement", onClick: () => { setEditingAnnouncement(null); setIsDialogOpen(true); }, icon: <PlusCircle className="h-4 w-4" /> }}
              />
            ) : (
              <div className="overflow-x-auto -mx-5 md:-mx-6">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-5 md:pl-6 text-[10px] font-black uppercase tracking-widest">Title</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Preview</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Link</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Created</TableHead>
                      <TableHead className="w-12 pr-5 md:pr-6"><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {announcements.map((a) => (
                      <TableRow key={a.id} className="group hover:bg-muted/10 transition-colors">
                        <TableCell className="pl-5 md:pl-6 py-4 font-black font-lora">{a.title}</TableCell>
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
                        <TableCell className="font-medium text-muted-foreground whitespace-nowrap">
                          {format(new Date(a.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="pr-5 md:pr-6 text-right">
                          <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity flex justify-end">
                            <OverflowMenu
                              label="Announcement"
                              triggerLabel="Announcement actions"
                              actions={[
                                { label: "Edit", icon: <Edit className="h-4 w-4" />, onSelect: () => handleEdit(a) },
                                { label: "Delete", icon: <Trash2 className="h-4 w-4" />, destructive: true, onSelect: () => setDeleteTarget({ type: "announcement", id: a.id, label: a.title }) },
                              ]}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Section>
        </TabsContent>

        <TabsContent value="issue-reports" className="space-y-6">
          <Section
            title="Issue Reports"
            description="Bug reports and support requests submitted by members."
            icon={<MessageSquare className="h-4 w-4" />}
            mutedHeader
            badge={unreadCount > 0 ? <Badge className="text-[10px] font-black rounded-full bg-destructive text-destructive-foreground">{unreadCount} new</Badge> : undefined}
          >
            {!reports || reports.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="h-7 w-7" />}
                title="No issue reports"
                description="When a member reports a problem, it lands here for you to review and resolve."
              />
            ) : (
              <div className="overflow-x-auto -mx-5 md:-mx-6">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-5 md:pl-6 text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Email</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Issue</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Page</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                      <TableHead className="w-12 pr-5 md:pr-6"><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id} className={cn("group hover:bg-muted/10 transition-colors", !report.is_read && "bg-primary/[0.02]")}>
                        <TableCell className="pl-5 md:pl-6 py-4">
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
                        <TableCell className="font-medium text-muted-foreground whitespace-nowrap">
                          {format(new Date(report.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="pr-5 md:pr-6 text-right">
                          <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity flex justify-end">
                            <OverflowMenu
                              label="Issue report"
                              triggerLabel="Issue actions"
                              actions={[
                                ...(!report.is_read ? [{ label: "Mark as read", icon: <EyeOff className="h-4 w-4" />, onSelect: () => markAsRead(report.id) }] : []),
                                { label: "Delete", icon: <Trash2 className="h-4 w-4" />, destructive: true, onSelect: () => setDeleteTarget({ type: "report", id: report.id, label: report.email }) },
                              ]}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Section>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <FeedbackCenterPanel />
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

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget?.type === "announcement" ? "Delete this announcement?" : "Delete this report?"}
        description={deleteTarget?.type === "announcement"
          ? `This permanently removes “${deleteTarget.label}”. This can't be undone.`
          : "This permanently removes the report. This can't be undone."}
        confirmLabel={deleteTarget?.type === "announcement" ? "Delete Announcement" : "Delete Report"}
        loading={deletingId !== null}
        onConfirm={deleteTarget?.type === "announcement" ? handleDeleteAnnouncement : handleDeleteReport}
      />
    </AdminWorkbenchShell>
  );
};

export default AdminInbox;