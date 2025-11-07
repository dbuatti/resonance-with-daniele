"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, FileText, Headphones, Link as LinkIcon, ExternalLink, FileSearch, Download, File, ArrowRight, Mic2, MoreVertical } from "lucide-react";
import { Resource } from "@/types/Resource";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import AudioPlayerCard from './AudioPlayerCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ResourceCardProps {
  resource: Resource;
  isAdmin: boolean | undefined;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
  onMove: (resource: Resource) => void; // New prop for move action
}

// Define colors for voice part pills (using a simple scheme for now)
const voicePartColors: { [key: string]: string } = {
  "Soprano 1": "bg-pink-200 text-pink-800",
  "Soprano 2": "bg-pink-300 text-pink-800",
  "Soprano": "bg-pink-400 text-pink-900",
  "Alto 1": "bg-purple-200 text-purple-800",
  "Alto 2": "bg-purple-300 text-purple-800",
  "Alto": "bg-purple-400 text-purple-900",
  "Tenor 1": "bg-blue-200 text-blue-800",
  "Tenor 2": "bg-blue-300 text-blue-800",
  "Tenor": "bg-blue-400 text-blue-900",
  "Bass 1": "bg-green-200 text-green-800",
  "Bass 2": "bg-green-300 text-green-800",
  "Bass": "bg-green-400 text-green-900",
  "Full Choir": "bg-primary text-primary-foreground",
  "Unison": "bg-indigo-500 text-white",
  "Other": "bg-gray-500 text-white",
};

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, isAdmin, onEdit, onDelete, onMove }) => {
  
  const isFile = resource.type === 'file';
  const isLink = resource.type === 'url';
  const isPublished = resource.is_published;

  const getFileDetails = () => {
    if (!resource.url) return { icon: <FileText className="h-12 w-12 text-muted-foreground" />, type: 'File', isPdf: false, isAudio: false, fileName: 'N/A' };
    const url = resource.url.toLowerCase();
    const isPdf = url.endsWith('.pdf');
    const isAudio = url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.ogg') || url.endsWith('.m4a');

    if (isPdf) {
      return { icon: <FileText className="h-12 w-12 text-primary" />, type: 'File', isPdf, isAudio: false };
    }
    if (isAudio) {
      return { icon: <Headphones className="h-12 w-12 text-primary" />, type: 'File', isPdf: false, isAudio };
    }
    return { icon: <LinkIcon className="h-12 w-12 text-primary" />, type: 'File', isPdf: false, isAudio: false };
  };

  const fileDetails = getFileDetails();

  // Determine resource type for pill
  const resourcePillText = fileDetails.isPdf ? 'PDF' : fileDetails.isAudio ? 'Audio' : isLink ? 'Link' : 'File';

  // Unified action handler: open URL in new tab (browser handles PDF/Audio/Link)
  const handlePrimaryAction = () => {
    if (resource.url) {
      window.open(resource.url, '_blank');
    }
  };

  const getPrimaryActionText = () => {
    if (isLink) return "View External Link";
    if (fileDetails.isPdf) return "Download Sheet Music";
    if (fileDetails.isAudio) return "Download Audio File";
    return "View Resource";
  };

  // Determine if the card should use the AudioPlayerCard component
  const useAudioPlayer = isFile && fileDetails.isAudio && resource.url;

  return (
    <Card className={cn(
        "shadow-lg rounded-xl flex flex-col justify-between transition-shadow duration-200 hover:shadow-xl",
        "bg-card dark:bg-card", // Unified clean background
        !isPublished && isAdmin && "border-l-4 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20",
      )}>
        
        {/* Top Section: Icon/Player and Admin Menu */}
        <div className="relative">
          {useAudioPlayer ? (
            // Audio Player (takes up the top section)
            <AudioPlayerCard 
              src={resource.url!} 
              title={resource.title} 
              onDownload={handlePrimaryAction}
            />
          ) : (
            // Unified Icon/Link/PDF Header (visually matches player height)
            <div 
              className={cn(
                "flex flex-col items-center justify-center p-6 pt-10 rounded-t-xl",
                "bg-muted/50 dark:bg-muted/30", // Matches AudioPlayerCard background
                "h-48" // Fixed height to match visual weight of audio player
              )}
            >
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                {fileDetails.icon}
              </div>
              <p className="text-sm font-semibold text-muted-foreground">
                {resourcePillText} Resource
              </p>
            </div>
          )}

          {/* Admin Context Menu (Three Dots) */}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:bg-muted/80"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(resource)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMove(resource)}>
                  <ArrowRight className="mr-2 h-4 w-4" /> Move to Folder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(resource)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Resource
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {/* Title, Pills, and Description Area (Main Display) */}
        <div className="px-4 pt-4 pb-2 space-y-2">
          
          {/* Title and Pills */}
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-xl font-lora text-foreground my-0 flex-1 min-w-0 line-clamp-2">
              {resource.title}
            </CardTitle>
            
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {/* Voice Part Pill */}
                {resource.voice_part && (
                  <Badge 
                    variant="secondary" 
                    className={cn("text-xs font-semibold", voicePartColors[resource.voice_part] || voicePartColors.Other)}
                  >
                    <Mic2 className="h-3 w-3 mr-1" /> {resource.voice_part}
                  </Badge>
                )}
                
                {/* Resource Type Pill */}
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs font-semibold bg-card border", 
                    fileDetails.isPdf ? "text-red-600 border-red-300" : fileDetails.isAudio ? "text-green-600 border-green-300" : "text-blue-600 border-blue-300"
                  )}
                >
                  {resourcePillText}
                </Badge>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-3">
            {resource.description || "No description provided."}
          </p>
        </div>

        {/* Footer Content (Primary Action Button) */}
        <CardContent className="p-4 pt-2">
          {/* Primary Action Button (Visible for all non-admin users, and for PDF/Link even if admin) */}
          {resource.url && !useAudioPlayer && (
            <Button 
              onClick={handlePrimaryAction} 
              className="w-full" 
              disabled={!resource.url}
            >
              {isLink ? <ExternalLink className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              <span>{getPrimaryActionText()}</span>
            </Button>
          )}
          
          {/* Admin actions are now in the dropdown menu */}
        </CardContent>
      </Card>
  );
};

export default ResourceCard;