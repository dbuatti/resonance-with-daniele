"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  BookOpen, 
  Library, 
  Music, 
  Shield, 
  ChevronRight
} from "lucide-react";
import resonanceLogo from "@/assets/resonance-logo.webp";
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
import { ThemeToggle } from "@/components/ThemeToggle";

const AppSidebar: React.FC = () => {
  const { user, profile, isActualAdmin } = useSession();
  const location = useLocation();

  const memberLinks = [
    { title: "Home", icon: Home, url: "/" },
    { title: "Sessions", icon: BookOpen, url: "/sessions" },
    { title: "The Library", icon: Library, url: "/resources" },
    { title: "Suggestions", icon: Music, url: "/song-suggestions" },
  ];

  const isActive = (url: string) => location.pathname === url;

  if (!user) return null;

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-2 md:p-4">
        <Link to="/" className="flex items-center gap-3 px-2 justify-center md:justify-start">
          <img src={resonanceLogo} alt="Resonance" className="h-9 w-9 rounded-xl shadow-lg shadow-primary/20 shrink-0 object-cover" />
          <span className="font-black font-lora text-xl tracking-tighter group-data-[collapsible=icon]:hidden truncate">
            Resonance
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[11px] font-black uppercase tracking-[0.2em] text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
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
                      <span className="ml-3 text-sm group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isActualAdmin && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="px-4 text-[11px] font-black uppercase tracking-[0.2em] text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
              Administrator
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    tooltip="Admin Console"
                    className={cn(
                      "h-11 px-4 rounded-xl transition-all duration-200",
                      location.pathname.startsWith("/admin")
                        ? "bg-primary text-primary-foreground font-bold shadow-md" 
                        : "text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-foreground"
                    )}
                  >
                    <Link to="/admin">
                      <Shield className={cn("h-5 w-5 shrink-0", location.pathname.startsWith("/admin") ? "text-primary-foreground" : "text-sidebar-foreground")} />
                      <span className="ml-3 text-sm group-data-[collapsible=icon]:hidden">Admin Console</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50 space-y-4">
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

export default AppSidebar;
