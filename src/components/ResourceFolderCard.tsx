"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useSession } from "@/integrations/supabase/auth";
import { ResourceFolder } from "@/types/Resource"; // Import ResourceFolder type
import { cn } from "@/lib/utils";

interface ResourceFolderCardProps {
  folder: ResourceFolder; // Use imported ResourceFolder type
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
    <Card className="shadow-lg rounded-xl flex flex-col justify-between">
      {/* Clickable Area: Folder Icon and Name */}
      <div 
        onClick={() => onNavigate(folder.id)}
        className={cn(
          "p-6 flex flex-col items-center text-center cursor-pointer transition-all duration-200",
          "hover:bg-muted/50 hover:shadow-inner rounded-t-xl flex-grow"
        )}
      >
        <Folder className="h-16 w-16 text-primary mb-4" /> {/* Large Folder Icon */}
        <CardTitle className="text-xl font-bold font-lora line-clamp-2">
          {folder.name}
        </CardTitle>
      </div>

      {/* Admin Actions (if applicable) */}
      {isAdmin && (
        <CardContent className="pt-2 pb-4 flex justify-end gap-2 border-t border-border">
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