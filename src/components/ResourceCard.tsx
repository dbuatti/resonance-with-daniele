"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, FileText, Headphones, Link as LinkIcon, ExternalLink, FileSearch, Download, File } from "lucide-react";
import { Resource } from "@/types/Resource";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ResourceCardProps {
  resource: Resource;
  isAdmin: boolean | undefined;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, isAdmin, onEdit, onDelete }) => {
  
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
      // Use a smaller icon for the top right corner, but the main icon is large
      return { icon: <FileText className="h-6 w-6 text-primary-foreground" />, type: 'PDF Document', isPdf, isAudio: false, fileName };
    }
    if (isAudio) {
      return { icon: <Headphones className="h-12 w-12 text-primary" />, type: 'Audio Track', isPdf: false, isAudio, fileName };
    }
    return { icon: <File className="h-12 w-12 text-muted-foreground" />, type: 'File', isPdf: false, isAudio: false, fileName };
  };

  const fileDetails = getFileDetails();

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
              {/* Custom Header (Solid Dark Area) */}
              <div className="absolute top-0 left-0 right-0 h-16 bg-gray-900 dark:bg-gray-900 p-4 flex items-center justify-between z-10">
                {/* Title (Top Left) - Simplified */}
                <div className="flex items-center gap-3 max-w-[80%]">
                  <CardTitle className="text-2xl font-lora line-clamp-1 text-primary-foreground">{resource.title}</CardTitle>
                </div>
                
                {/* Small PDF Icon (Top Right) */}
                <div className="flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary-foreground/70" />
                </div>
              </div>

              {/* PDF Preview Area (Iframe) */}
              <iframe
                src={resource.url} // Clean URL
                title={`Preview of ${resource.title}`}
                // Start below the header (top-16)
                className="w-full border-none absolute left-0 right-0 top-16" 
                // Height: 100% of container minus header height (64px) + 40px offset (to hide toolbar)
                style={{ height: 'calc(100% - 64px + 40px)', marginTop: '-40px' }}
              />

              {/* New: Overlay Download Button (Bottom Right) */}
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
                    <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                      {fileDetails.icon}
                    </div>
                  )}
                  <CardTitle className="text-xl font-lora line-clamp-2">{resource.title}</CardTitle>
                </div>
                {isAdmin && (
                  <Badge variant={isPublished ? "secondary" : "destructive"} className="text-xs flex-shrink-0">
                    {isPublished ? "Published" : "Draft"}
                  </Badge>
                )}
              </div>
              <CardDescription className="text-sm text-muted-foreground line-clamp-3 min-h-[40px] mt-2">
                {resource.description || (isLink ? "External Link" : fileDetails.type)}
              </CardDescription>
            </CardHeader>
          )}
        </div>
        
        {/* File Name Display (Only for PDF Backdrop Style) */}
        {useBackdropStyle && (
          <div className="px-4 py-2 bg-muted/50 border-t border-border">
            <p className="text-xs font-sans uppercase font-semibold text-muted-foreground truncate">
              {fileDetails.fileName}
            </p>
          </div>
        )}

        {/* Footer Content (Buttons and Date) */}
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            {/* Primary Action Button (Only for non-PDF files) */}
            {!useBackdropStyle && (
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