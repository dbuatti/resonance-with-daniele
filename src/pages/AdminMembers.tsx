"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input"; // Added Input import
import { Label } from "@/components/ui/label"; // Added Label import
import { Loader2, Eye, Trash2, Edit as EditIcon, User as UserIcon } from "lucide-react"; // Added EditIcon and UserIcon
import { showSuccess, showError } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form"; // Added useForm
import { zodResolver } from "@hookform/resolvers/zod"; // Added zodResolver
import * as z from "zod"; // Added z
import AvatarUpload from "@/components/AvatarUpload"; // Added AvatarUpload
import VoiceTypeSelector from "@/components/profile/VoiceTypeSelector"; // Added VoiceTypeSelector
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"; // Added Form components

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
  voice_type: string[] | null;
}

// Define schema for profile editing (similar to ProfileDetails)
const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required").optional().or(z.literal("")),
  last_name: z.string().min(1, "Last name is required").optional().or(z.literal("")),
  voice_type: z.array(z.string()).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const AdminMembers: React.FC = () => {
  const { user, loading: loadingSession } = useSession();
  const navigate = useNavigate();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isUpdatingAdminStatus, setIsUpdatingAdminStatus] = useState<string | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false); // New state for edit profile dialog
  const [editingMember, setEditingMember] = useState<Profile | null>(null); // New state for member being edited
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null); // For avatar upload in edit dialog
  const [removeAvatarRequested, setRemoveAvatarRequested] = useState(false); // For avatar removal in edit dialog
  const [isSavingProfile, setIsSavingProfile] = useState(false); // For saving state in edit dialog
  const queryClient = useQueryClient();

  const editProfileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      voice_type: [],
    },
  });

  useEffect(() => {
    if (!loadingSession && (!user || !user.is_admin)) {
      navigate("/");
      showError("Access Denied: You must be an administrator to view this page.");
    }
  }, [user, loadingSession, navigate]);

  // Effect to set form values when a member is selected for editing
  useEffect(() => {
    if (editingMember) {
      editProfileForm.reset({
        first_name: editingMember.first_name || "",
        last_name: editingMember.last_name || "",
        voice_type: editingMember.voice_type || [],
      });
      setSelectedAvatarFile(null); // Clear any previously selected file
      setRemoveAvatarRequested(false); // Reset avatar removal request
    }
  }, [editingMember, editProfileForm]);

  const fetchProfiles = async (): Promise<Profile[]> => {
    console.log("[AdminMembers] Fetching all profiles.");
    const { data, error } = await supabase
      .from("profiles")
      .select("*, email")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching profiles:", error);
      throw new Error("Failed to load profiles.");
    }
    console.log("[AdminMembers] Profiles fetched successfully:", data?.length, "profiles.");
    return data || [];
  };

  const { data: profiles, isLoading: loadingProfiles, error: fetchError } = useQuery<
    Profile[],
    Error,
    Profile[],
    ['adminMembers']
  >({
    queryKey: ['adminMembers'],
    queryFn: fetchProfiles,
    enabled: !loadingSession && !!user?.is_admin,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

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
      queryClient.invalidateQueries({ queryKey: ['adminMembers'] });
      queryClient.invalidateQueries({ queryKey: ['adminProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['profile', profileId] });
    }
    setIsUpdatingAdminStatus(null);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!user || !user.is_admin) {
      showError("You do not have permission to delete users.");
      return;
    }

    if (userId === user.id) {
      showError("You cannot delete your own user account.");
      return;
    }

    setIsDeletingUser(userId);
    try {
      // Use the Supabase Admin API to delete the user from auth.users
      // This will trigger the RLS ON DELETE CASCADE on the public.profiles table
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) {
        console.error("Error deleting user:", error);
        showError("Failed to delete user: " + error.message);
      } else {
        showSuccess(`User "${userName}" and their profile deleted successfully!`);
        queryClient.invalidateQueries({ queryKey: ['adminMembers'] }); // Invalidate to refetch and update UI
        queryClient.invalidateQueries({ queryKey: ['adminProfiles'] }); // Invalidate admin survey data
        queryClient.invalidateQueries({ queryKey: ['adminDashboardCounts'] }); // Update dashboard counts
      }
    } catch (error: any) {
      console.error("Unexpected error during user deletion:", error);
      showError("An unexpected error occurred: " + error.message);
    } finally {
      setIsDeletingUser(null);
    }
  };

  const handleAvatarFileChange = (file: File | null) => {
    setSelectedAvatarFile(file);
    setRemoveAvatarRequested(false);
  };

  const handleRemoveAvatarRequested = () => {
    setSelectedAvatarFile(null);
    setRemoveAvatarRequested(true);
  };

  const handleEditProfileSubmit = async (data: ProfileFormData) => {
    if (!user || !user.is_admin || !editingMember) {
      showError("You must be an administrator and select a member to edit.");
      return;
    }

    setIsSavingProfile(true);
    let newAvatarUrl: string | null = editingMember.avatar_url || null;
    let uploadError: Error | null = null;
    let deleteError: Error | null = null;

    try {
      if (removeAvatarRequested && editingMember.avatar_url) {
        const urlParts = editingMember.avatar_url.split('/');
        const pathInStorage = urlParts.slice(urlParts.indexOf('avatars') + 1).join('/');
        const { error } = await supabase.storage
          .from("avatars")
          .remove([pathInStorage]);

        if (error) {
          console.error("Error removing avatar:", error);
          deleteError = error;
        } else {
          newAvatarUrl = null;
          showSuccess("Avatar removed successfully!");
        }
      }

      if (selectedAvatarFile) {
        const fileExt = selectedAvatarFile.name.split(".").pop();
        const fileName = `${editingMember.id}/${Math.random()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(filePath, selectedAvatarFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadErr) {
          console.error("Error uploading avatar:", uploadErr);
          uploadError = uploadErr;
        } else {
          const { data: publicUrlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);
          newAvatarUrl = publicUrlData?.publicUrl || null;
          showSuccess("Avatar uploaded successfully!");
        }
      }

      if (uploadError || deleteError) {
        showError("Failed to update avatar. Please try again.");
        editProfileForm.setError("first_name", { message: "Avatar update failed." });
        return;
      }

      // Update auth.users metadata (only first_name, last_name, avatar_url can be updated here)
      const { data: authResponseData, error: authUpdateError } = await supabase.auth.admin.updateUserById(editingMember.id, {
        email: editingMember.email || undefined, // Keep email if it exists
        user_metadata: { // Corrected from 'data' to 'user_metadata'
          first_name: data.first_name || null,
          last_name: data.last_name || null,
          avatar_url: newAvatarUrl,
        },
      });

      if (authUpdateError) {
        console.error("Error updating auth user metadata:", authUpdateError);
        showError("Failed to update user session: " + authUpdateError.message);
        return;
      }

      // Update public.profiles table
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: editingMember.id,
            first_name: data.first_name || null,
            last_name: data.last_name || null,
            avatar_url: newAvatarUrl,
            voice_type: data.voice_type && data.voice_type.length > 0 ? data.voice_type : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (profileUpdateError) {
        console.error("Error updating profile in DB:", profileUpdateError);
        showError("Failed to update profile: " + profileUpdateError.message);
        return;
      }

      showSuccess("Member profile updated successfully!");
      setIsEditProfileDialogOpen(false);
      setEditingMember(null);
      setSelectedAvatarFile(null);
      setRemoveAvatarRequested(false);
      queryClient.invalidateQueries({ queryKey: ['adminMembers'] });
      queryClient.invalidateQueries({ queryKey: ['adminProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['profile', editingMember.id] }); // Invalidate specific user's profile
    } catch (error: any) {
      console.error("Unexpected error during profile update:", error);
      showError("An unexpected error occurred: " + error.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

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
      profile.suggestions !== null ||
      (profile.voice_type && profile.voice_type.length > 0)
    );
  };

  if (loadingProfiles) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <Card className="w-full max-w-6xl mx-auto p-6 shadow-lg rounded-xl">
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

  if (fetchError) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <Card className="w-full max-w-6xl mx-auto p-6 shadow-lg rounded-xl text-center">
          <CardTitle className="text-2xl font-lora text-destructive">Error Loading Data</CardTitle>
          <CardDescription className="text-muted-foreground">{fetchError.message}</CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8">
      <h1 className="text-4xl font-bold text-center font-lora">Manage Member Profiles</h1>
      <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
        View and manage all registered member profiles, including their roles.
      </p>

      <Card className="w-full max-w-6xl mx-auto p-6 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-lora">Member List</CardTitle>
          <CardDescription>Change user roles or view their detailed survey responses.</CardDescription>
        </CardHeader>
        <CardContent>
          {profiles && profiles.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-xl font-semibold">No profiles found.</p>
              <p className="mt-2">It looks like no members have registered yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Name</TableHead>
                    <TableHead className="min-w-[220px]">Email</TableHead>
                    <TableHead className="w-[120px]">Role</TableHead>
                    <TableHead className="w-[120px]">Survey Status</TableHead>
                    <TableHead className="text-right w-[200px]">Actions</TableHead> {/* Increased width for new button */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles?.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">
                        <Tooltip>
                          <TooltipTrigger asChild><span className="truncate max-w-[180px] inline-block">{profile.first_name || profile.last_name ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : profile.email || "N/A"}</span></TooltipTrigger>
                          <TooltipContent><p>{profile.first_name || profile.last_name ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : profile.email || "N/A"}</p></TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild><span className="truncate max-w-[220px] inline-block">{profile.email || "N/A"}</span></TooltipTrigger>
                          <TooltipContent><p>{profile.email || "N/A"}</p></TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={profile.is_admin ? "admin" : "user"}
                          onValueChange={(value) => handleAdminStatusChange(profile.id, value === "admin")}
                          disabled={profile.id === user.id || isUpdatingAdminStatus === profile.id || isDeletingUser === profile.id || isSavingProfile}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {hasSurveyResponses(profile) ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">Responded</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedProfile(profile)}
                            disabled={isDeletingUser === profile.id || isSavingProfile}
                          >
                            <Eye className="mr-2 h-4 w-4" /> View Survey
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingMember(profile);
                              setIsEditProfileDialogOpen(true);
                            }}
                            disabled={isDeletingUser === profile.id || isSavingProfile}
                          >
                            <EditIcon className="mr-2 h-4 w-4" /> Edit Profile
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={profile.id === user.id || isDeletingUser === profile.id || isSavingProfile}
                              >
                                {isDeletingUser === profile.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the user account for "{profile.first_name || profile.email}" and all their associated data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(profile.id, profile.first_name || profile.email || "Unknown User")}>
                                  Delete User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      {editingMember && (
        <Dialog open={isEditProfileDialogOpen} onOpenChange={setIsEditProfileDialogOpen}>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-lora">Edit Profile for {editingMember.first_name || editingMember.email}</DialogTitle>
              <CardDescription>Update the personal details for this member.</CardDescription>
            </DialogHeader>
            <Form {...editProfileForm}>
              <form onSubmit={editProfileForm.handleSubmit(handleEditProfileSubmit)} className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-member-email">Email</Label>
                  <Input id="edit-member-email" type="email" value={editingMember.email || ""} disabled className="bg-muted" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-member-first_name">First Name</Label>
                  <Input id="edit-member-first_name" {...editProfileForm.register("first_name")} disabled={isSavingProfile} />
                  {editProfileForm.formState.errors.first_name && (
                    <p className="text-red-500 text-sm">{editProfileForm.formState.errors.first_name.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-member-last_name">Last Name</Label>
                  <Input id="edit-member-last_name" {...editProfileForm.register("last_name")} disabled={isSavingProfile} />
                  {editProfileForm.formState.errors.last_name && (
                    <p className="text-red-500 text-sm">{editProfileForm.formState.errors.last_name.message}</p>
                  )}
                </div>
                <AvatarUpload
                  currentAvatarUrl={editingMember.avatar_url || null}
                  onFileChange={handleAvatarFileChange}
                  onRemoveRequested={handleRemoveAvatarRequested}
                  isSaving={isSavingProfile}
                  selectedFile={selectedAvatarFile}
                />
                <FormField
                  control={editProfileForm.control}
                  name="voice_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voice Type(s)</FormLabel>
                      <FormControl>
                        <VoiceTypeSelector
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isSavingProfile}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" className="w-full" disabled={isSavingProfile}>
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminMembers;