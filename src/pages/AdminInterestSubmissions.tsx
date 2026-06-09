"use client";

import React, { useState } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Trash2 } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import AdminPageLayout from "@/components/admin/AdminPageLayout";

interface InterestSubmission {
  id: string;
  first_name: string | null;
  last_name: string | null;
  mobile: string | null;
  email: string;
  created_at: string;
}

const AdminInterestSubmissions: React.FC = () => {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const fetchSubmissions = async (): Promise<InterestSubmission[]> => {
    const { data, error } = await supabase
      .from("interest_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error("Failed to load interest submissions.");
    return data || [];
  };

  const { data: submissions, isLoading: loadingSubmissions, error: fetchError } = useQuery<InterestSubmission[], Error, InterestSubmission[], ['interestSubmissions']>({
    queryKey: ['interestSubmissions'],
    queryFn: fetchSubmissions,
    enabled: !!user?.is_admin,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteSubmission = async (submissionId: string) => {
    setDeletingId(submissionId);
    const { error } = await supabase.from("interest_submissions").delete().eq("id", submissionId);
    if (error) {
      showError(error.message);
    } else {
      showSuccess("Submission removed successfully.");
      queryClient.invalidateQueries({ queryKey: ['interestSubmissions'] });
    }
    setDeletingId(null);
  };

  return (
    <AdminPageLayout
      title="Interest Submissions"
      description="View and manage individuals who have expressed interest in Resonance with Daniele."
      badge="Interest List"
      backTo="/admin"
      isLoading={loadingSubmissions}
      error={fetchError}
      empty={submissions?.length === 0}
      emptyMessage="No interest submissions yet."
      emptyIcon={<Mail className="h-12 w-12 text-muted-foreground/40" />}
    >
      <Card className="w-full soft-shadow border-none overflow-hidden rounded-[2.5rem]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="pl-10 py-6 text-[10px] font-black uppercase tracking-widest">Name</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Email</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Mobile</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Submitted On</TableHead>
                  <TableHead className="text-right pr-10 text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions?.map((submission) => (
                  <TableRow key={submission.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="pl-10 py-5 font-black font-lora">
                      {submission.first_name} {submission.last_name}
                    </TableCell>
                    <TableCell>
                      <a href={`mailto:${submission.email}`} className="text-primary hover:underline flex items-center gap-1.5 font-medium">
                        <Mail className="h-4 w-4" /> {submission.email}
                      </a>
                    </TableCell>
                    <TableCell>
                      {submission.mobile ? (
                        <a href={`tel:${submission.mobile}`} className="text-primary hover:underline flex items-center gap-1.5 font-medium">
                          <Phone className="h-4 w-4" /> {submission.mobile}
                        </a>
                      ) : (
                        <span className="text-muted-foreground font-medium">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-muted-foreground">
                      {format(new Date(submission.created_at), "PPP p")}
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                            disabled={deletingId === submission.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2.5rem]">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Interest Submission?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove {submission.first_name || 'this submission'} from the interest list.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSubmission(submission.id)} className="rounded-xl font-bold bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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

export default AdminInterestSubmissions;
