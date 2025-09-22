"use client";

import React, { useEffect } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AdminZone: React.FC = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !user.is_admin)) {
      // If not loading, and user is not logged in or not an admin, redirect to home
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
    // This block should ideally not be reached due to the redirect in useEffect,
    // but serves as a fallback for immediate rendering before redirect.
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
            <Button asChild>
              <Link to="/">Go to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8 animate-fade-in-up">
      <h1 className="text-4xl font-bold text-center font-lora">Welcome to the Admin Zone, Daniele!</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
        This area is exclusively for administrators. Here you can manage various aspects of the choir's operations.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <Card className="shadow-lg rounded-xl p-6 text-center">
          <CardTitle className="text-xl font-lora mb-2">Manage Events</CardTitle>
          <CardDescription>Add, edit, or delete upcoming choir events.</CardDescription>
          <Button asChild className="mt-4">
            <Link to="/events">Go to Events</Link>
          </Button>
        </Card>
        <Card className="shadow-lg rounded-xl p-6 text-center">
          <CardTitle className="text-xl font-lora mb-2">Manage Resources</CardTitle>
          <CardDescription>Upload and organize sheet music, audio, and tutorials.</CardDescription>
          <Button asChild className="mt-4">
            <Link to="/resources">Go to Resources</Link>
          </Button>
        </Card>
        <Card className="shadow-lg rounded-xl p-6 text-center">
          <CardTitle className="text-xl font-lora mb-2">View Survey Data</CardTitle>
          <CardDescription>Analyze insights from member surveys.</CardDescription>
          <Button asChild className="mt-4">
            <Link to="/profile">View Profiles</Link> {/* Link to profile for now, can be a dedicated survey page later */}
          </Button>
        </Card>
        {/* Add more admin specific cards here */}
      </div>
    </div>
  );
};

export default AdminZone;