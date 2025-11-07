"use client";

import React, { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Resource } from '@/types/Resource';
import ResourceCard from './ResourceCard';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { showError, showSuccess } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableResourceListProps {
  resources: Resource[];
  isAdmin: boolean;
  currentFolderId: string | null;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
  onMove: (resource: Resource) => void;
}

// --- Sortable Item Component ---

interface SortableItemProps {
  resource: Resource;
  isAdmin: boolean;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
  onMove: (resource: Resource) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ resource, isAdmin, onEdit, onDelete, onMove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: resource.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  // If not admin, just render the card normally without drag handles
  if (!isAdmin) {
    return (
      <ResourceCard
        resource={resource}
        isAdmin={isAdmin}
        onEdit={onEdit}
        onDelete={onDelete}
        onMove={onMove}
      />
    );
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "relative cursor-grab",
        isDragging && "shadow-2xl ring-4 ring-primary/50"
      )}
    >
      <ResourceCard
        resource={resource}
        isAdmin={isAdmin}
        onEdit={onEdit}
        onDelete={onDelete}
        onMove={onMove}
        // Pass listeners and attributes to the card wrapper for drag handle
        {...attributes}
        {...listeners}
      />
    </div>
  );
};

// --- Main Sortable List Component ---

const SortableResourceList: React.FC<SortableResourceListProps> = ({
  resources: initialResources,
  isAdmin,
  currentFolderId,
  onEdit,
  onDelete,
  onMove,
}) => {
  const queryClient = useQueryClient();
  const [resources, setResources] = useState(initialResources);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  // Update local state when initial resources change (e.g., filtering/fetching)
  React.useEffect(() => {
    setResources(initialResources);
  }, [initialResources]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = resources.findIndex(r => r.id === active.id);
      const newIndex = resources.findIndex(r => r.id === over?.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // 1. Optimistic UI Update
      const newResources = [...resources];
      const [movedResource] = newResources.splice(oldIndex, 1);
      newResources.splice(newIndex, 0, movedResource);
      setResources(newResources);
      
      // 2. Prepare data for backend update
      const updates = newResources.map((resource, index) => ({
        id: resource.id,
        sort_order: index, // Use the new index as the sort order
      }));

      setIsUpdatingOrder(true);
      
      // 3. Send updates to Supabase
      try {
        const { error } = await supabase
          .from('resources')
          .upsert(updates, { onConflict: 'id' });

        if (error) {
          console.error("Error updating resource order:", error);
          showError("Failed to save new resource order.");
          // Revert optimistic update on failure
          setResources(initialResources);
        } else {
          showSuccess("Resource order saved successfully!");
          // Invalidate query to ensure cache reflects new order, especially if other users are viewing
          queryClient.invalidateQueries({ queryKey: ['resources', currentFolderId] });
        }
      } catch (e: any) {
        console.error("Unexpected error during order update:", e);
        showError("An unexpected error occurred while saving the order.");
        setResources(initialResources);
      } finally {
        setIsUpdatingOrder(false);
      }
    }
  };

  // If not admin, just render the grid normally
  if (!isAdmin) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialResources.map(resource => (
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
    );
  }

  // If admin, render the sortable list
  const resourceIds = resources.map(r => r.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={resourceIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <SortableItem 
              key={resource.id} 
              resource={resource} 
              isAdmin={isAdmin}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))}
        </div>
        {isUpdatingOrder && (
          <div className="fixed bottom-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground p-4 rounded-lg shadow-2xl flex items-center z-50">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving new order...
          </div>
        )}
      </SortableContext>
    </DndContext>
  );
};

export default SortableResourceList;