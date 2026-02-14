"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Trash2, AlertCircle, CheckCircle2, EyeOff } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import BackButton from "@/components/ui/BackButton";

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
  const { user, loading: loadingSession } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loadingSession && (!user || !user.is_admin)) {
      navigate("/");
      showError("Access Denied: You must be an administrator to view this page.");
    }
  }, [user, loadingSession, navigate]);

  const markAllAsRead = async () => {
    if (!user?.is_admin) return;
    const { error } = await supabase
      .from("issue_reports")
      .update({ is_read: true })
      .eq("is_read", false);
    if (error) {
      console.error("Error marking reports as read:", error);
    } else {
      queryClient.invalidateQueries({ queryKey: ['unreadIssueReportsCount'] });
    }
  };

  useEffect(() => {
    if (user?.is_admin) {
      markAllAsRead();
    }
  }, [user?.is_admin]);

  const fetchIssueReports = async (): Promise<IssueReport[]> => {
    const { data, error } = await supabase
      .from("issue_reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Failed to load issue reports.");
    return data || [];
  };

  const { data: issueReports, isLoading: loadingReports, error: fetchError } = useQuery<IssueReport[], Error>({
    queryKey: ['adminIssueReports'],
    queryFn: fetchIssueReports,
    enabled: !loadingSession && !!user?.is_admin,
    staleTime: 60 * 1000,
  });

  const handleDeleteReport = async (reportId: string) => {
    if (!user || !user.is_admin) return;
    const { error } = await supabase.from("issue_reports").delete().eq("id", reportId);
    if (error) {
      showError(`Failed to delete report: ${error.message}`);
    } else {
      showSuccess("Issue report deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['adminIssueReports'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardCounts'] });
      queryClient.invalidateQueries({ queryKey: ['unreadIssueReportsCount'] });
    }
  };

  const handleMarkAsRead = async (reportId: string, currentStatus: boolean) => {
    if (!user || !user.is_admin) return;
    const { error } = await supabase.from("issue_reports").update({ is_read: !currentStatus }).eq("id", reportId);
    if (error) {
      showError(`Failed to update status: ${error.message}`);
    } else {
      showSuccess(`Report marked as ${!currentStatus ? "read" : "unread"}!`);
      queryClient.invalidateQueries({ queryKey: ['adminIssueReports'] });
      queryClient.invalidateQueries({ queryKey: ['unreadIssueReportsCount'] });
    }
  };

  if (loadingReports) return <div className="p-8"><Skeleton className="h-10 w-full" /></div>;
  if (!user || !user.is_admin) return null;

  return (
    <div className="space-y-6 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <BackButton className="mb-6" to="/admin" />
        
        <header className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold text-center font-lora">Issue Reports</h1>
          <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
            Review and manage all submitted issue reports and complaints from users.
          </p>
        </header>

        <Card className="w-full shadow-xl border-none overflow-hidden rounded-2xl">
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <CardTitle className="text-2xl font-lora">All Reports</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {issueReports && issueReports.length === 0 ? (
              <div className="text-center text-muted-foreground py-20">
                <p className="text-xl font-semibold">No issue reports found yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow>
                      <TableHead className="pl-6 py-4 w-[80px]">Status</TableHead>
                      <TableHead className="min-w-[150px]">Reporter</TableHead>
                      <TableHead className="min-w-[250px]">Description</TableHead>
                      <TableHead>Page</TableHead>
                      <TableHead>Submitted On</TableHead>
                      <TableHead className="text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issueReports?.map((report) => (
                      <TableRow key={report.id} className={cn("hover:bg-muted/10 transition-colors", !report.is_read && "bg-red-50/50 dark:bg-red-950/20")}>
                        <TableCell className="pl-6 py-4">
                          <Badge variant={report.is_read ? "secondary" : "destructive"} className="text-[10px] uppercase tracking-widest font-bold">
                            {report.is_read ? "Read" : "Unread"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">{report.email}</TableCell>
                        <TableCell className="text-muted-foreground line-clamp-2 max-w-xs">{report.issue_description}</TableCell>
                        <TableCell>
                          {report.page_url ? (
                            <a href={report.page_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[150px] inline-block">{report.page_url}</a>
                          ) : "N/A"}
                        </TableCell>
                        <TableCell>{format(new Date(report.created_at), "PPP")}</TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(report.id, report.is_read)} className="h-8 px-3 text-xs font-bold uppercase tracking-wider">
                              {report.is_read ? <EyeOff className="h-3.5 w-3.5 mr-1.5" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />} {report.is_read ? "Unread" : "Read"}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Report?</AlertDialogTitle>
                                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteReport(report.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
    </div>
  );
};

export default AdminIssueReportsPage;