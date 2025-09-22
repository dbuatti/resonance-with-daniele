"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, CalendarDays, FileText, PlusCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { showError } from "@/utils/toast";
import { useDelayedLoading } from "@/hooks/use-delayed-loading"; // Import the new hook

const AdminDashboardOverview: React.FC = () => {
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [eventCount, setEventCount] = useState<number | null>(null);
  const [resourceCount, setResourceCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const showDelayedSkeleton = useDelayedLoading(loading); // Use the delayed loading hook

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      try {
        // Fetch member count
        const { count: members, error: memberError } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true });
        if (memberError) throw memberError;
        setMemberCount(members);

        // Fetch event count
        const { count: events, error: eventError } = await supabase
          .from("events")
          .select("id", { count: "exact", head: true });
        if (eventError) throw eventError;
        setEventCount(events);

        // Fetch resource count
        const { count: resources, error: resourceError } = await supabase
          .from("resources")
          .select("id", { count: "exact", head: true });
        if (resourceError) throw resourceError;
        setResourceCount(resources);

      } catch (error: any) {
        console.error("Error fetching admin dashboard counts:", error.message);
        showError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  if (showDelayedSkeleton) { // Use the delayed skeleton state
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="shadow-lg rounded-xl p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/4 mb-4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="shadow-lg rounded-xl p-6 text-center">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-lora">Total Members</CardTitle>
          <Users className="h-6 w-6 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold text-foreground mb-4">{memberCount !== null ? memberCount : <Loader2 className="h-8 w-8 animate-spin mx-auto" />}</div>
          <Button asChild className="w-full">
            <Link to="/admin/members">View All Members</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-xl p-6 text-center">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-lora">Total Events</CardTitle>
          <CalendarDays className="h-6 w-6 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold text-foreground mb-4">{eventCount !== null ? eventCount : <Loader2 className="h-8 w-8 animate-spin mx-auto" />}</div>
          <Button asChild className="w-full">
            <Link to="/events">
              <PlusCircle className="mr-2 h-4 w-4" /> Manage Events
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-xl p-6 text-center">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-lora">Total Resources</CardTitle>
          <FileText className="h-6 w-6 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold text-foreground mb-4">{resourceCount !== null ? resourceCount : <Loader2 className="h-8 w-8 animate-spin mx-auto" />}</div>
          <Button asChild className="w-full">
            <Link to="/resources">
              <PlusCircle className="mr-2 h-4 w-4" /> Manage Resources
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardOverview;