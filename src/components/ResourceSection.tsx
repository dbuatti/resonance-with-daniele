"use client";

import React from "react";
import { Resource } from "@/types/Resource";
import ResourceCard from "./ResourceCard";
import { Separator } from "@/components/ui/separator";

interface ResourceSectionProps {
  title: string;
  resources: Resource[];
  isAdmin: boolean | undefined;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
  onMove: (resource: Resource) => void;
}

const ResourceSection: React.FC<ResourceSectionProps> = ({
  title,
  resources,
  isAdmin,
  onEdit,
  onDelete,
  onMove,
}) => {
  if (resources.length === 0) return null;

  return (
    <section className="space-y-4">
      {/* Minimalist, Left-Aligned Heading */}
      <h2 className="text-2xl font-bold font-lora text-foreground border-b pb-2 border-border/50">
        {title}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            isAdmin={isAdmin}
            onEdit={onEdit}
            onDelete={onDelete}
            onMove={onMove}
          />
        ))}
      </div>
    </section>
  );
};

export default ResourceSection;