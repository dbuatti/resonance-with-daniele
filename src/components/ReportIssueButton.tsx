"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/integrations/supabase/auth";
import { showSuccess, showError } from "@/utils/toast";
import { useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DialogDescription } from "@/components/ui/dialog"; // Import DialogDescription

const issueReportSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  issue_description: z.string().min(10, "Please provide a more detailed description (at least 10 characters)"),
});

type IssueReportFormData = z.infer<typeof issueReportSchema>;

const ReportIssueButton: React.FC = () => {
  const { user, profile } = useSession();
  const location = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<IssueReportFormData>({
    resolver: zodResolver(issueReportSchema),
    defaultValues: {
      email: user?.email || "",
      issue_description: "",
    },
  });

  // Set default email if user is logged in
  React.useEffect(() => {
    if (user?.email) {
      form.setValue("email", user.email);
    }
  }, [user?.email, form]);

  const onSubmit = async (data: IssueReportFormData) => {
    try {
      const { error } = await supabase.from("issue_reports").insert({
        user_id: user?.id || null,
        email: data.email,
        issue_description: data.issue_description,
        page_url: location.pathname + location.search,
      });

      if (error) {
        console.error("Error submitting issue report:", error);
        showError("Failed to submit issue report: " + error.message);
      } else {
        showSuccess("Issue report submitted successfully! Thank you for your feedback.");
        form.reset({
          email: user?.email || "", // Reset email to user's email or empty
          issue_description: "",
        });
        setIsDialogOpen(false);
      }
    } catch (error: any) {
      console.error("Unexpected error during issue report submission:", error);
      showError("An unexpected error occurred: " + error.message);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="lg"
          className="fixed bottom-8 left-8 p-3 rounded-full shadow-lg z-50 flex items-center gap-2"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="hidden md:inline">Report an Issue</span>
          <span className="sr-only md:hidden">Report Issue</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-lora">Report an Issue or Complaint</DialogTitle>
          <DialogDescription> {/* Changed from <p> to DialogDescription */}
            Help me improve the app by letting me know about any bugs or problems you encounter.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Your Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@example.com"
              {...form.register("email")}
              disabled={!!user?.email || form.formState.isSubmitting}
              className={cn(!!user?.email && "bg-muted")}
            />
            {form.formState.errors.email && (
              <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="issue_description">Describe the Issue</Label>
            <Textarea
              id="issue_description"
              placeholder="e.g., 'The events page isn't loading correctly on my phone', 'I can't upload my avatar', etc."
              className="resize-y min-h-[100px]"
              {...form.register("issue_description")}
              disabled={form.formState.isSubmitting}
            />
            {form.formState.errors.issue_description && (
              <p className="text-red-500 text-sm">{form.formState.errors.issue_description.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportIssueButton;