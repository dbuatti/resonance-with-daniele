"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Home, Folder, ChevronRight } from "lucide-react";

interface Breadcrumb {
  id: string | null;
  name: string;
}

interface ResourceBreadcrumbsProps {
  breadcrumbs: Breadcrumb[];
  onNavigate: (folderId: string | null) => void;
}

const ResourceBreadcrumbs: React.FC<ResourceBreadcrumbsProps> = ({ breadcrumbs, onNavigate }) => {
  return (
    <nav className="mb-4 flex items-center space-x-2 text-sm text-muted-foreground">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.id || 'root'}>
          <Button
            variant="link"
            size="sm"
            onClick={() => onNavigate(crumb.id)}
            className="p-0 h-auto text-primary hover:text-primary/80"
          >
            {crumb.id === null ? <Home className="h-4 w-4 mr-1" /> : <Folder className="h-4 w-4 mr-1" />}
            {crumb.name}
          </Button>
          {index < breadcrumbs.length - 1 && <ChevronRight className="h-4 w-4" />}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default ResourceBreadcrumbs;