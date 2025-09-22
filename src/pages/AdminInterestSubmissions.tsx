"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Mail, Phone } from "lucide-react";
import { showError } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query"; // Import useQuery

interface InterestSubmission {
  id: string;
  first_name: string | null;
  last_name: string | null;
  mobile: string | null;
  email: string;
  created_at: string;
}

const AdminInterestSubmissions: React.FC = () => {
  const { user, loading: loadingSession } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loadingSession && (!user || !user.is_admin)) {
      navigate("/");
      showError("Access Denied: You must be an administrator to view this page.");
    }
  }, [user, loadingSession, navigate]);

  // Query function for fetching submissions
  const fetchSubmissions = async (): Promise<InterestSubmission[]> => {
    console.log("[AdminInterestSubmissions] Fetching all interest submissions.");
    const { data, error } = await supabase
      .from("interest_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching interest submissions:", error);
      throw new Error("Failed to load interest submissions.");
    }
    console.log("[AdminInterestSubmissions] Submissions fetched successfully:", data?.length, "submissions.");
    return data || [];
  };

  // Use react-query for submissions data
  const { data: submissions, isLoading: loadingSubmissions, error: fetchError } = useQuery<
    InterestSubmission[], // TQueryFnData
    Error,          // TError
    InterestSubmission[], // TData (the type of the 'data' property)
    ['interestSubmissions'] // TQueryKey
  >({
    queryKey: ['interestSubmissions'],
    queryFn: fetchSubmissions,
    enabled: !loadingSession && !!user?.is_admin, // Only fetch if session is not loading and user is admin
    staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Data stays in cache for 10 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  if (loadingSubmissions) {
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
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-6 w-1/4" />
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
    return null;
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
    <div className="space-y-6 py-8"> {/* Removed container mx-auto */}
      <h1 className="text-4xl font-bold text-center font-lora">Interest Submissions</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
        View all individuals who have expressed interest in Resonance with Daniele.
      </p>

      <Card className="w-full max-w-4xl mx-auto p-6 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-lora">Submissions List</CardTitle>
          <CardDescription>Contact these individuals to follow up on their interest.</CardDescription>
        </CardHeader>
        <CardContent>
          {submissions && submissions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-xl font-semibold">No interest submissions found yet.</p>
              <p className="mt-2">Once people express interest, their details will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Submitted On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions?.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        {submission.first_name} {submission.last_name}
                      </TableCell>
                      <TableCell>
                        <a href={`mailto:${submission.email}`} className="text-primary hover:underline flex items-center gap-1">
                          <Mail className="h-4 w-4" /> {submission.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        {submission.mobile ? (
                          <a href={`tel:${submission.mobile}`} className="text-primary hover:underline flex items-center gap-1">
                            <Phone className="h-4 w-4" /> {submission.mobile}
                          </a>
                        ) : "N/A"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(submission.created_at), "PPP p")}
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

export default AdminInterestSubmissions;