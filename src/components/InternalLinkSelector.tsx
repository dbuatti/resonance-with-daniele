"use client";

import React, { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Resource, ResourceFolder } from "@/types/Resource";
import { Loader2, Home, CalendarDays, FileText, Music, Folder, Link as LinkIcon, Mic2, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";

interface InternalLinkSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

// 1. Static Internal Pages
const staticPages = [
  { path: "/", name: "Home (Dashboard)", icon: Home },
  { path: "/events", name: "Events List", icon: CalendarDays },
  { path: "/current-event", name: "Current Event / RSVP", icon: CalendarDays },
  { path: "/resources", name: "Resources Home", icon: FileText },
  { path: "/song-suggestions", name: "Song Suggestions", icon: Music },
  { path: "/profile", name: "My Profile", icon: Home },
  { path: "/profile/survey", name: "My Survey", icon: Home },
  { path: "/learn-more", name: "Learn More", icon: Home },
];

// Helper to get the full path display for a folder (replicated logic)
const getFolderPathDisplay = (folderId: string | null, allFolders: ResourceFolder[] | undefined) => {
  if (folderId === null) return "Home (Root)";
  const folder = allFolders?.find(f => f.id === folderId);
  if (!folder) return "Unknown Folder";

  let path = folder.name;
  let current = folder;
  while (current.parent_folder_id) {
    const parent = allFolders?.find(f => f.id === current.parent_folder_id);
    if (parent) {
      path = `${parent.name} / ${path}`;
      current = parent;
    } else {
      break;
    }
  }
  return path;
};

// Helper to get icon for resource type
const getResourceIcon = (type: Resource['type']) => {
  switch (type) {
    case 'file':
      return FileText;
    case 'lyrics':
      return Mic2;
    case 'youtube':
      return Youtube;
    case 'url':
      return LinkIcon;
    default:
      return FileText;
  }
};

const InternalLinkSelector: React.FC<InternalLinkSelectorProps> = ({ value, onChange, disabled }) => {
  
  // Fetch all folders
  const fetchAllFolders = async (): Promise<ResourceFolder[]> => {
    const { data, error } = await supabase
      .from("resource_folders")
      .select("id, name, parent_folder_id")
      .order("name", { ascending: true });
    if (error) throw new Error("Failed to load folders.");
    return data || [];
  };

  const { data: allFolders, isLoading: loadingFolders } = useQuery<
    ResourceFolder[],
    Error,
    ResourceFolder[],
    ['allResourceFolders']
  >({
    queryKey: ['allResourceFolders'],
    queryFn: fetchAllFolders,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch all resources
  const fetchAllResources = async (): Promise<Resource[]> => {
    const { data, error } = await supabase
      .from("resources")
      .select("id, title, type, folder_id")
      .eq("is_published", true) // Only show published resources
      .order("title", { ascending: true });
    if (error) throw new Error("Failed to load resources.");
    return data || [];
  };

  const { data: allResources, isLoading: loadingResources } = useQuery<
    Resource[],
    Error,
    Resource[],
    ['allPublishedResources']
  >({
    queryKey: ['allPublishedResources'],
    queryFn: fetchAllResources,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = loadingFolders || loadingResources;

  // Combine and structure all links
  const structuredLinks = useMemo(() => {
    const links: { [key: string]: { path: string, name: string, icon: React.ElementType }[] } = {
      static: [],
      folders: [],
      resources: [],
    };

    // 1. Static Pages
    links.static = staticPages;

    // 2. Folders
    if (allFolders) {
      links.folders = allFolders.map(folder => ({
        path: `/resources?folderId=${folder.id}`,
        name: getFolderPathDisplay(folder.id, allFolders),
        icon: Folder,
      }));
    }

    // 3. Resources
    if (allResources) {
      links.resources = allResources.map(resource => {
        const folderPath = resource.folder_id ? ` (${getFolderPathDisplay(resource.folder_id, allFolders)})` : ' (Root)';
        return {
          path: resource.url || `/resources?folderId=${resource.folder_id || ''}`, // Link to resource URL or its folder
          name: `${resource.title}${resource.url ? '' : folderPath}`,
          icon: getResourceIcon(resource.type),
        };
      });
    }

    return links;
  }, [allFolders, allResources]);

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="w-full justify-start">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading links...
      </Button>
    );
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select an internal page or resource" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Static Pages</SelectLabel>
          {structuredLinks.static.map(link => (
            <SelectItem key={link.path} value={window.location.origin + link.path}>
              <div className="flex items-center gap-2">
                <link.icon className="h-4 w-4 text-muted-foreground" /> {link.name}
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
        
        <SelectSeparator />

        <SelectGroup>
          <SelectLabel>Resource Folders</SelectLabel>
          {structuredLinks.folders.map(link => (
            <SelectItem key={link.path} value={window.location.origin + link.path}>
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-muted-foreground" /> {link.name}
              </div>
            </SelectItem>
          ))}
        </SelectGroup>

        <SelectSeparator />

        <SelectGroup>
          <SelectLabel>Published Resources</SelectLabel>
          {structuredLinks.resources.map(link => (
            <SelectItem key={link.path} value={link.path}>
              <div className="flex items-center gap-2">
                <link.icon className="h-4 w-4 text-muted-foreground" /> {link.name}
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default InternalLinkSelector;