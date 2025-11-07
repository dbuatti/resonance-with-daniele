"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, FileText, Headphones, Link as LinkIcon, ExternalLink, FileSearch, Download, File, ArrowRight, Mic2 } from "lucide-react";
import { Resource } from "@/types/Resource";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
  default: { text: "text-muted-foreground", border: "border-border" },
};

// Define colors for card backgrounds
const resourceCardBackgrounds: { [key: string]: string } = {
  pdf: "bg-pastel-pdf dark:bg-pastel-pdf-dark",
  audio: "bg-pastel-audio dark:bg-pastel-audio-dark",
  link: "bg-pastel-link dark:bg-pastel-link-dark",
  default: "bg-card",
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

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, isAdmin, onEdit, onDelete, onMove }) => {
  
  const isFile = resource.type === 'file';
  const isLink = resource.type === 'url';
  const isPublished = resource.is_published;

  const getFileDetails = () => {
    if (!resource.url) return { icon: <FileText className="h-12 w-12 text-muted-foreground" />, type: 'File', isPdf: false, isAudio: false, fileName: 'N/A' };
    const url = resource.url.toLowerCase();
    const isPdf = url.endsWith('.pdf');
    const isAudio = url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.ogg') || url.endsWith('.m4a');

    // We no longer need to parse the filename from the URL path, we use original_filename
    
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
  const resourcePillType = fileDetails.isPdf ? 'pdf' : fileDetails.isAudio ? 'audio' : isLink ? 'link' : 'default';
  const resourcePillText = fileDetails.isPdf ? 'PDF' : fileDetails.isAudio ? 'Audio' : isLink ? 'Link' : 'File';
  const pillStyle = resourcePillStyles[resourcePillType] || resourcePillStyles.default;
  const cardBackgroundClass = resourceCardBackgrounds[resourcePillType] || resourceCardBackgrounds.default;

  // New unified backdrop style flag
  const useMediaBackdrop = isFile && (fileDetails.isPdf || fileDetails.isAudio);

  // Unified action handler: open URL in new tab (browser handles PDF/Audio/Link)
  const handlePrimaryAction = () => {
    if (resource.url) {
      window.open(resource.url, '_blank');
    }
  };

  const getPrimaryActionText = () => {
    if (isLink) return "View Link";
    if (fileDetails.isPdf) return "View / Download PDF";
    if (fileDetails.isAudio) return "Listen / Download Audio";
    return "View Resource";
  };

  return (
    <Card className={cn(
        "shadow-lg rounded-xl flex flex-col justify-between transition-shadow duration-200 hover:shadow-xl",
        cardBackgroundClass, // Apply pastel background here
        !isPublished && isAdmin && "border-l-4 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20",
      )}>
        
        {/* Main Content Area (Preview for PDF/Audio) */}
        <div className={cn(
          "relative overflow-hidden",
          useMediaBackdrop ? "h-64 rounded-t-xl" : "hidden"
        )}>
          
          {useMediaBackdrop && (
            <div className="relative h-full flex items-center justify-center bg-muted/50 dark:bg-muted/30"> {/* Adjusted dark mode background */}
              
              {/* Content specific to PDF */}
              {fileDetails.isPdf && resource.url && (
                <>
                  {/* PDF Preview Area (Iframe) */}
                  <iframe
                    src={resource.url} // Clean URL
                    title={`Preview of ${resource.title}`}
                    className="w-full border-none absolute left-0 right-0 top-0" 
                    style={{ height: 'calc(100% + 40px)', marginTop: '-40px' }}
                  />

                  {/* Download Button (Bottom Right) */}
                  <Button
                      variant="secondary"
                      size="icon"
                      className="absolute bottom-4 right-4 z-20 h-10 w-10 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={handlePrimaryAction}
                      title="Download / View PDF"
                  >
                      <Download className="h-5 w-5" />
                  </Button>
                </>
              )}

              {/* Content specific to Audio */}
              {fileDetails.isAudio && resource.url && (
                <div className="text-center p-4 w-full">
                  <Headphones className="h-24 w-24 text-primary mx-auto mb-4" />
                  <audio controls src={resource.url} className="w-full max-w-xs mx-auto h-10" />
                  
                  {/* Download Button (Bottom Right - same style as PDF) */}
                  <Button
                      variant="secondary"
                      size="icon"
                      className="absolute bottom-4 right-4 z-20 h-10 w-10 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={handlePrimaryAction}
                      title="Download Audio"
                  >
                      <Download className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Title, Pills, and Description Area (Main Display) */}
        <div className={cn(
          "px-4 pb-2", 
          // If media backdrop is used, increase top padding significantly
          useMediaBackdrop ? "pt-6 bg-card/80 backdrop-blur-sm" : "pt-4 bg-transparent"
        )}>
          
          {/* Header Row: Icon + Title + Pills + Draft Badge */}
          <div className="flex items-center justify-between gap-2 mb-2">
            
            {/* Left Side: Icon + Title */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Icon (Non-Media Backdrop only) */}
                {!useMediaBackdrop && (
                    <div className="bg-primary p-2 rounded-full flex-shrink-0 text-primary-foreground">
                        {isLink ? <LinkIcon className="h-6 w-6" /> : fileDetails.icon}
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

          {/* Original Filename (Admin only, or if description is missing) */}
          {isFile && resource.original_filename && (
            <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
              <span className="font-mono text-foreground/80">File: {resource.original_filename}</span>
            </p>
          )}

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {resource.description || ""}
          </p>
        </div>

        {/* Footer Content (Buttons and Date) */}
        <CardContent className="p-4 pt-2">
          <div className="flex flex-col gap-3">
            {/* Primary Action Button (Visible for all non-admin users) */}
            {!isAdmin && resource.url && (
              <Button 
                onClick={handlePrimaryAction} 
                className="w-full" 
                disabled={!resource.url}
              >
                {isLink ? <ExternalLink className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                <span>{getPrimaryActionText()}</span>
              </Button>
            )}
            
            {isAdmin && (
              <div className="flex justify-end gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onMove(resource)}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Move Resource</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(resource)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit Resource</TooltipContent>
                </Tooltip>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete Resource</TooltipContent>
                    </Tooltip>
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
                      <AlertDialogAction onClick={() => onDelete(resource)}>
                        Delete Resource
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
  );
};

export default ResourceCard;