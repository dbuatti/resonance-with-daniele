"use client";

import React, { useEffect } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Mail, BellRing } from "lucide-react"; // Added BellRing icon
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import AdminDashboardOverview from "@/components/admin/AdminDashboardOverview";

const AdminZone: React.FC = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !user.is_admin)) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading admin access...</p>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center shadow-lg rounded-xl border-destructive/20 border-2">
          <CardHeader className="flex flex-col items-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <CardTitle className="text-2xl font-bold font-lora">Access Denied</CardTitle>
            <CardDescription className="text-muted-foreground">
              You do not have permission to view this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/" className={cn(buttonVariants({ variant: "default" }))}>
              Go to Home
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8">
      <h1 className="text-4xl font-bold text-center font-lora">Welcome to the Admin Zone, Daniele!</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
        This area is exclusively for administrators. Here you can manage various aspects of the choir's operations.
      </p>

      <AdminDashboardOverview />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <Card className="shadow-lg rounded-xl p-6 text-center">
          <CardTitle className="text-xl font-lora mb-2">View Survey Data</CardTitle>
          <CardDescription>Analyze aggregated insights from member surveys.</CardDescription>
          <Link to="/admin/survey-data" className={cn(buttonVariants({ variant: "default" }), "mt-4")}>
            View Survey Data
          </Link>
        </Card>
        <Card className="shadow-lg rounded-xl p-6 text-center">
          <CardTitle className="text-xl font-lora mb-2">Manage Members</CardTitle>
          <CardDescription>View all member profiles and manage their roles.</CardDescription>
          <Link to="/admin/members" className={cn(buttonVariants({ variant: "default" }), "mt-4")}>
            Manage Members
          </Link>
        </Card>
        <Card className="shadow-lg rounded-xl p-6 text-center">
          <CardTitle className="text-xl font-lora mb-2">Manage Announcements</CardTitle>
          <CardDescription>Create, edit, and delete choir announcements.</CardDescription>
          <Link to="/admin/announcements" className={cn(buttonVariants({ variant: "default" }), "mt-4")}>
            <BellRing className="mr-2 h-4 w-4" /> Manage Announcements
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default AdminZone;