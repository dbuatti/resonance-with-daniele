"use client";

import React, { useState } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle2, EyeOff, MessageSquare } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import { cn } from "@/lib/utils";

interface IssueReport {
  id: string;
  user_id: string | null;
  email: string;
  issue_description: string;
  page_url: string | null;
  created_at: string;
  is_read: boolean;
}

const AdminIssueReportsPage: React.FC = () => {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReports = async (): Promise<IssueReport[]> => {
    const { data, error } = await supabase
      .from("issue_reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  };

  const { data: reports, isLoading, error: fetchError } = useQuery<IssueReport[]>({
    queryKey: ['adminIssueReports'],
    queryFn: fetchReports,
    enabled: !!user?.is_admin,
  });

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from("issue_reports").update({ is_read: true }).eq("id", id);
    if (error) showError(error.message);
    else queryClient.invalidateQueries({ queryKey: ['adminIssueReports'] });
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("issue_reports").delete().eq("id", id);
    if (error) showError(error.message);
    else {
      showSuccess("Report removed.");
      queryClient.invalidateQueries({ queryKey: ['adminIssueReports'] });
    }
    setDeletingId(null);
  };

  const unreadCount = reports?.filter(r => !r.is_read).length || 0;

  return (
    <AdminPageLayout
      title="Issue Reports"
      description="Bug reports and feedback submitted by users."
      badge="Support"
      badgeIcon={<MessageSquare className="h-3 w-3" />}
      backTo="/admin"
      isLoading={isLoading}
      error={fetchError}
      empty={reports?.length === 0}
      emptyMessage="No issue reports yet."
      actions={
        unreadCount > 0 && (
          <Badge className="bg-primary text-primary-foreground px-4 py-2 rounded-full font-black text-xs">
            {unreadCount} unread
          </Badge>
        )
      }
    >
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
                              <AlertDialogAction onClick={() => handleDelete(report.id)} className="rounded-xl font-bold bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
};

export default AdminIssueReportsPage;
