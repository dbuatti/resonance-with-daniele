"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Trash2, AlertCircle } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface IssueReport {
  id: string;
  user_id: string | null;
  email: string;
  issue_description: string;
  page_url: string | null;
  created_at: string;
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

  // Query function for fetching issue reports
  const fetchIssueReports = async (): Promise<IssueReport[]> => {
    console.log("[AdminIssueReportsPage] Fetching all issue reports.");
    const { data, error } = await supabase
      .from("issue_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching issue reports:", error);
      throw new Error("Failed to load issue reports.");
    }
    console.log("[AdminIssueReportsPage] Issue reports fetched successfully:", data?.length, "reports.");
    return data || [];
  };

  // Use react-query for issue reports data
  const { data: issueReports, isLoading: loadingReports, error: fetchError } = useQuery<
    IssueReport[],
    Error,
    IssueReport[],
    ['adminIssueReports']
  >({
    queryKey: ['adminIssueReports'],
    queryFn: fetchIssueReports,
    enabled: !loadingSession && !!user?.is_admin, // Only fetch if session is not loading and user is admin
    staleTime: 60 * 1000, // Data is considered fresh for 1 minute
    gcTime: 5 * 60 * 1000, // Data stays in cache for 5 minutes
    refetchOnWindowFocus: true,
  });

  const handleDeleteReport = async (reportId: string) => {
    if (!user || !user.is_admin) {
      showError("You do not have permission to delete issue reports.");
      return;
    }

    const { error } = await supabase
      .from("issue_reports")
      .delete()
      .eq("id", reportId);

    if (error) {
      console.error("Error deleting issue report:", error);
      showError("Failed to delete issue report: " + error.message);
    } else {
      showSuccess("Issue report deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['adminIssueReports'] }); // Invalidate to refetch and update UI
      queryClient.invalidateQueries({ queryKey: ['adminDashboardCounts'] }); // Invalidate dashboard counts
    }
  };

  if (loadingReports) {
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
      <h1 className="text-4xl font-bold text-center font-lora">Issue Reports</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
        Review and manage all submitted issue reports and complaints from users.
      </p>

      <Card className="w-full max-w-4xl mx-auto p-6 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-lora">All Reports</CardTitle>
          <CardDescription>Overview of all reported issues.</CardDescription>
        </CardHeader>
        <CardContent>
          {issueReports && issueReports.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-xl font-semibold">No issue reports found yet.</p>
              <p className="mt-2">Users can submit reports via the "Report an Issue" button at the bottom right.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reporter Email</TableHead>
                    <TableHead>Issue Description</TableHead>
                    <TableHead>Page URL</TableHead>
                    <TableHead>Submitted On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issueReports?.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.email}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs line-clamp-2">
                        {report.issue_description}
                      </TableCell>
                      <TableCell>
                        {report.page_url ? (
                          <a href={report.page_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {report.page_url.length > 30 ? report.page_url.substring(0, 27) + "..." : report.page_url}
                          </a>
                        ) : "N/A"}
                      </TableCell>
                      <TableCell>{format(new Date(report.created_at), "PPP p")}</TableCell>
                      <TableCell className="text-right">
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
                                This action cannot be undone. This will permanently delete this issue report.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteReport(report.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
  );
};

export default AdminIssueReportsPage;