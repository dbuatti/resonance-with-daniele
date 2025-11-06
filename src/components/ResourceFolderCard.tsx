"use client";

import React, { useCallback } from "react";
import { CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useSession } from "@/integrations/supabase/auth";
import { ResourceFolder } from "@/types/Resource";
import { cn } from "@/lib/utils";
import { useDropzone } from "react-dropzone";

interface ResourceFolderCardProps {
  folder: ResourceFolder;
  onNavigate: (folderId: string) => void;
  onEdit: (folder: ResourceFolder) => void;
  onDelete: (folderId: string) => void;
  isDeleting: boolean;
  onFileUpload: (file: File, folderId: string) => void;
  isUploading: boolean;
}

const ResourceFolderCard: React.FC<ResourceFolderCardProps> = ({
  folder,
  onNavigate,
  onEdit,
  onDelete,
  isDeleting,
  onFileUpload,
  isUploading,
}) => {
  const { user } = useSession();
  const isAdmin = user?.is_admin;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && isAdmin) {
      onFileUpload(acceptedFiles[0], folder.id);
    }
  }, [isAdmin, folder.id, onFileUpload]);

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true, // Prevent clicking the card from opening the file dialog
    accept: {
      'application/pdf': ['.pdf'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'],
    },
    maxFiles: 1,
    disabled: !isAdmin || isDeleting || isUploading, // Disable if uploading
  });

  // Handle navigation click, ensuring it doesn't trigger if admin actions are clicked
  const handleNavigateClick = (e: React.MouseEvent) => {
    // Check if the click target is one of the action buttons or their children
    const target = e.target as HTMLElement;
    const isActionButton = target.closest('.admin-action-button');
    
    if (!isActionButton) {
      onNavigate(folder.id);
    }
  };

  return (
    <div 
      {...getRootProps()}
      onClick={handleNavigateClick}
      className={cn(
        // Removed border border-border/50. Keeping shadow-md for the contained look.
        "flex flex-col justify-between h-full transition-all duration-300 rounded-xl bg-card shadow-md cursor-pointer",
        "hover:shadow-lg hover:border hover:border-primary/50", // Add border only on hover
        isDragActive && isAdmin && "border-4 border-primary ring-4 ring-primary/50 bg-primary/10",
        isUploading && "opacity-70 cursor-wait",
        isDeleting && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Folder Content Area (Clickable for navigation) */}
      <div 
        className={cn(
          "py-12 px-4 flex flex-col items-center justify-center text-center transition-all duration-200",
          "flex-grow rounded-t-xl"
        )}
      >
        {/* Massive Folder Icon / Image */}
        {isUploading ? (
          <Loader2 className="h-48 w-48 text-primary mb-4 animate-spin" />
        ) : (
          <img 
            src="/images/folder-icon.png" 
            alt="Folder Icon" 
            className="h-48 w-48 object-contain mb-2 text-primary" 
          />
        )}
        <CardTitle className="text-2xl font-bold font-lora line-clamp-2 mt-2">
          {folder.name}
        </CardTitle>
        {isUploading && (
          <p className="text-sm text-primary mt-2 font-semibold">Uploading file...</p>
        )}
      </div>

      {/* Admin Actions (if applicable) - Visually separated footer */}
      {isAdmin && (
        <div className="pt-2 pb-4 px-4 flex justify-end gap-2 border-t border-border bg-muted/30 rounded-b-xl">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(folder)}
            disabled={isDeleting || isUploading}
            className="admin-action-button"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting || isUploading} className="admin-action-button">
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the folder "{folder.name}" and all its contents (sub-folders and resources).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(folder.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};

export default ResourceFolderCard;