"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, FileText, Headphones, Link as LinkIcon, ExternalLink, FileSearch, Download, File, ArrowRight } from "lucide-react";
import { Resource } from "@/types/Resource";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ResourceCardProps {
  resource: Resource;
  isAdmin: boolean | undefined;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
  onMove: (resource: Resource) => void; // New prop for move action
}

// Define colors for resource type pills
const resourceTypeColors = {
  pdf: "bg-red-500 hover:bg-red-600 text-white",
  audio: "bg-green-500 hover:bg-green-600 text-white",
  link: "bg-blue-500 hover:bg-blue-600 text-white",
  default: "bg-muted text-muted-foreground",
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
    if (!resource.url) return { icon: <FileText className="h-12 w-12 text-muted-foreground" />, type: 'Unknown File', isPdf: false, isAudio: false, fileName: 'N/A' };
    const url = resource.url.toLowerCase();
    const isPdf = url.endsWith('.pdf');
    const isAudio = url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.ogg') || url.endsWith('.m4a');

    // Attempt to extract file name from URL path
    const urlObj = new URL(resource.url);
    const pathSegments = urlObj.pathname.split('/');
    let fileName = pathSegments[pathSegments.length - 1];
    
    // Clean up potential prefixes (UUID/timestamp)
    fileName = fileName.replace(/^\d+-/, '');
    if (fileName.includes('/')) {
        fileName = fileName.split('/').pop() || fileName;
    }
    
    if (isPdf) {
      return { icon: <FileText className="h-6 w-6 text-primary-foreground" />, type: 'PDF Document', isPdf, isAudio: false, fileName };
    }
    if (isAudio) {
      return { icon: <Headphones className="h-6 w-6 text-primary-foreground" />, type: 'Audio Track', isPdf: false, isAudio, fileName };
    }
    return { icon: <File className="h-6 w-6 text-primary-foreground" />, type: 'File', isPdf: false, isAudio: false, fileName };
  };

  const fileDetails = getFileDetails();

  // Determine resource type for pill
  const resourcePillType = fileDetails.isPdf ? 'pdf' : fileDetails.isAudio ? 'audio' : isLink ? 'link' : 'default';
  const resourcePillText = fileDetails.isPdf ? 'PDF' : fileDetails.isAudio ? 'Audio' : isLink ? 'Link' : 'File';
  const resourcePillClass = resourceTypeColors[resourcePillType] || resourceTypeColors.default;

  // Unified action handler: open URL in new tab (browser handles PDF/Audio/Link)
  const handlePrimaryAction = () => {
    if (resource.url) {
      window.open(resource.url, '_blank');
    }
  };

  // Determine the primary button text and icon based on type
  const getPrimaryButtonDetails = () => {
    if (fileDetails.isPdf) {
      return { text: "View / Download PDF", icon: <Download className="h-4 w-4 mr-2" /> };
    }
    if (fileDetails.isAudio) {
      return { text: "Listen to Audio", icon: <Headphones className="h-4 w-4 mr-2" /> };
    }
    if (isLink) {
      return { text: "View Link", icon: <ExternalLink className="h-4 w-4 mr-2" /> };
    }
    return { text: "View Resource", icon: <FileSearch className="h-4 w-4 mr-2" /> };
  };

  const primaryButtonDetails = getPrimaryButtonDetails();

  // Determine if we should use the backdrop style (PDF)
  const useBackdropStyle = isFile && fileDetails.isPdf;

  return (
    <>
      <Card className={cn(
        "shadow-lg rounded-xl flex flex-col justify-between transition-shadow duration-200 hover:shadow-xl",
        !isPublished && isAdmin && "border-l-4 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20"
      )}>
        
        {/* Main Content Area (Header + Preview) */}
        <div className={cn(
          "relative overflow-hidden",
          useBackdropStyle ? "h-64 rounded-t-xl" : "p-6 rounded-xl" // Fixed height for PDF backdrop
        )}>
          
          {useBackdropStyle ? (
            <div className="relative h-full">
              
              {/* PDF Preview Area (Iframe) */}
              <iframe
                src={resource.url} // Clean URL
                title={`Preview of ${resource.title}`}
                // Adjusted positioning: start at top-0
                className="w-full border-none absolute left-0 right-0 top-0" 
                // Adjusted height: 100% of container + 40px offset (to hide toolbar)
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
            </div>
          ) : (
            // Standard Header for Links and Audio/Other Files
            <CardHeader className="p-0 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isLink ? (
                    <LinkIcon className="h-6 w-6 text-primary" />
                  ) : (
                    <div className="bg-primary p-2 rounded-full flex-shrink-0 text-primary-foreground">
                      {fileDetails.icon}
                    </div>
                  )}
                  <CardTitle className="text-xl font-lora line-clamp-2">{resource.title}</CardTitle>
                </div>
                {isAdmin && !isPublished && ( // Only show if admin AND NOT published (i.e., Draft)
                  <Badge variant="destructive" className="text-xs flex-shrink-0">
                    Draft
                  </Badge>
                )}
              </div>
              <CardDescription className="text-sm text-muted-foreground line-clamp-3 min-h-[40px] mt-2">
                {resource.description || (isLink ? "External Link" : fileDetails.type)}
              </CardDescription>
            </CardHeader>
          )}
        </div>
        
        {/* Title, Status, Pills, and Description Area (For PDF Backdrop Style) */}
        <div className={cn("px-4 pt-4 pb-2 bg-card", useBackdropStyle && "pt-0")}>
          <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-xl font-lora line-clamp-1 text-foreground">
                  {resource.title}
              </CardTitle>
              {isAdmin && !isPublished && !useBackdropStyle && ( // Show Draft badge here if not using backdrop style
                  <Badge variant="destructive" className="text-xs flex-shrink-0">
                      Draft
                  </Badge>
              )}
          </div>
          
          {/* Pills Section */}
          <div className="flex flex-wrap gap-2 mb-3">
            {/* Resource Type Pill */}
            <Badge className={cn("text-xs font-semibold", resourcePillClass)}>
              {resourcePillText}
            </Badge>

            {/* Voice Part Pill */}
            {resource.voice_part && (
              <Badge 
                variant="secondary" 
                className={cn("text-xs font-semibold", voicePartColors[resource.voice_part] || voicePartColors.Other)}
              >
                {resource.voice_part}
              </Badge>
            )}
          </div>

          {/* File Name Display for uploaded files */}
          {isFile && fileDetails.fileName !== 'N/A' && (
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <File className="h-3 w-3" />
              <span className="font-mono truncate max-w-[90%]">{fileDetails.fileName}</span>
            </p>
          )}

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {resource.description || (isLink ? "External Link" : fileDetails.type)}
          </p>
        </div>

        {/* Footer Content (Buttons and Date) */}
        <CardContent className="p-4 pt-2">
          <div className="flex flex-col gap-3">
            {/* Audio Player (Inline) */}
            {fileDetails.isAudio && resource.url && (
              <audio controls className="w-full h-10">
                <source src={resource.url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            )}

            {/* Primary Action Button (Only for Links and non-PDF/non-Audio files) */}
            {isLink && (
              <Button 
                onClick={handlePrimaryAction} 
                className="w-full" 
                disabled={!resource.url}
              >
                {primaryButtonDetails.icon}
                <span>{primaryButtonDetails.text}</span>
              </Button>
            )}
            
            {isAdmin && (
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMove(resource)} // New Move action
                >
                  <ArrowRight className="h-4 w-4 mr-2" /> Move
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(resource)}
                >
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => onDelete(resource)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ResourceCard;