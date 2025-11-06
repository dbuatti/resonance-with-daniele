"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Resource } from "@/types/Resource";

interface ResourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingResource: Resource | null;
}

const ResourceDialog: React.FC<ResourceDialogProps> = ({ isOpen, onClose, editingResource }) => {
  const title = editingResource ? "Edit Resource" : "Create New Resource";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            {editingResource ? `Editing: ${editingResource.title}` : "Ready to create a new resource."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResourceDialog;