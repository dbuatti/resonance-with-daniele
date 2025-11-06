"use client";

import React from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Folder, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useSession } from "@/integrations/supabase/auth";
import { ResourceFolder } from "@/types/Resource";
import { cn } from "@/lib/utils";

interface ResourceFolderCardProps {
  folder: ResourceFolder;
  onNavigate: (folderId: string) => void;
  onEdit: (folder: ResourceFolder) => void;
  onDelete: (folderId: string) => void;
  isDeleting: boolean;
}

const ResourceFolderCard: React.FC<ResourceFolderCardProps> = ({
  folder,
  onNavigate,
  onEdit,
  onDelete,
  isDeleting,
}) => {
  const { user } = useSession();
  const isAdmin = user?.is_admin;

  return (
    <Card className="flex flex-col justify-between h-full transition-all duration-300 shadow-md hover:shadow-xl">
      {/* Clickable Area: Massive Folder Icon and Name */}
      <div 
        onClick={() => onNavigate(folder.id)}
        className={cn(
          "p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200",
          "bg-card hover:bg-primary/5 flex-grow rounded-t-lg" // Subtle hover effect
        )}
      >
        {/* Massive Folder Icon */}
        <Folder className="h-32 w-32 text-primary mb-4" /> 
        <CardTitle className="text-2xl font-bold font-lora line-clamp-2 mt-2">
          {folder.name}
        </CardTitle>
      </div>

      {/* Admin Actions (if applicable) - Visually separated footer */}
      {isAdmin && (
        <CardContent className="pt-2 pb-4 flex justify-end gap-2 border-t border-border bg-muted/30 rounded-b-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(folder)}
            disabled={isDeleting}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
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
        </CardContent>
      )}
    </Card>
  );
};

export default ResourceFolderCard;