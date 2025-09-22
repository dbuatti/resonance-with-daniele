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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge"; // Import Badge for survey status

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
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

const AdminMembers: React.FC = () => {
  const { user, loading: loadingSession } = useSession();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isUpdatingAdminStatus, setIsUpdatingAdminStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!loadingSession && (!user || !user.is_admin)) {
      navigate("/");
      showError("Access Denied: You must be an administrator to view this page.");
    }
  }, [user, loadingSession, navigate]);

  const fetchProfiles = async () => {
    if (user && user.is_admin) {
      setLoadingProfiles(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*, email") // Ensure email is selected
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching profiles:", error);
        showError("Failed to load profiles.");
      } else {
        setProfiles(data as Profile[]);
      }
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    if (!loadingSession && user?.is_admin) {
      fetchProfiles();
    }
  }, [user, loadingSession]);

  const handleAdminStatusChange = async (profileId: string, newStatus: boolean) => {
    if (!user || !user.is_admin) {
      showError("You do not have permission to change admin status.");
      return;
    }

    if (profileId === user.id && !newStatus) {
      showError("You cannot demote yourself from admin status.");
      return;
    }

    setIsUpdatingAdminStatus(profileId);
    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: newStatus, updated_at: new Date().toISOString() })
      .eq("id", profileId);

    if (error) {
      console.error("Error updating admin status:", error);
      showError("Failed to update admin status: " + error.message);
    } else {
      showSuccess(`User role updated to ${newStatus ? "Admin" : "User"}!`);
      fetchProfiles();
    }
    setIsUpdatingAdminStatus(null);
  };

  // Helper function to determine if a profile has any survey responses
  const hasSurveyResponses = (profile: Profile) => {
    return (
      profile.how_heard !== null ||
      (profile.motivation && profile.motivation.length > 0) ||
      profile.attended_session !== null ||
      profile.singing_experience !== null ||
      profile.session_frequency !== null ||
      profile.preferred_time !== null ||
      (profile.music_genres && profile.music_genres.length > 0) ||
      profile.choir_goals !== null ||
      profile.inclusivity_importance !== null ||
      profile.suggestions !== null
    );
  };

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
    return null;
  }

  return (
    <div className="space-y-6 py-8 animate-fade-in-up">
      <h1 className="text-4xl font-bold text-center font-lora">Manage Member Profiles</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
        View and manage all registered member profiles, including their roles.
      </p>

      <Card className="w-full max-w-4xl mx-auto p-6 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-lora">Member List</CardTitle>
          <CardDescription>Change user roles or view their detailed survey responses.</CardDescription>
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
                    <TableHead>Role</TableHead>
                    <TableHead>Survey Status</TableHead> {/* New column */}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">
                        {profile.first_name || profile.last_name
                          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                          : profile.email || "N/A"} {/* Fallback to email */}
                      </TableCell>
                      <TableCell>{profile.email || "N/A"}</TableCell>
                      <TableCell>
                        <Select
                          value={profile.is_admin ? "admin" : "user"}
                          onValueChange={(value) => handleAdminStatusChange(profile.id, value === "admin")}
                          disabled={profile.id === user.id || isUpdatingAdminStatus === profile.id}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell> {/* New Survey Status Cell */}
                        {hasSurveyResponses(profile) ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">Responded</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedProfile(profile)}>
                              <Eye className="mr-2 h-4 w-4" /> View Survey
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="font-lora">Survey Responses for {profile.first_name || profile.email}</DialogTitle>
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

export default AdminMembers;