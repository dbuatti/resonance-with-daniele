"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, FileText, Headphones, Link as LinkIcon, ExternalLink, FileSearch, Download, File, ArrowRight, Mic2, Youtube, Play, MoreVertical, Copy, Info } from "lucide-react";
import { Resource } from "@/types/Resource";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import AudioPlayerCard from './AudioPlayerCard';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { showSuccess, showError } from "@/utils/toast";

interface ResourceCardProps {
  resource: Resource;
  isAdmin: boolean | undefined;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
  onMove: (resource: Resource) => void; // New prop for move action
}

// Define colors for resource type pills (White background, colored text/border)
const resourcePillStyles: { [key: string]: { text: string, border: string } } = {
  pdf: { text: "text-red-600", border: "border-red-300" },
  audio: { text: "text-green-600", border: "border-green-300" },
  link: { text: "text-blue-600", border: "border-blue-300" },
  youtube: { text: "text-blue-500 dark:text-blue-300", border: "border-blue-300 dark:border-blue-500" }, // Neutral Blue for YouTube
  lyrics: { text: "text-pink-600 dark:text-pink-300", border: "border-pink-300 dark:border-pink-500" }, // Dusty Rose/Pink for Lyrics
  default: { text: "text-muted-foreground", border: "border-border" },
};

// Define colors for card backgrounds and vertical strips
const resourceCardBackgrounds: { [key: string]: { bg: string, strip: string } } = {
  pdf: { bg: "bg-pastel-pdf dark:bg-pastel-pdf-dark", strip: "border-red-500" },
  audio: { bg: "bg-pastel-audio dark:bg-pastel-audio-dark", strip: "border-green-500" },
  link: { bg: "bg-pastel-link dark:bg-pastel-link-dark", strip: "border-blue-500" },
  youtube: { bg: "bg-pastel-youtube dark:bg-pastel-youtube-dark", strip: "border-blue-400" }, // Neutral Blue strip
  lyrics: { bg: "bg-pastel-lyrics dark:bg-pastel-lyrics-dark", strip: "border-pink-400" }, // Dusty Rose/Pink strip
  default: { bg: "bg-card", strip: "border-border" },
};

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

// Helper to extract YouTube video ID and create embed URL
const getYouTubeId = (url: string | null): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  
  if (match && match[2].length === 11) {
    return match[2];
  }
  return null;
};

const getYouTubeEmbedUrl = (id: string): string => {
  return `https://www.youtube.com/embed/${id}?rel=0&showinfo=0&modestbranding=1`;
};

const getYouTubeThumbnailUrl = (id: string): string => {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
};

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, isAdmin, onEdit, onDelete, onMove }) => {
  
  const isFile = resource.type === 'file' || resource.type === 'lyrics';
  const isLink = resource.type === 'url';
  const isYoutube = resource.type === 'youtube';
  const isLyrics = resource.type === 'lyrics';
  const isPublished = resource.is_published;

  const getFileDetails = () => {
    if (!resource.url) return { icon: <FileText className="h-12 w-12 text-muted-foreground" />, type: 'File', isPdf: false, isAudio: false, fileName: 'N/A' };
    const url = resource.url.toLowerCase();
    const isPdf = url.endsWith('.pdf');
    const isAudio = url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.ogg') || url.endsWith('.m4a');

    if (isPdf) {
      return { icon: <FileText className="h-6 w-6 text-primary-foreground" />, type: 'File', isPdf, isAudio: false };
    }
    if (isAudio) {
      return { icon: <Headphones className="h-6 w-6 text-primary-foreground" />, type: 'File', isPdf: false, isAudio };
    }
    return { icon: <File className="h-6 w-6 text-primary-foreground" />, type: 'File', isPdf: false, isAudio: false };
  };

  const fileDetails = getFileDetails();

  // Determine resource type for pill and card background
  let resourcePillType: keyof typeof resourcePillStyles;
  let resourcePillText: string;
  let primaryIcon: React.ReactNode;

  if (isYoutube) {
    resourcePillType = 'youtube';
    resourcePillText = 'Video Clip';
    primaryIcon = <Youtube className="h-6 w-6 text-primary-foreground" />;
  } else if (isLyrics) {
    resourcePillType = 'lyrics';
    resourcePillText = 'Lyrics';
    primaryIcon = <Mic2 className="h-6 w-6 text-primary-foreground" />;
  } else if (isLink) {
    resourcePillType = 'link';
    resourcePillText = 'Link';
    primaryIcon = <LinkIcon className="h-6 w-6 text-primary-foreground" />;
  } else if (isFile) {
    resourcePillType = fileDetails.isPdf ? 'pdf' : fileDetails.isAudio ? 'audio' : 'default';
    resourcePillText = fileDetails.isPdf ? 'PDF' : fileDetails.isAudio ? 'Audio' : 'File';
    primaryIcon = fileDetails.icon;
  } else {
    resourcePillType = 'default';
    resourcePillText = 'Resource';
    primaryIcon = <File className="h-6 w-6 text-primary-foreground" />;
  }

  const pillStyle = resourcePillStyles[resourcePillType] || resourcePillStyles.default;
  const cardStyle = resourceCardBackgrounds[resourcePillType] || resourceCardBackgrounds.default;

  // Unified backdrop style flag: true for PDF, Audio, and YouTube
  const useMediaBackdrop = isFile && (fileDetails.isPdf || fileDetails.isAudio) || isYoutube;
  const youtubeId = isYoutube ? getYouTubeId(resource.url) : null;
  const youtubeEmbedUrl = youtubeId ? getYouTubeEmbedUrl(youtubeId) : null;
  const youtubeThumbnailUrl = youtubeId ? getYouTubeThumbnailUrl(youtubeId) : null;

  // Unified action handler: open URL in new tab (browser handles PDF/Audio/Link)
  const handlePrimaryAction = () => {
    if (!resource.url) return;

    if (isFile && (fileDetails.isPdf || isLyrics)) {
      // For files (PDF/Lyrics PDF), force download using a temporary anchor tag
      const link = document.createElement('a');
      link.href = resource.url;
      // Use the original filename if available, otherwise use the title
      link.download = resource.original_filename || resource.title; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess(`Downloading ${resource.title}...`);
    } else if (isYoutube) {
      // For YouTube, open the direct YouTube link
      window.open(resource.url, '_blank');
    } else {
      // For external links (URL), open in a new tab
      window.open(resource.url, '_blank');
    }
  };

  const handleShare = () => {
    if (resource.url) {
      navigator.clipboard.writeText(resource.url);
      showSuccess("Resource link copied to clipboard!");
    } else {
      showError("Resource does not have a direct link to share.");
    }
  };

  const getPrimaryActionText = () => {
    if (isYoutube) return "View Video Clip";
    if (isLink) return "View External Link";
    if (isLyrics) return "Download Lyrics";
    if (fileDetails.isPdf) return "Download Sheet Music";
    if (fileDetails.isAudio) return "Download Audio File";
    return "View Resource";
  };

  const getPrimaryActionIcon = () => {
    if (isYoutube) return <Play className="h-4 w-4 mr-2" />;
    if (isLink) return <ExternalLink className="h-4 w-4 mr-2" />;
    if (isLyrics || fileDetails.isPdf || fileDetails.isAudio) return <Download className="h-4 w-4 mr-2" />;
    return <FileSearch className="h-4 w-4 mr-2" />;
  };

  return (
    <Card className={cn(
        "shadow-lg rounded-xl flex flex-col justify-between transition-shadow duration-200 hover:shadow-xl relative border-l-4",
        cardStyle.bg, // Apply pastel background here
        cardStyle.strip, // Apply vertical status strip color
        !isPublished && isAdmin && "border-l-4 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20",
      )}>
        
        {/* ADMIN CONTEXT MENU (Absolute Positioned) */}
        {isAdmin && (
          <div className="absolute top-2 right-2 z-20">
            <DropdownMenu>
              <Tooltip>
                <DropdownMenuTrigger asChild>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground/70 hover:text-foreground hover:bg-background/50">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                </DropdownMenuTrigger>
                <TooltipContent>More Actions</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-56">
                
                {/* 1. View Details / File Info (Opens Edit Dialog for now) */}
                <DropdownMenuItem onClick={() => onEdit(resource)}>
                  <Info className="mr-2 h-4 w-4" />
                  <span>View Details / Edit</span>
                </DropdownMenuItem>
                
                {/* 2. Share Resource (Copy Link) */}
                {resource.url && (
                  <DropdownMenuItem onClick={handleShare}>
                    <Copy className="mr-2 h-4 w-4" />
                    <span>Share Resource (Copy Link)</span>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                {/* 3. Move to Folder */}
                <DropdownMenuItem onClick={() => onMove(resource)}>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  <span>Move to Folder</span>
                </DropdownMenuItem>
                
                {/* 4. Delete */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      onSelect={(e) => e.preventDefault()} // Prevent menu closing when opening AlertDialog
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Resource Deletion</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the resource: <strong>{resource.title}</strong>? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(resource)} className="bg-destructive hover:bg-destructive/90">
                        Delete Resource
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Main Content Area (Preview for PDF/Audio/YouTube/Lyrics) */}
        <div className={cn(
          "relative overflow-hidden",
          // Only apply rounded-t-xl if it's a media backdrop
          useMediaBackdrop ? "rounded-t-xl" : "hidden"
        )}>
          
          {useMediaBackdrop && (
            <div className="relative h-full flex items-center justify-center">
              
              {/* Content specific to PDF/Lyrics PDF */}
              {(fileDetails.isPdf || isLyrics) && resource.url && (
                <div 
                  className="relative w-full h-64 cursor-pointer group"
                  onClick={handlePrimaryAction} // Make the preview area clickable
                >
                  {/* PDF Preview Area (Iframe) */}
                  <iframe
                    src={resource.url} // Clean URL
                    title={`Preview of ${resource.title}`}
                    className="w-full border-none absolute left-0 right-0 top-0 pointer-events-none" // Disable interaction on iframe
                    style={{ height: 'calc(100% + 40px)', marginTop: '-40px' }}
                  />

                  {/* Overlay for Clickability */}
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <Button size="lg" className="shadow-xl">
                      <FileSearch className="h-5 w-5 mr-2" /> View Preview
                    </Button>
                  </div>
                </div>
              )}

              {/* Content specific to Audio (NEW CUSTOM PLAYER) */}
              {fileDetails.isAudio && resource.url && (
                <AudioPlayerCard 
                  src={resource.url} 
                  title={resource.title} 
                  onDownload={handlePrimaryAction} // Use the primary action handler for download
                />
              )}

              {/* Content specific to YouTube */}
              {isYoutube && youtubeId && youtubeThumbnailUrl && (
                <div 
                  className="relative w-full aspect-video cursor-pointer group"
                  onClick={handlePrimaryAction} // Make the preview area clickable
                >
                  <img 
                    src={youtubeThumbnailUrl} 
                    alt={`Thumbnail for ${resource.title}`} 
                    className="w-full h-full object-cover"
                  />
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity group-hover:bg-black/40">
                    <Play className="h-16 w-16 text-white fill-white opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Title, Pills, and Description Area (Main Display) */}
        <div className={cn(
          "px-4 pb-2", 
          useMediaBackdrop ? "pt-4 bg-transparent" : "pt-4 bg-transparent"
        )}>
          
          {/* Header Row: Icon + Title + Pills + Draft Badge */}
          <div className="flex items-center justify-between gap-2 mb-2">
            
            {/* Left Side: Icon + Title */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Icon (Non-Media Backdrop only) */}
                {!useMediaBackdrop && (
                    <div className="bg-primary p-2 rounded-full flex-shrink-0 text-primary-foreground">
                        {primaryIcon}
                    </div>
                )}
                
                <div className="flex-1 min-w-0">
                    {/* Title */}
                    <CardTitle className="text-xl font-lora line-clamp-1 text-foreground my-0">
                        {resource.title}
                    </CardTitle>
                </div>
            </div>
            
            {/* Right Side: Pills and Draft Badge */}
            <div className="flex flex-wrap justify-end items-center gap-2 flex-shrink-0">
                {/* Voice Part Pill */}
                {resource.voice_part && (
                  <Badge 
                    variant="secondary" 
                    className={cn("text-xs font-semibold", voicePartColors[resource.voice_part] || voicePartColors.Other)}
                  >
                    {resource.voice_part}
                  </Badge>
                )}
                
                {/* Resource Type Pill */}
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs font-semibold bg-card border", 
                    pillStyle.text, 
                    pillStyle.border
                  )}
                >
                  {resourcePillText}
                </Badge>
                
                {/* Draft Badge (Admin only) */}
                {isAdmin && !isPublished && (
                    <Badge variant="destructive" className="text-xs">
                        Draft
                    </Badge>
                )}
            </div>
          </div>

          {/* Description - Only render if description exists */}
          {resource.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {resource.description}
            </p>
          )}
        </div>

        {/* Footer Content (Buttons and Date) */}
        <CardContent className="p-4 pt-2">
          <div className="flex flex-col gap-3">
            {/* Primary Action Button (Visible for all non-admin users) */}
            {/* Show for PDF, Lyrics, Link, YouTube. Audio uses integrated download button */}
            {!isAdmin && resource.url && (fileDetails.isPdf || isLink || isYoutube || isLyrics) && (
              <Button 
                onClick={handlePrimaryAction} 
                className="w-full" 
                disabled={!resource.url}
              >
                {getPrimaryActionIcon()}
                <span>{getPrimaryActionText()}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
  );
};

export default ResourceCard;