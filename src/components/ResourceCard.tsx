"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Resource } from "@/types/Resource";

interface ResourceCardProps {
  resource: Resource;
  isAdmin: boolean | undefined;
  onEdit: () => void;
  onDelete: () => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, isAdmin, onEdit, onDelete }) => {
  // Minimal implementation to satisfy the compiler and display basic info
  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle>{resource.title}</CardTitle>
        <CardDescription>{resource.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Type: {resource.type}</p>
        {isAdmin && (
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResourceCard;