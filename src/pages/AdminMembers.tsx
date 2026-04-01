"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, Trash2, Edit as EditIcon, Shield, User as UserIcon, Mail, Search, Filter, X, Copy, RefreshCw, Send } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import MemberEditDialog from "@/components/admin/MemberEditDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import BackButton from "@/components/ui/BackButton";
import { Input } from "@/components/ui/input";
import { syncMembersToKit } from "@/utils/kit";
import { Separator } from "@/components/ui/separator"; // Added missing import

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
  const [isSyncingToKit, setIsSyncingToKit] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
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

  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    return profiles.filter(profile => {
      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase();
      const email = (profile.email || '').toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || (roleFilter === "admin" ? profile.is_admin : !profile.is_admin);
      return matchesSearch && matchesRole;
    });
  }, [profiles, searchTerm, roleFilter]);

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

  const handleSyncToKit = async () => {
    if (!profiles || profiles.length === 0) return;
    
    setIsSyncingToKit(true);
    setSyncProgress({ current: 0, total: profiles.length });
    
    try {
      await syncMembersToKit(profiles, (current, total) => {
        setSyncProgress({ current, total });
      });
      showSuccess("Successfully synced all members to Kit.com!");
    } catch (error: any) {
      console.error("Sync error:", error);
      showError(`Failed to sync with Kit: ${error.message}`);
    } finally {
      setIsSyncingToKit(false);
    }
  };

  const handleCopyEmail = (email: string | null) => {
    if (email) {
      navigator.clipboard.writeText(email);
      showSuccess("Email copied to clipboard!");
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
      <div className="max-w-6xl mx-auto px-4">
        <BackButton className="mb-6" to="/admin" />
        
        <header className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold font-lora">Member Directory</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage the Resonance community, update roles, and review member profiles.
          </p>
        </header>

        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl"
            />
            {searchTerm && (
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setSearchTerm("")}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button 
              variant="outline" 
              onClick={handleSyncToKit} 
              disabled={isSyncingToKit || !profiles?.length}
              className="rounded-xl font-bold border-primary/20 text-primary hover:bg-primary/5"
            >
              {isSyncingToKit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing ({syncProgress.current}/{syncProgress.total})
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Sync to Kit.com
                </>
              )}
            </Button>
            <Separator orientation="vertical" className="h-8 hidden md:block" />
            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <Select value={roleFilter} onValueChange={(val: any) => setRoleFilter(val)}>
              <SelectTrigger className="w-full md:w-[150px] rounded-xl">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admins Only</SelectItem>
                <SelectItem value="user">Users Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="w-full shadow-xl border-none overflow-hidden rounded-2xl">
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <CardTitle className="text-2xl font-bold font-lora">All Members</CardTitle>
            <CardDescription>Showing {filteredProfiles.length} of {profiles?.length || 0} members</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredProfiles.length === 0 ? (
              <div className="text-center text-muted-foreground py-20">
                <UserIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-xl font-semibold">No members found matching your criteria.</p>
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
                    {filteredProfiles.map((profile) => {
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
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">{profile.email}</span>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground hover:text-primary" onClick={() => handleCopyEmail(profile.email)}>
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Copy Email</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
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
      </div>

      <MemberEditDialog 
        isOpen={isEditProfileDialogOpen} 
        onOpenChange={setIsEditProfileDialogOpen} 
        member={editingMember} 
      />
    </div>
  );
};

export default AdminMembers;