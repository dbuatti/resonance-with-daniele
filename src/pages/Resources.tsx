"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, FileText, Headphones, Link as LinkIcon, Edit, Trash2, Search, Filter, SortAsc } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ResourceCard from "@/components/ResourceCard";
import ResourceDialog from "@/components/ResourceDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Resource } from "@/types/Resource";
import { format } from "date-fns";

// Define Filter and Sort types
type FilterType = 'all' | 'pdf' | 'audio' | 'link';
type SortBy = 'title' | 'created_at';
type SortOrder = 'asc' | 'desc';

const Resources: React.FC = () => {
  const { user, loading: loadingSession } = useSession();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortBy>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const isAdmin = user?.is_admin;

  const fetchResources = async (): Promise<Resource[]> => {
    console.log("[ResourcesPage] Fetching resources.");
    let query = supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false }); // Default sort by newest first

    if (!isAdmin) {
      // Only fetch published resources for non-admins
      query = query.eq("is_published", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching resources:", error);
      throw new Error("Failed to load resources.");
    }
    console.log("[ResourcesPage] Resources fetched successfully:", data?.length, "resources.");
    return data || [];
  };

  const { data: resources, isLoading: loadingResources, error: fetchError } = useQuery<
    Resource[],
    Error,
    Resource[],
    ['resources']
  >({
    queryKey: ['resources'],
    queryFn: fetchResources,
    enabled: !loadingSession,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const handleOpenCreateDialog = () => {
    setEditingResource(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (resource: Resource) => {
    setEditingResource(resource);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingResource(null);
    // Re-fetch resources after dialog closes if needed, although the dialog handles invalidation on success
  };

  const handleDeleteResource = async () => {
    if (!resourceToDelete || !isAdmin) return;

    // If the resource is a file, attempt to delete it from storage first
    if (resourceToDelete.type === 'file' && resourceToDelete.url) {
      try {
        const url = new URL(resourceToDelete.url);
        const pathInStorage = url.pathname.split('/resources/')[1];
        
        if (pathInStorage) {
          console.log(`[ResourcesPage] Deleting file from storage: ${pathInStorage}`);
          const { error: storageError } = await supabase.storage
            .from("resources")
            .remove([pathInStorage]);

          if (storageError) {
            console.error("Error deleting file from storage:", storageError);
            // Continue to delete DB record even if storage fails, to prevent orphaned records
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
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardCounts'] }); // Invalidate dashboard count
      setResourceToDelete(null);
    }
  };

  // --- Filtering and Sorting Logic ---
  const filteredAndSortedResources = useMemo(() => {
    if (!resources) return [];

    let filtered = resources;

    // 1. Search Filtering
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(lowerCaseSearch) ||
        resource.description?.toLowerCase().includes(lowerCaseSearch) ||
        resource.folder_path?.toLowerCase().includes(lowerCaseSearch)
      );
    }

    // 2. Type Filtering
    if (filterType !== 'all') {
      filtered = filtered.filter(resource => {
        if (filterType === 'link') {
          return resource.type === 'url';
        }
        // For 'pdf' and 'audio', check the file type based on the URL/type field
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

  if (loadingResources) {
    return (
      <div className="min-h-[calc(100vh-80px)] p-4">
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

  if (fetchError) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl text-destructive">Error Loading Resources</h2>
        <p className="text-muted-foreground">{fetchError.message}</p>
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
        {/* Controls Section: Search, Filter, Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-4 w-full sm:w-auto">
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
          <div className="mb-6 flex justify-end">
            <Button onClick={handleOpenCreateDialog}>
              <Plus className="mr-2 h-4 w-4" /> Add New Resource
            </Button>
          </div>
        )}

        {filteredAndSortedResources.length === 0 ? (
          <Card className="p-8 text-center shadow-lg">
            <CardTitle className="text-xl">No Resources Found</CardTitle>
            <CardDescription className="mt-2">
              {resources?.length === 0
                ? "The resource library is currently empty."
                : "Try adjusting your search, filter, or sort settings."}
            </CardDescription>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                isAdmin={isAdmin}
                onEdit={() => handleOpenEditDialog(resource)}
                onDelete={() => setResourceToDelete(resource)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Resource Dialog (Create/Edit) */}
      <ResourceDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        editingResource={editingResource}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!resourceToDelete} onOpenChange={(open) => !open && setResourceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the resource: <strong>{resourceToDelete?.title}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteResource} className="bg-destructive hover:bg-destructive/90">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Resources;