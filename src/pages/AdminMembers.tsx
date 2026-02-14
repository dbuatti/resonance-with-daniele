"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, Trash2, Edit as EditIcon, Shield, User as UserIcon, Mail } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import MemberEditDialog from "@/components/admin/MemberEditDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

const AdminMembers: React.FC = () => {
  const { user, loading: loadingSession } = useSession();
  const navigate = useNavigate();
  const [isUpdatingAdminStatus, setIsUpdatingAdminStatus] = useState<string | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Profile | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loadingSession && (!user || !user.is_admin)) {
      navigate("/");
      showError("Access Denied: You must be an administrator to view this page.");
    }
  }, [user, loadingSession, navigate]);

  const fetchProfiles = async (): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*, email")
      .order("updated_at", { ascending: false });

    if (error) throw new Error("Failed to load profiles.");
    return data || [];
  };

  const { data: profiles, isLoading: loadingProfiles, error: fetchError } = useQuery<Profile[], Error>({
    queryKey: ['adminMembers'],
    queryFn: fetchProfiles,
    enabled: !loadingSession && !!user?.is_admin,
    staleTime: 5 * 60 * 1000,
  });

  const handleAdminStatusChange = async (profileId: string, newStatus: boolean) => {
    if (!user || !user.is_admin) return;
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
      showError(`Failed to update admin status: ${error.message}`);
    } else {
      showSuccess(`User role updated to ${newStatus ? "Admin" : "User"}!`);
      queryClient.invalidateQueries({ queryKey: ['adminMembers'] });
    }
    setIsUpdatingAdminStatus(null);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!user || !user.is_admin || userId === user.id) return;

    setIsDeletingUser(userId);
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      showSuccess(`User "${userName}" deleted successfully!`);
      queryClient.invalidateQueries({ queryKey: ['adminMembers'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardCounts'] });
    } catch (error: any) {
      showError(`Failed to delete user: ${error.message}`);
    } finally {
      setIsDeletingUser(null);
    }
  };

  const hasSurveyResponses = (profile: Profile) => {
    return !!(profile.how_heard || profile.singing_experience || (profile.voice_type && profile.voice_type.length > 0));
  };

  if (loadingProfiles) {
    return (
      <div className="space-y-6 py-8">
        <Skeleton className="h-12 w-1/2 mx-auto" />
        <Card className="max-w-6xl mx-auto"><CardContent className="p-8"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!user || !user.is_admin) return null;

  return (
    <div className="space-y-8 py-8 md:py-12">
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-bold font-lora">Member Directory</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Manage the Resonance community, update roles, and review member profiles.
        </p>
      </header>

      <Card className="w-full max-w-6xl mx-auto shadow-xl border-none overflow-hidden rounded-2xl">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="text-2xl font-bold font-lora">All Members</CardTitle>
          <CardDescription>Total registered members: {profiles?.length || 0}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {profiles && profiles.length === 0 ? (
            <div className="text-center text-muted-foreground py-20">
              <UserIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-xl font-semibold">No members found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="pl-6 py-4">Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Survey Status</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles?.map((profile) => {
                    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
                    const displayName = fullName || profile.email?.split('@')[0] || "New Member";
                    
                    return (
                      <TableRow key={profile.id} className="hover:bg-muted/10 transition-colors">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                              <AvatarImage src={profile.avatar_url || ""} className="object-cover" />
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {displayName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground leading-tight">{displayName}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {profile.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={profile.is_admin ? "admin" : "user"}
                              onValueChange={(value) => handleAdminStatusChange(profile.id, value === "admin")}
                              disabled={profile.id === user.id || isUpdatingAdminStatus === profile.id || isDeletingUser === profile.id}
                            >
                              <SelectTrigger className={cn(
                                "w-[110px] h-8 text-xs font-bold uppercase tracking-wider rounded-full border-none shadow-sm",
                                profile.is_admin ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                              )}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                              </SelectContent>
                            </Select>
                            {isUpdatingAdminStatus === profile.id && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          {hasSurveyResponses(profile) ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] uppercase tracking-widest font-bold">Complete</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px] uppercase tracking-widest font-bold">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setEditingMember(profile); setIsEditProfileDialogOpen(true); }}
                              className="h-8 px-3 text-xs font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary"
                            >
                              <EditIcon className="mr-1.5 h-3.5 w-3.5" /> Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  disabled={profile.id === user.id || isDeletingUser === profile.id}
                                  className="h-8 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                >
                                  {isDeletingUser === profile.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Member Account?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove <strong>{displayName}</strong> and all their associated data. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteUser(profile.id, displayName)} className="bg-destructive hover:bg-destructive/90">
                                    Delete Account
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <MemberEditDialog 
        isOpen={isEditProfileDialogOpen} 
        onOpenChange={setIsEditProfileDialogOpen} 
        member={editingMember} 
      />
    </div>
  );
};

export default AdminMembers;