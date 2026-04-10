"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  BookOpen, 
  Library, 
  Music, 
  Shield, 
  Rocket, 
  TrendingUp, 
  Users, 
  MessageSquareQuote, 
  BellRing,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles,
  CalendarDays
} from "lucide-react";
import { useSession } from "@/integrations/supabase/auth";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import AdminViewToggle from "@/components/AdminViewToggle";

const AppSidebar: React.FC = () => {
  const { user, profile, logout, isAdminView, isActualAdmin } = useSession();
  const location = useLocation();

  const memberLinks = [
    { title: "Home", icon: Home, url: "/" },
    { title: "Sessions", icon: BookOpen, url: "/sessions" },
    { title: "The Library", icon: Library, url: "/resources" },
    { title: "Suggestions", icon: Music, url: "/song-suggestions" },
  ];

  const adminLinks = [
    { title: "Command Center", icon: Shield, url: "/admin" },
    { title: "Manage Events", icon: CalendarDays, url: "/events" },
    { title: "Growth", icon: Rocket, url: "/admin/growth" },
    { title: "Marketing", icon: TrendingUp, url: "/admin/marketing-plan" },
    { title: "Members", icon: Users, url: "/admin/members" },
    { title: "Feedback", icon: MessageSquareQuote, url: "/admin/feedback" },
    { title: "Updates", icon: BellRing, url: "/admin/announcements" },
  ];

  const isActive = (url: string) => location.pathname === url;

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-3 px-2">
          <div className="bg-primary rounded-xl p-2 shadow-lg shadow-primary/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-black font-lora text-xl tracking-tighter group-data-[collapsible=icon]:hidden">
            Resonance
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[11px] font-black uppercase tracking-[0.2em] text-sidebar-foreground/50">
            Member Hub
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {memberLinks.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className={cn(
                      "h-11 px-4 rounded-xl transition-all duration-200",
                      isActive(item.url) 
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold" 
                        : "text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-foreground"
                    )}
                  >
                    <Link to={item.url}>
                      <item.icon className={cn("h-5 w-5 shrink-0", isActive(item.url) ? "text-sidebar-accent-foreground" : "text-sidebar-foreground")} />
                      <span className="ml-3 text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.is_admin && isAdminView && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="px-4 text-[11px] font-black uppercase tracking-[0.2em] text-sidebar-accent/70">
              Admin Zone
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminLinks.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                      className={cn(
                        "h-11 px-4 rounded-xl transition-all duration-200",
                        isActive(item.url) 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-lg shadow-black/20" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-foreground"
                      )}
                    >
                      <Link to={item.url}>
                        <item.icon className={cn("h-5 w-5 shrink-0", isActive(item.url) ? "text-sidebar-accent-foreground" : "text-sidebar-foreground")} />
                        <span className="ml-3 text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50 space-y-4">
        <div className="flex items-center justify-between px-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-4">
          {isActualAdmin && <AdminViewToggle />}
          <ThemeToggle />
        </div>
        
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              className="h-14 px-2 rounded-2xl hover:bg-sidebar-accent/20 transition-all group"
            >
              <Link to="/profile" className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                  <AvatarImage src={profile?.avatar_url || ""} className="object-cover" />
                  <AvatarFallback className="bg-sidebar-accent/20 text-sidebar-accent font-black text-xs">
                    {profile?.first_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-black truncate text-sidebar-foreground">
                    {profile?.first_name || "My Account"}
                  </span>
                  <span className="text-[10px] font-bold text-sidebar-foreground/50 uppercase tracking-widest">
                    View Profile
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 ml-auto text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;