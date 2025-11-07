"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, FileText, Headphones, Link as LinkIcon, Edit, Trash2, Search, Filter, SortAsc, Folder, Home, ChevronRight, AlertCircle, UploadCloud, Mic2, Youtube } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ResourceCard from "@/components/ResourceCard";
import ResourceDialog from "@/components/ResourceDialog";
import ResourceFolderCard from "@/components/ResourceFolderCard";
import ResourceFolderDialog from "@/components/ResourceFolderDialog";
import MoveResourceDialog from "@/components/MoveResourceDialog"; // Import MoveResourceDialog
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Resource, ResourceFolder } from "@/types/Resource"; // Import ResourceFolder
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Link, useSearchParams } from "react-router-dom"; // Import useSearchParams
import { useDropzone } from "react-dropzone"; // Import useDropzone
import { cn } from "@/lib/utils"; // Import cn
import SortableResourceList from "@/components/SortableResourceList"; // Import new component
import { useDebounce } from "@/hooks/use-debounce"; // Import useDebounce

// Define Filter and Sort types
type FilterType = 'all' | 'pdf' | 'audio' | 'link' | 'youtube' | 'lyrics'; // Updated FilterType
type SortBy = 'title' | 'created_at' | 'sort_order'; // Added sort_order
type SortOrder = 'asc' | 'desc';
type VoicePartFilter = string | 'all'; // Includes specific parts and 'all'

const voiceParts = [
  "Soprano 1", "Soprano 2", "Soprano", 
  "Alto 1", "Alto 2", "Alto", 
  "Tenor 1", "Tenor 2", "Tenor", 
  "Bass 1", "Bass 2", "Bass",
  "Full Choir", "Unison", "Other"
];

const Resources: React.FC = () => {
  const { user, loading: loadingSession } = useSession();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams(); // Initialize search params

  // State for current folder navigation, derived from URL
  const currentFolderId = searchParams.get('folderId');

  // Dialog states
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false); // New state for Move dialog
  
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [resourceToMove, setResourceToMove] = useState<Resource | null>(null); // New state for resource to move
  const [editingFolder, setEditingFolder] = useState<ResourceFolder | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<ResourceFolder | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [isUploadingFileToFolder, setIsUploadingFileToFolder] = useState<string | null>(null); // Folder ID being uploaded to

  // Filter/Sort states
  const [searchInput, setSearchInput] = useState(""); // Local state for input field
  const debouncedSearchTerm = useDebounce(searchInput, 300); // Debounced state for query
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterVoicePart, setFilterVoicePart] = useState<VoicePartFilter>('all'); // New state for voice part filter
  const [sortBy, setSortBy] = useState<SortBy>('sort_order'); // Default to custom sort order
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc'); // Custom order is usually ascending

  const isAdmin = user?.is_admin;

  // --- Data Fetching ---

  // 1. Fetch all folders (used for navigation and dialogs)
  const fetchAllFolders = async (): Promise<ResourceFolder[]> => {
    const { data, error } = await supabase
      .from("resource_folders")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw new Error("Failed to load folders.");
    return data || [];
  };

  const { data: allFolders, isLoading: loadingAllFolders, error: foldersError } = useQuery<
    ResourceFolder[],
    Error,
    ResourceFolder[],
    ['allResourceFolders']
  >({
    queryKey: ['allResourceFolders'],
    queryFn: fetchAllFolders,
    enabled: !loadingSession,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // 2. Fetch resources for the current folder
  const fetchResources = async (folderId: string | null, currentSearchTerm: string): Promise<Resource[]> => {
    console.log(`[ResourcesPage] Fetching resources for folder ID: ${folderId} with search: ${currentSearchTerm}`);
    
    let query = supabase
      .from("resources")
      .select("*")
      .order("sort_order", { ascending: true }) // Default sort by custom order
      .order("created_at", { ascending: false }); // Secondary sort

    // If a search term is present, perform a global search (ignore folderId filter)
    if (currentSearchTerm) {
      const searchPattern = `%${currentSearchTerm}%`;
      query = query.or(
        `title.ilike.${searchPattern},description.ilike.${searchPattern},original_filename.ilike.${searchPattern}`
      );
    } else {
      // If no search term, filter by the current folder ID
      if (folderId === null) {
        query = query.is("folder_id", null);
      } else {
        query = query.eq("folder_id", folderId);
      }
    }

    if (!isAdmin) {
      query = query.eq("is_published", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching resources:", error);
      throw new Error("Failed to load resources.");
    }
    return data || [];
  };

  const { data: resources, isLoading: loadingResources, error: fetchError } = useQuery<
    Resource[],
    Error,
    Resource[],
    ['resources', string | null, string] // Query key now includes folderId AND debouncedSearchTerm
  >({
    queryKey: ['resources', currentFolderId, debouncedSearchTerm],
    queryFn: ({ queryKey }) => fetchResources(queryKey[1], queryKey[2]),
    enabled: !loadingSession,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // --- Derived State & Helpers ---

  // Get sub-folders for the current view
  const currentSubFolders = useMemo(() => {
    // Only show subfolders if no search term is active
    if (debouncedSearchTerm) return [];
    return allFolders?.filter(f => f.parent_folder_id === currentFolderId) || [];
  }, [allFolders, currentFolderId, debouncedSearchTerm]);

  // Build Breadcrumbs
  const breadcrumbs = useMemo(() => {
    const crumbs: { id: string | null, name: string }[] = [{ id: null, name: "Home" }];
    let current = allFolders?.find(f => f.id === currentFolderId);

    const path: { id: string | null, name: string }[] = [];
    while (current) {
      path.unshift({ id: current.id, name: current.name });
      current = allFolders?.find(f => f.id === current.parent_folder_id);
    }

    return [...crumbs, ...path];
  }, [allFolders, currentFolderId]);

  // --- File Upload Helpers (Replicated from ResourceDialog for D&D) ---

  const uploadFile = useCallback(async (file: File, resourceId: string): Promise<{ url: string | null, error: Error | null }> => {
    if (!user) return { url: null, error: new Error("User not authenticated.") };

    const fileExt = file.name.split(".").pop();
    const fileName = `${resourceId}/${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadErr } = await supabase.storage
      .from("resources")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadErr) {
      return { url: null, error: uploadErr };
    }

    const { data: publicUrlData } = supabase.storage
      .from("resources")
      .getPublicUrl(filePath);
      
    return { url: publicUrlData?.publicUrl || null, error: null };
  }, [user]);

  const handleFileUploadToFolder = useCallback(async (file: File, folderId: string | null) => {
    if (!isAdmin || !user) {
      showError("You do not have permission to upload files.");
      return;
    }

    // Use a temporary ID for the upload state if uploading to root
    const uploadStateId = folderId || 'root';
    setIsUploadingFileToFolder(uploadStateId);
    const resourceId = crypto.randomUUID();

    try {
      // 1. Upload the file
      const { url: fileUrl, error: uploadError } = await uploadFile(file, resourceId);

      if (uploadError || !fileUrl) {
        throw new Error("File upload failed: " + uploadError?.message);
      }

      // 2. Create the resource metadata entry
      const resourceData = {
        id: resourceId,
        user_id: user.id,
        title: file.name, // Use file name as title
        description: `Uploaded via drag and drop on ${format(new Date(), "PPP")}`,
        url: fileUrl,
        type: 'file' as const,
        is_published: true,
        folder_id: folderId,
        original_filename: file.name, // Store original filename
        sort_order: 0, // Default to 0, will be re-sorted by admin later
      };

      const { error: dbError } = await supabase
        .from("resources")
        .insert(resourceData);

      if (dbError) {
        console.error("Error saving resource metadata after successful upload:", dbError);
        throw new Error("Failed to save resource details after upload: " + dbError.message);
      }

      showSuccess(`File "${file.name}" uploaded successfully!`);
      
      // Invalidate queries for the target folder and the root
      queryClient.invalidateQueries({ queryKey: ['resources', folderId] });
      queryClient.invalidateQueries({ queryKey: ['resources', null] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardCounts'] });

    } catch (error: any) {
      console.error("Drag and drop upload failed:", error);
      showError(error.message || "An unexpected error occurred during file upload.");
    } finally {
      setIsUploadingFileToFolder(null);
    }
  }, [isAdmin, user, queryClient, uploadFile]);

  // --- Dropzone for main content area ---
  const onDropMain = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && isAdmin) {
      handleFileUploadToFolder(acceptedFiles[0], currentFolderId);
    }
  }, [isAdmin, currentFolderId, handleFileUploadToFolder]);

  const { getRootProps: getMainRootProps, isDragActive: isMainDragActive } = useDropzone({
    onDrop: onDropMain,
    noClick: true, // Prevent clicking the main area from opening the file dialog
    accept: {
      'application/pdf': ['.pdf'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'],
    },
    maxFiles: 1,
    disabled: !isAdmin || isUploadingFileToFolder !== null,
  });
  // --- End Dropzone for main content area ---


  // --- Handlers ---

  const handleNavigate = (folderId: string | null) => {
    if (folderId) {
      setSearchParams({ folderId: folderId });
    } else {
      setSearchParams({}); // Clear folderId param to go to root
    }
    setSearchInput(""); // Clear local search input on navigation
  };

  const handleOpenCreateResourceDialog = () => {
    setEditingResource(null);
    setIsResourceDialogOpen(true);
  };

  const handleOpenEditResourceDialog = (resource: Resource) => {
    setEditingResource(resource);
    setIsResourceDialogOpen(true);
  };

  const handleOpenMoveResourceDialog = (resource: Resource) => {
    setResourceToMove(resource);
    setIsMoveDialogOpen(true);
  };

  const handleCloseResourceDialog = () => {
    setIsResourceDialogOpen(false);
    setEditingResource(null);
  };

  const handleCloseMoveDialog = () => {
    setIsMoveDialogOpen(false);
    setResourceToMove(null);
  };

  const handleMoveSuccess = () => {
    // The move dialog handles query invalidation, we just need to close it
    handleCloseMoveDialog();
  };

  const handleOpenCreateFolderDialog = () => {
    setEditingFolder(null);
    setIsFolderDialogOpen(true);
  };

  const handleOpenEditFolderDialog = (folder: ResourceFolder) => {
    setEditingFolder(folder);
    setIsFolderDialogOpen(true);
  };

  const handleCloseFolderDialog = () => {
    setIsFolderDialogOpen(false);
    setEditingFolder(null);
  };

  const handleDeleteResource = async () => {
    if (!resourceToDelete || !isAdmin) return;

    // If the resource is a file, attempt to delete it from storage first
    if (resourceToDelete.type === 'file' && resourceToDelete.url) {
      try {
        const url = new URL(resourceToDelete.url);
        const pathInStorage = url.pathname.split('/resources/')[1];
        
        if (pathInStorage) {
          const { error: storageError } = await supabase.storage
            .from("resources")
            .remove([pathInStorage]);

          if (storageError) {
            showError("Warning: Failed to delete file from storage, but deleting database record.");
          }
        }
      } catch (e) {
        console.error("Error processing file URL for deletion:", e);
      }
    }

    // Delete the database record
    const { error: dbError } = await supabase
      .from("resources")
      .delete()
      .eq("id", resourceToDelete.id);

    if (dbError) {
      console.error("Error deleting resource record:", dbError);
      showError("Failed to delete resource record: " + dbError.message);
    } else {
      showSuccess("Resource deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['resources', currentFolderId] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardCounts'] });
      setResourceToDelete(null);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!isAdmin) return;
    setIsDeletingFolder(true);

    try {
      // Deleting the folder will cascade delete all sub-folders and resources (due to ON DELETE CASCADE)
      const { error } = await supabase
        .from("resource_folders")
        .delete()
        .eq("id", folderId);

      if (error) {
        console.error("Error deleting folder:", error);
        showError("Failed to delete folder: " + error.message);
      } else {
        showSuccess("Folder and all contents deleted successfully!");
        queryClient.invalidateQueries({ queryKey: ['resources'] }); // Invalidate all resources
        queryClient.invalidateQueries({ queryKey: ['allResourceFolders'] }); // Invalidate all folders
        queryClient.invalidateQueries({ queryKey: ['adminDashboardCounts'] });
        
        // If the deleted folder was the current view, navigate to its parent or root
        if (currentFolderId === folderId) {
            const parentFolder = allFolders?.find(f => f.id === folderId)?.parent_folder_id || null;
            handleNavigate(parentFolder);
        } else {
            // If a subfolder was deleted, just invalidate the current view
            queryClient.invalidateQueries({ queryKey: ['resources', currentFolderId] });
        }
        setFolderToDelete(null);
      }
    } catch (e: any) {
      showError("An unexpected error occurred during folder deletion: " + e.message);
    } finally {
      setIsDeletingFolder(false);
    }
  };

  // --- Filtering and Sorting Logic ---
  const filteredAndSortedResources = useMemo(() => {
    if (!resources) return [];

    let filtered = resources;

    // 1. Local Search Filtering (only needed if we fetched globally, but we rely on DB search now)
    // We only apply local filters (type, voice part) here.
    
    // 2. Type Filtering
    if (filterType !== 'all') {
      filtered = filtered.filter(resource => {
        if (filterType === 'link') {
          return resource.type === 'url';
        }
        if (filterType === 'youtube') {
          return resource.type === 'youtube';
        }
        if (filterType === 'lyrics') {
          return resource.type === 'lyrics';
        }
        if (resource.type === 'file' && resource.url) {
          const url = resource.url.toLowerCase();
          if (filterType === 'pdf') return url.endsWith('.pdf');
          if (filterType === 'audio') return url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.ogg') || url.endsWith('.m4a');
        }
        return false;
      });
    }

    // 3. Voice Part Filtering
    if (filterVoicePart !== 'all') {
      filtered = filtered.filter(resource => {
        const resourcePart = resource.voice_part || 'General / Full Choir';
        
        if (filterVoicePart === 'General / Full Choir') {
          return resourcePart === 'Full Choir' || resource.voice_part === null;
        }
        
        return resourcePart === filterVoicePart;
      });
    }


    // 4. Sorting
    if (sortBy !== 'sort_order') {
      filtered.sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'title') {
          comparison = a.title.localeCompare(b.title);
        } else if (sortBy === 'created_at') {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          comparison = dateA - dateB;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });
    } else if (sortBy === 'sort_order') {
        filtered.sort((a, b) => {
            const orderA = a.sort_order ?? 0;
            const orderB = b.sort_order ?? 0;
            return sortOrder === 'asc' ? orderA - orderB : orderB - orderA;
        });
    }

    return filtered;
  }, [resources, filterType, filterVoicePart, sortBy, sortOrder]);
  // --- End Filtering and Sorting Logic ---

  // --- Resource Categorization for Display ---
  const categorizedResources = useMemo(() => {
    const pdf: Resource[] = [];
    const audio: Resource[] = [];
    const links: Resource[] = [];
    const youtube: Resource[] = [];
    const lyrics: Resource[] = [];

    filteredAndSortedResources.forEach(resource => {
        if (resource.type === 'youtube') {
            youtube.push(resource);
        } else if (resource.type === 'lyrics') {
            lyrics.push(resource);
        } else if (resource.type === 'url') {
            links.push(resource);
        } else if (resource.type === 'file' && resource.url) {
            const url = resource.url.toLowerCase();
            if (url.endsWith('.pdf')) {
                pdf.push(resource);
            } else if (url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.ogg') || url.endsWith('.m4a')) {
                audio.push(resource);
            } else {
                // Fallback for other file types, treat as links for now
                links.push(resource);
            }
        }
    });
    return { pdf, audio, links, youtube, lyrics };
  }, [filteredAndSortedResources]);
  // --- End Resource Categorization ---

  const showSkeleton = loadingResources || loadingAllFolders;
  const hasResources = Object.values(categorizedResources).some(arr => arr.length > 0);

  if (loadingSession) {
    return (
      <div className="min-h-[calc(100vh-80px)] p-4">
        <Skeleton className="h-10 w-1/2 mx-auto my-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="shadow-lg rounded-xl">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center shadow-lg rounded-xl border-primary/20 border-2">
          <CardHeader className="flex flex-col items-center">
            <FileText className="h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-2xl font-bold font-lora">Access Required</CardTitle>
            <CardDescription className="text-muted-foreground">
              Please log in to access the choir resources.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (fetchError || foldersError) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl text-destructive">Error Loading Resources</h2>
        <p className="text-muted-foreground">{fetchError?.message || foldersError?.message}</p>
      </div>
    );
  }

  // Helper to render the resource list, using SortableResourceList if admin and sorting by custom order
  const renderResourceList = (resources: Resource[]) => {
    if (isAdmin && sortBy === 'sort_order') {
      return (
        <SortableResourceList
          resources={resources}
          isAdmin={isAdmin}
          currentFolderId={currentFolderId}
          onEdit={handleOpenEditResourceDialog}
          onDelete={(resource) => setResourceToDelete(resource)}
          onMove={handleOpenMoveResourceDialog}
        />
      );
    }

    // Default rendering (used for non-admins or when sorting by other criteria)
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            isAdmin={isAdmin}
            onEdit={handleOpenEditResourceDialog}
            onDelete={(resource) => setResourceToDelete(resource)}
            onMove={handleOpenMoveResourceDialog}
          />
        ))}
      </div>
    );
  };

  const renderResourceSection = (title: string, resources: Resource[]) => {
    if (resources.length === 0) return null;

    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold font-lora text-foreground border-b pb-2 border-border/50">
          {title}
        </h2>
        {renderResourceList(resources)}
      </section>
    );
  };

  return (
    <div className="space-y-8 py-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold font-lora">Member Resources</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Access sheet music, audio tracks, and important links for current and upcoming performances.
        </p>
      </header>

      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumbs */}
        <nav className="mb-4 flex items-center space-x-2 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.id || 'root'}>
              <Button
                variant="link"
                size="sm"
                onClick={() => handleNavigate(crumb.id)}
                className="p-0 h-auto text-primary hover:text-primary/80"
              >
                {crumb.id === null ? <Home className="h-4 w-4 mr-1" /> : <Folder className="h-4 w-4 mr-1" />}
                {crumb.name}
              </Button>
              {index < breadcrumbs.length - 1 && <ChevronRight className="h-4 w-4" />}
            </React.Fragment>
          ))}
        </nav>
        
        {/* Controls Section: Search, Filter, Sort, and Add Buttons */}
        <div className="flex flex-col gap-4 mb-6">
          
          {/* Row 1: Search and Admin CTAs */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/80" />
              <Input
                placeholder="Search resources..."
                value={searchInput} // Use local state for input
                onChange={(e) => setSearchInput(e.target.value)} // Update local state
                className="pl-10 placeholder:text-foreground/70"
                disabled={loadingResources}
              />
            </div>
            
            {isAdmin && (
              <div className="flex gap-4 w-full sm:w-auto justify-end">
                <Button onClick={handleOpenCreateFolderDialog} variant="secondary">
                  <Folder className="mr-2 h-4 w-4" /> Add New Folder
                </Button>
                <Button onClick={handleOpenCreateResourceDialog}>
                  <Plus className="mr-2 h-4 w-4" /> Add New Resource
                </Button>
              </div>
            )}
          </div>

          {/* Row 2: Filters and Sort */}
          <div className="flex flex-wrap gap-3 justify-start sm:justify-end">
            {/* Filter by Type */}
            <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
              <SelectTrigger className={cn("w-[150px]", filterType !== 'all' && "bg-primary/10 border-primary text-primary")}>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pdf">Sheet Music (PDF)</SelectItem>
                <SelectItem value="lyrics">Lyrics (PDF/Text)</SelectItem>
                <SelectItem value="audio">Audio Tracks</SelectItem>
                <SelectItem value="youtube">YouTube Clips</SelectItem>
                <SelectItem value="link">External Links</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter by Voice Part */}
            <Select value={filterVoicePart} onValueChange={(value: VoicePartFilter) => setFilterVoicePart(value)}>
              <SelectTrigger className={cn("w-[180px]", filterVoicePart !== 'all' && "bg-primary/10 border-primary text-primary")}>
                <Mic2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by Part" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Voice Parts</SelectItem>
                <SelectItem value="General / Full Choir">General / Full Choir</SelectItem>
                <Separator />
                {voiceParts.filter(p => p !== "Full Choir" && p !== "Unison" && p !== "Other").map(part => (
                  <SelectItem key={part} value={part}>{part}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(value: SortBy) => {
                setSortBy(value);
                // If switching to custom order, default to asc
                if (value === 'sort_order') setSortOrder('asc');
            }}>
              <SelectTrigger className="w-[150px]">
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                {isAdmin && <SelectItem value="sort_order">Custom Order</SelectItem>}
                <SelectItem value="created_at">Date Added</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order Toggle (Disabled if sorting by custom order) */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={sortOrder === 'asc' ? "Sort Descending" : "Sort Ascending"}
              disabled={sortBy === 'sort_order'}
            >
              <SortAsc className={`h-4 w-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Content Display: Folders then Resources */}
        <div 
          {...getMainRootProps()}
          className={cn(
            "space-y-8 p-4 rounded-xl transition-colors duration-300",
            isMainDragActive && isAdmin && "border-4 border-dashed border-primary/50 bg-primary/5"
          )}
        >
          {isMainDragActive && isAdmin && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl pointer-events-none">
              <div className="text-center p-12 border-4 border-dashed border-primary rounded-xl bg-card/90 shadow-2xl">
                <UploadCloud className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
                <p className="text-2xl font-bold text-primary font-lora">Drop file here to upload to this folder</p>
                <p className="text-muted-foreground mt-2">Only PDF and Audio files are supported.</p>
              </div>
            </div>
          )}

          {/* Folders (Hidden during global search) */}
          {currentSubFolders.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentSubFolders.map((folder) => (
                <ResourceFolderCard
                  key={folder.id}
                  folder={folder}
                  onNavigate={() => handleNavigate(folder.id)}
                  onEdit={handleOpenEditFolderDialog}
                  onDelete={() => setFolderToDelete(folder)}
                  isDeleting={isDeletingFolder}
                  onFileUpload={(file) => handleFileUploadToFolder(file, folder.id)}
                  isUploading={isUploadingFileToFolder === folder.id}
                />
              ))}
            </div>
          )}

          {currentSubFolders.length > 0 && hasResources && !debouncedSearchTerm && <Separator />}

          {/* Categorized Resources - ORDERED AS SPECIFIED */}
          <div className="space-y-10">
            {renderResourceSection(
              "Sheet Music (PDF)",
              categorizedResources.pdf
            )}
            {renderResourceSection(
              "Lyrics Resources",
              categorizedResources.lyrics
            )}
            {renderResourceSection(
              "Audio Resources (Practice Tracks)",
              categorizedResources.audio
            )}
            {renderResourceSection(
              "Video Resources (YouTube Clips)",
              categorizedResources.youtube
            )}
            {renderResourceSection(
              "External Links",
              categorizedResources.links
            )}
          </div>
          
          {/* Empty State */}
          {!hasResources && currentSubFolders.length === 0 && (
              <Card className="p-8 text-center shadow-lg">
                <CardTitle className="text-xl">No Content Found</CardTitle>
                <CardDescription className="mt-2">
                  {debouncedSearchTerm || filterType !== 'all' || filterVoicePart !== 'all'
                    ? "Try adjusting your search or filters."
                    : "This folder is empty. Add a new resource or folder above."}
                </CardDescription>
              </Card>
            )
          }
        </div>
      </div>

      {/* Resource Dialog (Create/Edit) */}
      <ResourceDialog
        isOpen={isResourceDialogOpen}
        onClose={handleCloseResourceDialog}
        editingResource={editingResource}
        currentFolderId={currentFolderId}
      />

      {/* Folder Dialog (Create/Edit) */}
      <ResourceFolderDialog
        isOpen={isFolderDialogOpen}
        onClose={handleCloseFolderDialog}
        editingFolder={editingFolder}
        currentParentFolderId={currentFolderId}
      />

      {/* Move Resource Dialog */}
      <MoveResourceDialog
        isOpen={isMoveDialogOpen}
        onOpenChange={setIsMoveDialogOpen}
        resourceToMove={resourceToMove}
        onMoveSuccess={handleMoveSuccess}
        currentFolderId={currentFolderId}
      />

      {/* Delete Resource Confirmation Dialog */}
      <AlertDialog open={!!resourceToDelete} onOpenChange={(open) => !open && setResourceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Resource Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the resource: <strong>{resourceToDelete?.title}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteResource} className="bg-destructive hover:bg-destructive/90">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Resource
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Folder Confirmation Dialog */}
      <AlertDialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Folder Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you absolutely sure you want to delete the folder: <strong>{folderToDelete?.name}</strong>? This action will permanently delete the folder AND ALL ITS CONTENTS (sub-folders and resources).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteFolder(folderToDelete!.id)} disabled={isDeletingFolder} className="bg-destructive hover:bg-destructive/90">
              {isDeletingFolder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Delete Folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Resources;