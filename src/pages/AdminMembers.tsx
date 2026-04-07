"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, Trash2, Edit as EditIcon, Shield, User as UserIcon, Mail, Search, Filter, X, Copy, RefreshCw, Send, ShieldCheck } from "lucide-react";
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
  voice_type: string[] | null;
}

const AdminMembers: React.FC = () => {
  const { user, loading: loadingSession } = useSession();
  const navigate = useNavigate();
  const [isUpdatingAdminStatus, setIsUpdatingAdminStatus] = useState<string | null>(null);
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

  if (loadingProfiles) return <div className="p-20 text-center"><Loader2 className="animate-spin h-12 w-12 mx-auto text-primary" /></div>;
  if (!user || !user.is_admin) return null;

  return (
    <div className="space-y-10 py-8 md:py-12 max-w-6xl mx-auto px-4">
      <BackButton to="/admin" />
      
      <header className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-2">
          <ShieldCheck className="h-4 w-4" />
          <span>Member Directory</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black font-lora tracking-tighter leading-none">The Community</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
          Manage your singers, update roles, and keep your mailing list in sync.
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-6 mb-10 items-center justify-between">
        <div className="relative w-full md:max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 rounded-2xl font-bold shadow-sm border-primary/10 focus-visible:ring-primary"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={handleSyncToKit} 
            disabled={isSyncingToKit}
            className="h-14 px-6 rounded-2xl font-black border-primary/20 text-primary hover:bg-primary/5 shadow-sm"
          >
            {isSyncingToKit ? <><Loader2 className="mr-3 h-5 w-5 animate-spin" /> Syncing...</> : <><Send className="mr-3 h-5 w-5" /> Sync to Kit.com</>}
          </Button>
          <Separator orientation="vertical" className="h-10 hidden md:block" />
          <Select value={roleFilter} onValueChange={(val: any) => setRoleFilter(val)}>
            <SelectTrigger className="w-full md:w-[180px] h-14 rounded-2xl font-black shadow-sm border-primary/10">
              <SelectValue placeholder="Filter Role" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all" className="font-bold">All Roles</SelectItem>
              <SelectItem value="admin" className="font-bold">Admins</SelectItem>
              <SelectItem value="user" className="font-bold">Users</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="w-full soft-shadow border-none overflow-hidden rounded-[2.5rem] animate-fade-in-up">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="pl-10 py-6 text-[10px] font-black uppercase tracking-widest">Member</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Role</TableHead>
                  <TableHead className="text-right pr-10 text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => (
                  <TableRow key={profile.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="pl-10 py-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                          <AvatarImage src={profile.avatar_url || ""} className="object-cover" />
                          <AvatarFallback className="bg-primary/10 text-primary font-black">{(profile.first_name || "U")[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-lg font-black font-lora leading-tight">{profile.first_name} {profile.last_name}</span>
                          <span className="text-sm font-medium text-muted-foreground">{profile.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={profile.is_admin ? "admin" : "user"}
                        onValueChange={(value) => handleAdminStatusChange(profile.id, value === "admin")}
                        disabled={profile.id === user.id || isUpdatingAdminStatus === profile.id}
                      >
                        <SelectTrigger className={cn(
                          "w-[120px] h-9 text-[10px] font-black uppercase tracking-widest rounded-full border-2 transition-all",
                          profile.is_admin ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-transparent"
                        )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="admin" className="font-bold">Admin</SelectItem>
                          <SelectItem value="user" className="font-bold">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" onClick={() => { setEditingMember(profile); setIsEditProfileDialogOpen(true); }}>
                        <EditIcon className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredProfiles.length === 0 && (
            <div className="p-20 text-center">
              <UserIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-10" />
              <p className="text-xl font-bold text-muted-foreground font-lora">No members found matching your search.</p>
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