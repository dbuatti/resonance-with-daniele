"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Shield,
  CalendarDays,
  Users,
  Inbox,
  Brain,
  ChevronRight,
  ArrowLeft,
  LayoutDashboard,
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
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Five top-level destinations, each an action-oriented label with a clear
 * active state. Feedback now lives as a tab inside Inbox, keeping the
 * primary nav focused and predictable.
 */
const adminLinks = [
  { title: "Command Center", icon: LayoutDashboard, url: "/admin", desc: "Overview" },
  { title: "Events", icon: CalendarDays, url: "/admin/events", desc: "Plan & run" },
  { title: "People", icon: Users, url: "/admin/people", desc: "Community" },
  { title: "Inbox", icon: Inbox, url: "/admin/inbox", desc: "Comms & feedback" },
  { title: "Repertoire", icon: Brain, url: "/admin/repertoire", desc: "Song ideas" },
];

const AdminSidebar: React.FC = () => {
  const { profile } = useSession();
  const location = useLocation();

  const isActive = (url: string) => {
    if (url === "/admin") return location.pathname === "/admin";
    return location.pathname === url || location.pathname.startsWith(`${url}/`);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-2 md:p-4">
        <Link to="/admin" className="flex items-center gap-3 px-2 justify-center md:justify-start">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="font-black font-lora text-lg leading-tight tracking-tighter truncate">
              Admin Console
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/50">
              Resonance
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[11px] font-black uppercase tracking-[0.2em] text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
            Manage
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {adminLinks.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={cn(
                        "h-12 px-4 rounded-xl transition-all duration-200",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-lg shadow-black/20"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-foreground",
                      )}
                    >
                      <Link to={item.url}>
                        <item.icon className={cn("h-5 w-5 shrink-0", active ? "text-sidebar-accent-foreground" : "text-sidebar-foreground")} />
                        <div className="ml-3 flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                          <span className="text-sm font-bold leading-tight truncate">{item.title}</span>
                          <span className="text-[10px] font-medium text-sidebar-foreground/50 leading-tight truncate">
                            {item.desc}
                          </span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50 space-y-4">
        <Button
          asChild
          variant="ghost"
          className="w-full h-11 gap-2 rounded-xl font-bold justify-start text-muted-foreground hover:text-foreground hover:bg-muted group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
        >
          <Link to="/">
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">Back to Site</span>
          </Link>
        </Button>

        <div className="flex items-center justify-between px-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-4">
          <ThemeToggle />
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-14 px-2 rounded-2xl hover:bg-sidebar-accent/20 transition-all group"
            >
              <Link to="/profile" className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border-2 border-background shadow-sm shrink-0">
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

export default AdminSidebar;