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
    if (!resource.url) return { icon: <FileText className="h-12 w-12 text-muted-foreground" />, type: 'File', isPdf: false, isAudio: false, fileName: 'N/A' };
    const url = resource.url.toLowerCase();
    const isPdf = url.endsWith('.pdf');
    const isAudio = url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.ogg') || url.endsWith('.m4a');

    // Attempt to extract file name from URL path (kept for internal logic, but not displayed)
    const urlObj = new URL(resource.url);
    const pathSegments = urlObj.pathname.split('/');
    let fileName = pathSegments[pathSegments.length - 1];
    
    fileName = fileName.replace(/^\d+-/, '');
    if (fileName.includes('/')) {
        fileName = fileName.split('/').pop() || fileName;
    }
    
    if (isPdf) {
      return { icon: <FileText className="h-6 w-6 text-primary-foreground" />, type: 'File', isPdf, isAudio: false, fileName };
    }
    if (isAudio) {
      return { icon: <Headphones className="h-6 w-6 text-primary-foreground" />, type: 'File', isPdf: false, isAudio, fileName };
    }
    return { icon: <File className="h-6 w-6 text-primary-foreground" />, type: 'File', isPdf: false, isAudio: false, fileName };
  };

  const fileDetails = getFileDetails();

  // Determine resource type for pill
  const resourcePillType = fileDetails.isPdf ? 'pdf' : fileDetails.isAudio ? 'audio' : isLink ? 'link' : 'default';
  const resourcePillText = fileDetails.isPdf ? 'PDF' : fileDetails.isAudio ? 'Audio' : isLink ? 'Link' : 'File';
  const resourcePillClass = resourceTypeColors[resourcePillType] || resourceTypeColors.default;

  // New unified backdrop style flag
  const useMediaBackdrop = isFile && (fileDetails.isPdf || fileDetails.isAudio);

  // Unified action handler: open URL in new tab (browser handles PDF/Audio/Link)
  const handlePrimaryAction = () => {
    if (resource.url) {
      window.open(resource.url, '_blank');
    }
  };

  return (
    <>
      <Card className={cn(
        "shadow-lg rounded-xl flex flex-col justify-between transition-shadow duration-200 hover:shadow-xl",
        !isPublished && isAdmin && "border-l-4 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20"
      )}>
        
        {/* Main Content Area (Preview for PDF/Audio) */}
        <div className={cn(
          "relative overflow-hidden",
          useMediaBackdrop ? "h-64 rounded-t-xl" : "hidden" // Use useMediaBackdrop
        )}>
          
          {useMediaBackdrop && (
            <div className="relative h-full flex items-center justify-center bg-muted/50">
              
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
                  <p className="text-lg font-semibold text-foreground mb-4 line-clamp-1">{resource.title}</p>
                  <audio controls src={resource.url} className="w-full max-w-xs mx-auto h-10" />
                  
                  {/* Download Button for Audio */}
                  <Button
                      variant="secondary"
                      size="sm"
                      className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={handlePrimaryAction}
                      title="Download Audio"
                  >
                      <Download className="h-4 w-4 mr-2" /> Download Audio
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Title, Pills, and Description Area (Main Display) */}
        <div className={cn("px-4 pt-4 pb-2 bg-card", useMediaBackdrop && "pt-0")}>
          
          {/* Header Row: Icon + Title + Pills + Draft Badge */}
          <div className="flex items-start gap-2 mb-2">
            
            {/* Icon (Non-Media Backdrop only) */}
            {!useMediaBackdrop && (
                <div className="bg-primary p-2 rounded-full flex-shrink-0 text-primary-foreground mt-1">
                    {isLink ? <LinkIcon className="h-6 w-6" /> : fileDetails.icon}
                </div>
            )}
            
            <div className="flex-1 min-w-0">
                {/* Title */}
                <CardTitle className="text-xl font-lora line-clamp-1 text-foreground mb-1">
                    {resource.title}
                </CardTitle>
                
                {/* Pills and Draft Badge (Inline below title, minimal vertical space) */}
                <div className="flex flex-wrap items-center gap-2">
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
                    
                    {/* Draft Badge (Admin only) */}
                    {isAdmin && !isPublished && (
                        <Badge variant="destructive" className="text-xs">
                            Draft
                        </Badge>
                    )}
                </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {resource.description || (isLink ? "External Link" : fileDetails.type)}
          </p>
        </div>

        {/* Footer Content (Buttons and Date) */}
        <CardContent className="p-4 pt-2">
          <div className="flex flex-col gap-3">
            {/* Primary Action Button (Only for Links) */}
            {isLink && (
              <Button 
                onClick={handlePrimaryAction} 
                className="w-full" 
                disabled={!resource.url}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                <span>View Link</span>
              </Button>
            )}
            
            {isAdmin && (
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMove(resource)}
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