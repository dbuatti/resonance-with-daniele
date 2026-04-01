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
import { Separator } from "@/components/ui/separator";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  updated_at: string;
  voice_type: string[] | null; // Added to fix TS2741
}

const AdminMembers: React.FC = () => {
  const { user, loading: loadingSession } = useSession();
  const navigate = useNavigate();
  const [isUpdatingAdminStatus, setIsUpdatingAdminStatus] = useState<string | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [isSyncingToKit, setIsSyncingToKit] = useState(false);
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

  const { data: profiles, isLoading: loadingProfiles } = useQuery<Profile[], Error>({
    queryKey: ['adminMembers'],
    queryFn: fetchProfiles,
    enabled: !loadingSession && !!user?.is_admin,
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
    setIsUpdatingAdminStatus(profileId);
    const { error } = await supabase.from("profiles").update({ is_admin: newStatus }).eq("id", profileId);
    if (error) showError(error.message);
    else {
      showSuccess("Role updated!");
      queryClient.invalidateQueries({ queryKey: ['adminMembers'] });
    }
    setIsUpdatingAdminStatus(null);
  };

  const handleSyncToKit = async () => {
    setIsSyncingToKit(true);
    try {
      const result = await syncMembersToKit();
      showSuccess(`Sync complete! ${result.synced} members updated in Kit.`);
    } catch (error: any) {
      console.error("Sync error:", error);
      showError(`Failed to sync: ${error.message}`);
    } finally {
      setIsSyncingToKit(false);
    }
  };

  if (loadingProfiles) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
  if (!user || !user.is_admin) return null;

  return (
    <div className="space-y-8 py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4">
        <BackButton className="mb-6" to="/admin" />
        
        <header className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold font-lora">Member Directory</h1>
          <p className="text-lg text-muted-foreground">Manage the community and sync with Kit.com.</p>
        </header>

        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button 
              variant="outline" 
              onClick={handleSyncToKit} 
              disabled={isSyncingToKit}
              className="rounded-xl font-bold border-primary/20 text-primary"
            >
              {isSyncingToKit ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Syncing...</> : <><Send className="mr-2 h-4 w-4" /> Sync to Kit.com</>}
            </Button>
            <Separator orientation="vertical" className="h-8 hidden md:block" />
            <Select value={roleFilter} onValueChange={(val: any) => setRoleFilter(val)}>
              <SelectTrigger className="w-full md:w-[150px] rounded-xl">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="user">Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="w-full shadow-xl border-none overflow-hidden rounded-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="pl-6 py-4">Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={profile.avatar_url || ""} />
                            <AvatarFallback>{(profile.first_name || "U")[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold">{profile.first_name} {profile.last_name}</span>
                            <span className="text-xs text-muted-foreground">{profile.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={profile.is_admin ? "admin" : "user"}
                          onValueChange={(value) => handleAdminStatusChange(profile.id, value === "admin")}
                          disabled={profile.id === user.id || isUpdatingAdminStatus === profile.id}
                        >
                          <SelectTrigger className="w-[110px] h-8 text-xs font-bold uppercase rounded-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingMember(profile); setIsEditProfileDialogOpen(true); }}>
                          <EditIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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