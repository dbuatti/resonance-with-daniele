"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Folder } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { showError, showSuccess } from "@/utils/toast";

interface Resource {
  id: string;
  title: string;
  folder_id: string | null;
}

interface ResourceFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
}

interface MoveResourceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  resourceToMove: Resource | null;
  onMoveSuccess: () => void;
  currentFolderId: string | null; // The ID of the folder the user is currently viewing
}

const MoveResourceDialog: React.FC<MoveResourceDialogProps> = ({
  isOpen,
  onOpenChange,
  resourceToMove,
  onMoveSuccess,
  currentFolderId,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all folders for the dropdown
  const fetchAllFolders = async (): Promise<ResourceFolder[]> => {
    console.log("[MoveResourceDialog] Fetching all folders.");
    const { data, error } = await supabase
      .from("resource_folders")
      .select("id, name, parent_folder_id")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching all folders:", error);
      throw new Error("Failed to load folders for moving.");
    }
    return data || [];
  };

  const { data: allFolders, isLoading: loadingFolders, error: foldersError } = useQuery<
    ResourceFolder[],
    Error,
    ResourceFolder[],
    ['allResourceFolders']
  >({
    queryKey: ['allResourceFolders'],
    queryFn: fetchAllFolders,
    enabled: isOpen, // Only fetch when dialog is open
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (isOpen) {
      // Reset selected folder when dialog opens, default to current folder's parent or null
      setSelectedFolder(resourceToMove?.folder_id || null);
    }
  }, [isOpen, resourceToMove]);

  const handleMove = async () => {
    if (!resourceToMove || selectedFolder === undefined) {
      showError("No resource selected or destination folder not chosen.");
      return;
    }

    setIsMoving(true);
    try {
      console.log(`[MoveResourceDialog] Moving resource ${resourceToMove.id} to folder ${selectedFolder}.`);
      const { error } = await supabase
        .from("resources")
        .update({ folder_id: selectedFolder })
        .eq("id", resourceToMove.id);

      if (error) {
        console.error("Error moving resource:", error);
        showError("Failed to move resource: " + error.message);
      } else {
        showSuccess(`Resource "${resourceToMove.title}" moved successfully!`);
        onMoveSuccess();
        onOpenChange(false);
        // Invalidate queries for both old and new folders, and the current view
        queryClient.invalidateQueries({ queryKey: ['resources', resourceToMove.folder_id] }); // Old folder
        queryClient.invalidateQueries({ queryKey: ['resources', selectedFolder] }); // New folder
        queryClient.invalidateQueries({ queryKey: ['resources', currentFolderId] }); // Current view
      }
    } catch (error: any) {
      console.error("Unexpected error during resource move:", error);
      showError("An unexpected error occurred: " + error.message);
    } finally {
      setIsMoving(false);
    }
  };

  const getFolderPathDisplay = (folderId: string | null) => {
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

  // Filter out the current folder and its children to prevent moving a folder into itself
  const getMovableFolders = () => {
    if (!allFolders || !resourceToMove) return [];

    // Get all child folder IDs of the resource's current folder (if it's a folder being moved, not a resource)
    // Since we are moving a resource, we just need to exclude its current folder as a destination
    const foldersToExclude = new Set<string>();
    if (resourceToMove.folder_id) {
      foldersToExclude.add(resourceToMove.folder_id);
    }

    return allFolders.filter(folder => !foldersToExclude.has(folder.id));
  };

  const movableFolders = getMovableFolders();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-lora">Move Resource</DialogTitle>
          <DialogDescription>
            Select a new folder for "{resourceToMove?.title}".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="destination-folder">Destination Folder</Label>
            {loadingFolders ? (
              <Button variant="outline" disabled className="w-full justify-start">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading folders...
              </Button>
            ) : foldersError ? (
              <p className="text-destructive text-sm">Error loading folders.</p>
            ) : (
              <Select
                value={selectedFolder || ""}
                onValueChange={(value) => setSelectedFolder(value === "null" ? null : value)}
                disabled={isMoving}
              >
                <SelectTrigger id="destination-folder">
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-muted-foreground" /> Home (Root)
                    </div>
                  </SelectItem>
                  {movableFolders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-muted-foreground" /> {getFolderPathDisplay(folder.id)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isMoving}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={isMoving || !resourceToMove || selectedFolder === undefined}>
            {isMoving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Moving...
              </>
            ) : (
              "Move Resource"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveResourceDialog;