"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Eye } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import SurveyMetricsCard from "@/components/admin/SurveyMetricsCard"; // Import the new component

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null; // Now directly from profiles table
  avatar_url: string | null;
  is_admin: boolean;
  how_heard: string | null;
  motivation: string[] | null;
  attended_session: boolean | null;
  singing_experience: string | null;
  session_frequency: string | null;
  preferred_time: string | null;
  music_genres: string[] | null;
  choir_goals: string | null;
  inclusivity_importance: string | null;
  suggestions: string | null;
  updated_at: string;
}

const AdminProfiles: React.FC = () => {
  const { user, loading: loadingSession } = useSession();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!loadingSession && (!user || !user.is_admin)) {
      navigate("/");
      showError("Access Denied: You must be an administrator to view this page.");
    }
  }, [user, loadingSession, navigate]);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (user && user.is_admin) {
        setLoadingProfiles(true);
        // Fetch all profile data, including the new 'email' column
        const { data, error } = await supabase
          .from("profiles")
          .select("*, email") // Select all columns, explicitly including email
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("Error fetching profiles:", error);
          showError("Failed to load profiles.");
        } else {
          setProfiles(data as Profile[]); // Cast data to Profile[]
        }
        setLoadingProfiles(false);
      }
    };

    if (!loadingSession && user?.is_admin) {
      fetchProfiles();
    }
  }, [user, loadingSession]);

  if (loadingSession || loadingProfiles) {
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
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-6 w-1/3" />
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
    return null; // Should be redirected by useEffect
  }

  return (
    <div className="space-y-6 py-8 animate-fade-in-up">
      <h1 className="text-4xl font-bold text-center font-lora">All Member Profiles & Survey Data</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
        View and manage all registered member profiles and their survey responses.
      </p>

      {/* New Survey Metrics Card */}
      <SurveyMetricsCard profiles={profiles} />

      <Card className="w-full max-w-4xl mx-auto p-6 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-lora">Member List</CardTitle>
          <CardDescription>Click "View Survey" to see detailed responses.</CardDescription>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-xl font-semibold">No profiles found.</p>
              <p className="mt-2">It looks like no members have registered yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">
                        {profile.first_name || profile.last_name ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : "N/A"}
                      </TableCell>
                      <TableCell>{profile.email || "N/A"}</TableCell>
                      <TableCell>{profile.is_admin ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedProfile(profile)}>
                              <Eye className="mr-2 h-4 w-4" /> View Survey
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="font-lora">Survey Responses for {profile.first_name || profile.email}</CardTitle>
                              <CardDescription>Last updated: {profile.updated_at ? new Date(profile.updated_at).toLocaleString() : "N/A"}</CardDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <p className="col-span-1 text-sm font-medium">How Heard:</p>
                                <p className="col-span-3 text-sm text-muted-foreground">{profile.how_heard || "N/A"}</p>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <p className="col-span-1 text-sm font-medium">Motivation:</p>
                                <p className="col-span-3 text-sm text-muted-foreground">{profile.motivation?.join(", ") || "N/A"}</p>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <p className="col-span-1 text-sm font-medium">Attended Session:</p>
                                <p className="col-span-3 text-sm text-muted-foreground">{profile.attended_session === true ? "Yes" : profile.attended_session === false ? "No" : "N/A"}</p>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <p className="col-span-1 text-sm font-medium">Singing Experience:</p>
                                <p className="col-span-3 text-sm text-muted-foreground">{profile.singing_experience || "N/A"}</p>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <p className="col-span-1 text-sm font-medium">Session Frequency:</p>
                                <p className="col-span-3 text-sm text-muted-foreground">{profile.session_frequency || "N/A"}</p>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <p className="col-span-1 text-sm font-medium">Preferred Time:</p>
                                <p className="col-span-3 text-sm text-muted-foreground">{profile.preferred_time || "N/A"}</p>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <p className="col-span-1 text-sm font-medium">Music Genres:</p>
                                <p className="col-span-3 text-sm text-muted-foreground">{profile.music_genres?.join(", ") || "N/A"}</p>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <p className="col-span-1 text-sm font-medium">Choir Goals:</p>
                                <p className="col-span-3 text-sm text-muted-foreground">{profile.choir_goals || "N/A"}</p>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <p className="col-span-1 text-sm font-medium">Inclusivity Importance:</p>
                                <p className="col-span-3 text-sm text-muted-foreground">{profile.inclusivity_importance || "N/A"}</p>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <p className="col-span-1 text-sm font-medium">Suggestions:</p>
                                <p className="col-span-3 text-sm text-muted-foreground">{profile.suggestions || "N/A"}</p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
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

export default AdminProfiles;