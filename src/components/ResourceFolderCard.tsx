"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useSession } from "@/integrations/supabase/auth";

interface ResourceFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface ResourceFolderCardProps {
  folder: ResourceFolder; // Changed to accept the full ResourceFolder object
  onNavigate: (folderId: string) => void;
  onEdit: (folder: ResourceFolder) => void; // Changed to accept the full ResourceFolder object
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
    <Card className="shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-200 flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-medium font-lora flex items-center gap-2">
          <Folder className="h-6 w-6 text-primary" />
          {folder.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button onClick={() => onNavigate(folder.id)} className="w-full">
          Open Folder
        </Button>
        {isAdmin && (
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(folder)} // Pass the full folder object
              disabled={isDeleting}
            >
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete
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
      </CardContent>
    </Card>
  );
};

export default ResourceFolderCard;