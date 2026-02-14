"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Mic2, SortAsc, Folder, Plus, X, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ResourceControlsProps {
  searchInput: string;
  setSearchInput: (val: string) => void;
  loadingResources: boolean;
  isAdmin: boolean | undefined;
  onAddFolder: () => void;
  onAddResource: () => void;
  filterType: string;
  setFilterType: (val: any) => void;
  filterVoicePart: string;
  setFilterVoicePart: (val: any) => void;
  sortBy: string;
  setSortBy: (val: any) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (val: 'asc' | 'desc') => void;
  voiceParts: string[];
  onResetFilters: () => void; // New prop
}

const ResourceControls: React.FC<ResourceControlsProps> = ({
  searchInput,
  setSearchInput,
  loadingResources,
  isAdmin,
  onAddFolder,
  onAddResource,
  filterType,
  setFilterType,
  filterVoicePart,
  setFilterVoicePart,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  voiceParts,
  onResetFilters,
}) => {
  const hasActiveFilters = filterType !== 'all' || filterVoicePart !== 'all' || searchInput !== "";

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/80" />
          <Input
            placeholder="Search resources..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 pr-10 placeholder:text-foreground/70"
            disabled={loadingResources}
          />
          {searchInput && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchInput("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {isAdmin && (
          <div className="flex gap-4 w-full sm:w-auto justify-end">
            <Button onClick={onAddFolder} variant="secondary">
              <Folder className="mr-2 h-4 w-4" /> Add New Folder
            </Button>
            <Button onClick={onAddResource}>
              <Plus className="mr-2 h-4 w-4" /> Add New Resource
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 justify-start sm:justify-end items-center">
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onResetFilters}
            className="text-muted-foreground hover:text-primary"
          >
            <RotateCcw className="h-4 w-4 mr-2" /> Reset Filters
          </Button>
        )}

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className={cn("w-[150px]", filterType !== 'all' && "bg-primary/10 border-primary text-primary")}>
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="pdf">Sheet Music (PDF)</SelectItem>
            <SelectItem value="lyrics">Lyrics (PDF/Text)</SelectItem>
            <SelectItem value="audio">Audio Tracks</SelectItem>
            <SelectItem value="youtube">YouTube Clips</SelectItem>
            <SelectItem value="link">External Links</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterVoicePart} onValueChange={setFilterVoicePart}>
          <SelectTrigger className={cn("w-[180px]", filterVoicePart !== 'all' && "bg-primary/10 border-primary text-primary")}>
            <Mic2 className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by Part" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Voice Parts</SelectItem>
            <SelectItem value="General / Full Choir">General / Full Choir</SelectItem>
            <Separator />
            {voiceParts.filter(p => p !== "Full Choir" && p !== "Unison" && p !== "Other").map(part => (
              <SelectItem key={part} value={part}>{part}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px]">
            <SortAsc className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            {isAdmin && <SelectItem value="sort_order">Custom Order</SelectItem>}
            <SelectItem value="created_at">Date Added</SelectItem>
            <SelectItem value="title">Title</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          disabled={sortBy === 'sort_order'}
        >
          <SortAsc className={`h-4 w-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
        </Button>
      </div>
    </div>
  );
};

export default ResourceControls;