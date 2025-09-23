"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquareWarning } from "lucide-react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const UnreadIssueReportsNotice: React.FC = () => {
  const { user, loading: loadingSession } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Query to fetch the count of unread issue reports
  const fetchUnreadCount = async (): Promise<number> => {
    if (!user?.is_admin) return 0; // Only fetch if user is admin

    console.log("[UnreadIssueReportsNotice] Fetching unread issue reports count.");
    const { count, error } = await supabase
      .from("issue_reports")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);

    if (error) {
      console.error("Error fetching unread issue reports count:", error);
      // Don't throw, just return 0 or handle gracefully
      return 0;
    }
    console.log("[UnreadIssueReportsNotice] Unread reports count:", count);
    return count || 0;
  };

  const { data: unreadCount, isLoading, error } = useQuery<
    number,
    Error,
    number,
    ['unreadIssueReportsCount']
  >({
    queryKey: ['unreadIssueReportsCount'],
    queryFn: fetchUnreadCount,
    enabled: !loadingSession && !!user?.is_admin, // Only enable if session is loaded and user is admin
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    staleTime: 10 * 1000, // Data is fresh for 10 seconds
  });

  const handleNavigateToReports = () => {
    navigate("/admin/issue-reports");
    // Optionally, mark all as read immediately upon navigation
    // This will be handled by the AdminIssueReportsPage itself for better UX
  };

  if (loadingSession || isLoading || !user?.is_admin || (unreadCount === undefined || unreadCount === 0)) {
    return null; // Don't render if loading, not admin, or no unread reports
  }

  return (
    <Button
      variant="destructive"
      size="lg"
      className={cn(
        "fixed bottom-24 right-8 p-3 rounded-full shadow-lg z-50 flex items-center gap-2 animate-pulse-slow", // Added animate-pulse-slow
        "transition-all duration-300",
        "bg-red-600 hover:bg-red-700 text-white" // Ensure it's red
      )}
      onClick={handleNavigateToReports}
    >
      <MessageSquareWarning className="h-5 w-5" />
      <span className="hidden md:inline">
        {unreadCount} New Issue{unreadCount > 1 ? "s" : ""}
      </span>
      <span className="sr-only md:hidden">
        {unreadCount} New Issue{unreadCount > 1 ? "s" : ""}
      </span>
    </Button>
  );
};

export default UnreadIssueReportsNotice;