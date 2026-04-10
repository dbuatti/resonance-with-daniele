"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useSession } from "@/integrations/supabase/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud, LayoutGrid, ListFilter } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import ResourceCard from "@/components/ResourceCard";
import ResourceDialog from "@/components/ResourceDialog";
import ResourceFolderCard from "@/components/ResourceFolderCard";
import ResourceFolderDialog from "@/components/ResourceFolderDialog";
import MoveResourceDialog from "@/components/MoveResourceDialog";
import { Resource, ResourceFolder } from "@/types/Resource";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { useSearchParams } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import SortableResourceList from "@/components/SortableResourceList";
import { useDebounce } from "@/hooks/use-debounce";
import ResourceBreadcrumbs from "@/components/resources/ResourceBreadcrumbs";
import ResourceControls from "@/components/resources/ResourceControls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PdfListView from "@/components/resources/PdfListView";
import BackButton from "@/components/ui/BackButton";

type FilterType = 'all' | 'pdf' | 'audio' | 'link' | 'youtube' | 'lyrics';
type SortBy = 'title' | 'created_at' | 'sort_order';
type SortOrder = 'asc' | 'desc';
type VoicePartFilter = string | 'all';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const currentFolderId = searchParams.get('folderId');

  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [resourceToMove, setResourceToMove] = useState<Resource | null>(null);
  const [editingFolder, setEditingFolder] = useState<ResourceFolder | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<ResourceFolder | null>(null);
  const [isUploadingFileToFolder, setIsUploadingFileToFolder] = useState<string | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false); // Added missing state

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchTerm = useDebounce(searchInput, 300);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterVoicePart, setFilterVoicePart] = useState<VoicePartFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('sort_order');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const isAdmin = user?.is_admin;

  const fetchAllFolders = async (): Promise<ResourceFolder[]> => {
    const { data, error } = await supabase.from("resource_folders").select("*").order("name", { ascending: true });
    if (error) throw new Error("Failed to load folders.");
    return data || [];
  };

  const { data: allFolders, isLoading: loadingAllFolders } = useQuery<ResourceFolder[], Error, ResourceFolder[], ['allResourceFolders']>({
    queryKey: ['allResourceFolders'],
    queryFn: fetchAllFolders,
    enabled: !loadingSession,
  });

  const fetchResources = async (folderId: string | null, currentSearchTerm: string): Promise<Resource[]> => {
    let query = supabase.from("resources").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
    if (currentSearchTerm) {
      query = query.or(`title.ilike.%${currentSearchTerm}%,description.ilike.%${currentSearchTerm}%,original_filename.ilike.%${currentSearchTerm}%`);
    } else {
      if (folderId === null) query = query.is("folder_id", null);
      else query = query.eq("folder_id", folderId);
    }
    if (!isAdmin) query = query.eq("is_published", true);
    const { data, error } = await query;
    if (error) throw new Error("Failed to load resources.");
    return data || [];
  };

  const { data: resources, isLoading: loadingResources } = useQuery<Resource[], Error, Resource[], ['resources', string | null, string]>({
    queryKey: ['resources', currentFolderId, debouncedSearchTerm],
    queryFn: ({ queryKey }) => fetchResources(queryKey[1], queryKey[2]),
    enabled: !loadingSession,
  });

  const { data: allResourcesForLibrary, isLoading: loadingAllResources } = useQuery<Resource[], Error, Resource[], ['allResourcesForLibrary']>({
    queryKey: ['allResourcesForLibrary'],
    queryFn: async () => {
      let query = supabase.from("resources").select("*").order("created_at", { ascending: false });
      if (!isAdmin) query = query.eq("is_published", true);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !loadingSession,
  });

  const currentSubFolders = useMemo(() => {
    if (debouncedSearchTerm) return [];
    return allFolders?.filter(f => f.parent_folder_id === currentFolderId) || [];
  }, [allFolders, currentFolderId, debouncedSearchTerm]);

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

  const handleNavigate = (folderId: string | null) => {
    if (folderId) setSearchParams({ folderId: folderId });
    else setSearchParams({});
    setSearchInput("");
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setFilterType('all');
    setFilterVoicePart('all');
    setSortBy('sort_order');
    setSortOrder('asc');
  };

  const handleDownload = (resource: Resource) => {
    if (!resource.url) return;
    const link = document.createElement('a');
    link.href = resource.url;
    link.download = resource.original_filename || resource.title; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess(`Downloading ${resource.title}...`);
  };

  const handleToggleNomination = async (folder: ResourceFolder) => {
    if (!isAdmin) return;
    const isNowNominated = !folder.is_nominated_for_dashboard;

    try {
      if (isNowNominated) {
        await supabase
          .from("resource_folders")
          .update({ is_nominated_for_dashboard: false })
          .eq("is_nominated_for_dashboard", true);
      }

      const { error } = await supabase
        .from("resource_folders")
        .update({ is_nominated_for_dashboard: isNowNominated })
        .eq("id", folder.id);

      if (error) throw error;

      showSuccess(isNowNominated ? `"${folder.name}" is now featured on the dashboard!` : `"${folder.name}" removed from dashboard.`);
      queryClient.invalidateQueries({ queryKey: ['allResourceFolders'] });
      queryClient.invalidateQueries({ queryKey: ['nominatedFolder'] });
    } catch (err: any) {
      showError("Failed to update nomination status.");
    }
  };

  const handleFileUploadToFolder = useCallback(async (file: File, folderId: string | null) => {
    if (!isAdmin || !user) return;
    setIsUploadingFileToFolder(folderId || 'root');
    const resourceId = crypto.randomUUID();
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${resourceId}/${Date.now()}.${fileExt}`;
      const { error: uploadErr } = await supabase.storage.from("resources").upload(filePath, file);
      if (uploadErr) throw uploadErr;
      const { data: publicUrlData } = supabase.storage.from("resources").getPublicUrl(filePath);
      const { error: dbError } = await supabase.from("resources").insert({
        id: resourceId, user_id: user.id, title: file.name, description: `Uploaded via drag and drop on ${format(new Date(), "PPP")}`,
        url: publicUrlData.publicUrl, type: 'file', is_published: true, folder_id: folderId, original_filename: file.name, sort_order: 0,
        file_size: file.size,
      });
      if (dbError) throw dbError;
      showSuccess(`File "${file.name}" uploaded successfully!`);
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['allResourcesForLibrary'] });
    } catch (error: any) {
      showError(error.message || "Upload failed.");
    } finally {
      setIsUploadingFileToFolder(null);
    }
  }, [isAdmin, user, queryClient]);

  const onDropMain = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && isAdmin) handleFileUploadToFolder(acceptedFiles[0], currentFolderId);
  }, [isAdmin, currentFolderId, handleFileUploadToFolder]);

  const { getRootProps: getMainRootProps, isDragActive: isMainDragActive } = useDropzone({
    onDrop: onDropMain, noClick: true, accept: { 'application/pdf': ['.pdf'], 'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'] },
    maxFiles: 1, disabled: !isAdmin || isUploadingFileToFolder !== null,
  });

  const filteredAndSortedResources = useMemo(() => {
    if (!resources) return [];
    let filtered = resources;
    if (filterType !== 'all') {
      filtered = filtered.filter(r => {
        if (filterType === 'link') return r.type === 'url';
        if (filterType === 'youtube') return r.type === 'youtube';
        if (filterType === 'lyrics') return r.type === 'lyrics';
        if (r.type === 'file' && r.url) {
          const url = r.url.toLowerCase();
          if (filterType === 'pdf') return url.endsWith('.pdf');
          if (filterType === 'audio') return url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.ogg') || url.endsWith('.m4a');
        }
        return false;
      });
    }
    if (filterVoicePart !== 'all') {
      filtered = filtered.filter(r => (r.voice_part || 'General / Full Choir') === filterVoicePart);
    }
    if (sortBy !== 'sort_order') {
      filtered.sort((a, b) => {
        let comp = sortBy === 'title' ? a.title.localeCompare(b.title) : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return sortOrder === 'asc' ? comp : -comp;
      });
    } else {
      filtered.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }
    return filtered;
  }, [resources, filterType, filterVoicePart, sortBy, sortOrder]);

  const categorizedResources = useMemo(() => {
    const pdf: Resource[] = [], audio: Resource[] = [], links: Resource[] = [], youtube: Resource[] = [], lyrics: Resource[] = [];
    filteredAndSortedResources.forEach(r => {
      if (r.type === 'youtube') youtube.push(r);
      else if (r.type === 'lyrics') lyrics.push(r);
      else if (r.type === 'url') links.push(r);
      else if (r.type === 'file' && r.url) {
        const url = r.url.toLowerCase();
        if (url.endsWith('.pdf')) pdf.push(r);
        else if (url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.ogg') || url.endsWith('.m4a')) audio.push(r);
        else links.push(r);
      }
    });
    return { pdf, audio, links, youtube, lyrics };
  }, [filteredAndSortedResources]);

  const renderResourceSection = (title: string, res: Resource[]) => {
    if (res.length === 0) return null;
    return (
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 bg-primary rounded-full" />
          <h2 className="text-xl font-black font-lora uppercase tracking-widest text-muted-foreground">{title}</h2>
        </div>
        {isAdmin && sortBy === 'sort_order' ? (
          <SortableResourceList resources={res} isAdmin={isAdmin} currentFolderId={currentFolderId} onEdit={setEditingResource} onDelete={setResourceToDelete} onMove={setResourceToMove} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {res.map(r => <ResourceCard key={r.id} resource={r} isAdmin={isAdmin} onEdit={setEditingResource} onDelete={setResourceToDelete} onMove={setResourceToMove} />)}
          </div>
        )}
      </section>
    );
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!isAdmin) return;
    setIsDeletingFolder(true);
    try {
      const { error } = await supabase.from("resource_folders").delete().eq("id", folderId);
      if (error) throw error;
      showSuccess("Folder deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['allResourceFolders'] });
    } catch (err: any) {
      showError("Failed to delete folder: " + err.message);
    } finally {
      setIsDeletingFolder(false);
      setFolderToDelete(null);
    }
  };

  if (loadingSession) return <div className="py-8"><Skeleton className="h-12 w-full rounded-xl" /></div>;

  return (
    <div className="py-8 space-y-12">
      <BackButton to="/" />
      
      <header className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-black font-lora tracking-tighter">Member Resources</h1>
        <p className="text-xl text-muted-foreground max-w-2xl font-medium">Access sheet music, audio tracks, and important links.</p>
      </header>

      <Tabs defaultValue="browse" className="space-y-12">
        <div className="flex justify-center">
          <TabsList className="grid w-full max-w-md grid-cols-2 rounded-2xl h-14 p-1 bg-muted/50">
            <TabsTrigger value="browse" className="rounded-xl font-black flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" /> Browse All
            </TabsTrigger>
            <TabsTrigger value="pdfs" className="rounded-xl font-black flex items-center gap-2">
              <ListFilter className="h-4 w-4" /> PDF Library
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="browse" className="space-y-12">
          <div className="space-y-6">
            <ResourceBreadcrumbs breadcrumbs={breadcrumbs} onNavigate={handleNavigate} />
            <ResourceControls 
              searchInput={searchInput} setSearchInput={setSearchInput} loadingResources={loadingResources}
              isAdmin={isAdmin} onAddFolder={() => setIsFolderDialogOpen(true)} onAddResource={() => setIsResourceDialogOpen(true)}
              filterType={filterType} setFilterType={setFilterType} filterVoicePart={filterVoicePart} setFilterVoicePart={setFilterVoicePart}
              sortBy={sortBy} setSortBy={setSortBy} sortOrder={sortOrder} setSortOrder={setSortOrder} voiceParts={voiceParts}
              onResetFilters={handleResetFilters}
            />
          </div>

          <div {...getMainRootProps()} className={cn("space-y-12 relative min-h-[400px]", isMainDragActive && isAdmin && "border-4 border-dashed border-primary/50 bg-primary/5 rounded-[3rem]")}>
            {isMainDragActive && isAdmin && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-[3rem] pointer-events-none">
                <div className="text-center p-12">
                  <UploadCloud className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
                  <p className="text-2xl font-black text-primary font-lora">Drop file here to upload</p>
                </div>
              </div>
            )}

            {currentSubFolders.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {currentSubFolders.map(f => (
                  <ResourceFolderCard key={f.id} folder={f} onNavigate={() => handleNavigate(f.id)} onEdit={setEditingFolder} onDelete={() => setFolderToDelete(f)} isDeleting={isDeletingFolder} onFileUpload={handleFileUploadToFolder} isUploading={isUploadingFileToFolder === f.id} onToggleNomination={handleToggleNomination} />
                ))}
              </div>
            )}

            {currentSubFolders.length > 0 && Object.values(categorizedResources).some(a => a.length > 0) && <Separator className="opacity-50" />}

            <div className="space-y-16">
              {renderResourceSection("Sheet Music (PDF)", categorizedResources.pdf)}
              {renderResourceSection("Lyrics (PDF/Text)", categorizedResources.lyrics)}
              {renderResourceSection("Audio Resources", categorizedResources.audio)}
              {renderResourceSection("YouTube Clips", categorizedResources.youtube)}
              {renderResourceSection("External Links", categorizedResources.links)}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pdfs" className="space-y-8">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black font-lora">PDF Document Library</h2>
              <p className="text-sm font-medium text-muted-foreground">Showing all PDF resources across all folders.</p>
            </div>
            {loadingAllResources ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : (
              <PdfListView 
                resources={allResourcesForLibrary || []} 
                folders={allFolders || []} 
                onDownload={handleDownload} 
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ResourceDialog isOpen={isResourceDialogOpen} onClose={() => setIsResourceDialogOpen(false)} editingResource={editingResource} currentFolderId={currentFolderId} />
      <ResourceFolderDialog isOpen={isFolderDialogOpen} onClose={() => setIsFolderDialogOpen(false)} editingFolder={editingFolder} currentParentFolderId={currentFolderId} />
      <MoveResourceDialog isOpen={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen} resourceToMove={resourceToMove} onMoveSuccess={() => setIsMoveDialogOpen(false)} currentFolderId={currentFolderId} />
    </div>
  );
};

export default Resources;