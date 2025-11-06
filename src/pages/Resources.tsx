"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, FileText, Headphones, Link as LinkIcon, Edit, Trash2, Search, Filter, SortAsc, Folder, Home, ChevronRight, AlertCircle } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ResourceCard from "@/components/ResourceCard";
import ResourceDialog from "@/components/ResourceDialog";
import ResourceFolderCard from "@/components/ResourceFolderCard";
import ResourceFolderDialog from "@/components/ResourceFolderDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Resource, ResourceFolder } from "@/types/Resource"; // Import ResourceFolder
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";

// Define Filter and Sort types
type FilterType = 'all' | 'pdf' | 'audio' | 'link';
type SortBy = 'title' | 'created_at';
type SortOrder = 'asc' | 'desc';

const Resources: React.FC = () => {
  const { user, loading: loadingSession } = useSession();
  const queryClient = useQueryClient();

  // State for current folder navigation
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Dialog states
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editingFolder, setEditingFolder] = useState<ResourceFolder | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<ResourceFolder | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);

  // Filter/Sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortBy>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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
  const fetchResources = async (folderId: string | null): Promise<Resource[]> => {
    console.log(`[ResourcesPage] Fetching resources for folder ID: ${folderId}`);
    let query = supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });

    // FIX: Use is.null for root folder (folderId === null)
    if (folderId === null) {
      query = query.is("folder_id", null);
    } else {
      query = query.eq("folder_id", folderId);
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
    ['resources', string | null]
  >({
    queryKey: ['resources', currentFolderId],
    queryFn: ({ queryKey }) => fetchResources(queryKey[1]),
    enabled: !loadingSession,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // --- Derived State & Helpers ---

  // Get sub-folders for the current view
  const currentSubFolders = useMemo(() => {
    return allFolders?.filter(f => f.parent_folder_id === currentFolderId) || [];
  }, [allFolders, currentFolderId]);

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

  // --- Handlers ---

  const handleNavigate = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSearchTerm(""); // Clear search on navigation
  };

  const handleOpenCreateResourceDialog = () => {
    setEditingResource(null);
    setIsResourceDialogOpen(true);
  };

  const handleOpenEditResourceDialog = (resource: Resource) => {
    setEditingResource(resource);
    setIsResourceDialogOpen(true);
  };

  const handleCloseResourceDialog = () => {
    setIsResourceDialogOpen(false);
    setEditingResource(null);
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
        setCurrentFolderId(null); // Navigate back to root
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

    // 1. Search Filtering (only applies to resources in the current view)
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(lowerCaseSearch) ||
        resource.description?.toLowerCase().includes(lowerCaseSearch)
      );
    }

    // 2. Type Filtering
    if (filterType !== 'all') {
      filtered = filtered.filter(resource => {
        if (filterType === 'link') {
          return resource.type === 'url';
        }
        if (resource.type === 'file' && resource.url) {
          const url = resource.url.toLowerCase();
          if (filterType === 'pdf') return url.endsWith('.pdf');
          if (filterType === 'audio') return url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.ogg') || url.endsWith('.m4a');
        }
        return false;
      });
    }

    // 3. Sorting
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

    return filtered;
  }, [resources, searchTerm, filterType, sortBy, sortOrder]);
  // --- End Filtering and Sorting Logic ---

  const showSkeleton = loadingResources || loadingAllFolders;

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

  return (
    <div className="space-y-8 py-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold font-lora">Member Resources</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
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
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-4 w-full sm:w-auto justify-end">
              {/* Filter by Type */}
              <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pdf">PDF (Sheet Music)</SelectItem>
                  <SelectItem value="audio">Audio Tracks</SelectItem>
                  <SelectItem value="link">External Links</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
                <SelectTrigger className="w-[150px]">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Added</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={sortOrder === 'asc' ? "Sort Descending" : "Sort Ascending"}
              >
                <SortAsc className={`h-4 w-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end gap-4">
              <Button onClick={handleOpenCreateFolderDialog} variant="secondary">
                <Folder className="mr-2 h-4 w-4" /> Add New Folder
              </Button>
              <Button onClick={handleOpenCreateResourceDialog}>
                <Plus className="mr-2 h-4 w-4" /> Add New Resource
              </Button>
            </div>
          )}
        </div>

        {/* Content Display: Folders then Resources */}
        <div className="space-y-8">
          {/* Folders */}
          {currentSubFolders.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentSubFolders.map((folder) => (
                <ResourceFolderCard
                  key={folder.id}
                  folder={folder}
                  onNavigate={() => handleNavigate(folder.id)}
                  onEdit={handleOpenEditFolderDialog}
                  onDelete={(id) => setFolderToDelete(folder)}
                  isDeleting={isDeletingFolder}
                />
              ))}
            </div>
          )}

          {currentSubFolders.length > 0 && filteredAndSortedResources.length > 0 && <Separator />}

          {/* Resources */}
          {filteredAndSortedResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  isAdmin={isAdmin}
                  onEdit={() => handleOpenEditResourceDialog(resource)}
                  onDelete={() => setResourceToDelete(resource)}
                />
              ))}
            </div>
          ) : (
            currentSubFolders.length === 0 && (
              <Card className="p-8 text-center shadow-lg">
                <CardTitle className="text-xl">No Content Found</CardTitle>
                <CardDescription className="mt-2">
                  {searchTerm || filterType !== 'all'
                    ? "Try adjusting your search or filters."
                    : "This folder is empty. Add a new resource or folder above."}
                </CardDescription>
              </Card>
            )
          )}
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