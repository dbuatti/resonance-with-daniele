"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Edit as EditIcon, User as UserIcon, Search, Send, MessageSquare } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import MemberEditDialog from "@/components/admin/MemberEditDialog";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { syncMembersToKit } from "@/utils/kit";
import { Separator } from "@/components/ui/separator";
import EmailMembersModal from "@/components/admin/EmailMembersModal";

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
  const { user } = useSession();
  const [isUpdatingAdminStatus, setIsUpdatingAdminStatus] = useState<string | null>(null);
  const [isSyncingToKit, setIsSyncingToKit] = useState(false);
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const queryClient = useQueryClient();

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
    enabled: !!user?.is_admin,
  });

  const { data: allOrders } = useQuery({
    queryKey: ["allOrdersForMemberDirectory"],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_orders").select("email, event_id");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.is_admin
  });

  const attendanceMap = useMemo(() => {
    const map: Record<string, number> = {};
    allOrders?.forEach(o => {
      if (!o.email) return;
      const email = o.email.toLowerCase().trim();
      if (!map[email]) map[email] = 0;
      map[email]++;
    });
    return map;
  }, [allOrders]);

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

  const handleDeleteMember = async (profileId: string) => {
    const { error } = await supabase.from("profiles").delete().eq("id", profileId);
    if (error) {
      showError(error.message);
    } else {
      showSuccess("Member removed successfully.");
      queryClient.invalidateQueries({ queryKey: ['adminMembers'] });
    }
  };

  const handleSyncToKit = async () => {
    setIsSyncingToKit(true);
    try {
      const result = await syncMembersToKit();
      showSuccess(`Sync complete! ${result.synced} members updated in Kit.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Sync failed";
      console.error("Sync error:", error);
      showError(`Failed to sync: ${message}`);
    } finally {
      setIsSyncingToKit(false);
    }
  };

  return (
    <AdminPageLayout
      title="The Community"
      description="Manage your singers, update roles, and keep your mailing list in sync."
      badge="Member Directory"
      backTo="/admin"
      isLoading={loadingProfiles}
      loadingMessage="Loading member directory..."
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => setIsEmailModalOpen(true)}
            className="h-12 px-5 rounded-xl font-black border-primary/20 text-primary hover:bg-primary/5 shadow-sm"
          >
            <MessageSquare className="mr-2 h-4 w-4" /> Message All
          </Button>
          <Button
            variant="outline"
            onClick={handleSyncToKit}
            disabled={isSyncingToKit}
            className="h-12 px-5 rounded-xl font-black border-primary/20 text-primary hover:bg-primary/5 shadow-sm"
          >
            <Send className="mr-2 h-4 w-4" /> {isSyncingToKit ? "Syncing..." : "Sync to Kit.com"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 rounded-xl font-bold shadow-sm border-primary/10 focus-visible:ring-primary"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Separator orientation="vertical" className="h-8 hidden md:block" />
          <Select value={roleFilter} onValueChange={(val: "all" | "admin" | "user") => setRoleFilter(val)}>
            <SelectTrigger className="w-full md:w-[160px] h-12 rounded-xl font-black shadow-sm border-primary/10">
              <SelectValue placeholder="Filter Role" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="font-bold">All Roles</SelectItem>
              <SelectItem value="admin" className="font-bold">Admins</SelectItem>
              <SelectItem value="user" className="font-bold">Users</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="w-full soft-shadow border-none overflow-hidden rounded-[2.5rem]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="pl-10 py-6 text-[10px] font-black uppercase tracking-widest">Member</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Attendance</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Role</TableHead>
                  <TableHead className="text-right pr-10 text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => {
                  const attendanceCount = profile.email ? (attendanceMap[profile.email.toLowerCase().trim()] || 0) : 0;
                  return (
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
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "flex items-center justify-center h-8 w-8 rounded-lg font-black text-xs shadow-inner",
                            attendanceCount > 0 ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
                          )}>
                            {attendanceCount}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sessions</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={profile.is_admin ? "admin" : "user"}
                          onValueChange={(value) => handleAdminStatusChange(profile.id, value === "admin")}
                          disabled={profile.id === user?.id || isUpdatingAdminStatus === profile.id}
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
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" onClick={() => { setEditingMember(profile); setIsEditProfileDialogOpen(true); }}>
                            <EditIcon className="h-5 w-5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-[2.5rem]">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Member?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove {profile.first_name || 'this member'} from the community directory.
                                  Their authenticated account will remain, but they will no longer appear in the member list.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteMember(profile.id)} className="rounded-xl font-bold bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
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

      <EmailMembersModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />
    </AdminPageLayout>
  );
};

export default AdminMembers;
