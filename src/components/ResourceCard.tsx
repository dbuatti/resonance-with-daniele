"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, FileText, Headphones, Link as LinkIcon, ExternalLink, FileSearch, Download, File } from "lucide-react";
import { Resource } from "@/types/Resource";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import PdfPreviewDialog from './PdfPreviewDialog'; // Import the new component

interface ResourceCardProps {
  resource: Resource;
  isAdmin: boolean | undefined;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, isAdmin, onEdit, onDelete }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
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
      return { icon: <FileText className="h-12 w-12 text-primary" />, type: 'PDF Document', isPdf, isAudio: false, fileName };
    }
    if (isAudio) {
      return { icon: <Headphones className="h-12 w-12 text-primary" />, type: 'Audio Track', isPdf: false, isAudio, fileName };
    }
    return { icon: <File className="h-12 w-12 text-muted-foreground" />, type: 'File', isPdf: false, isAudio: false, fileName };
  };

  const fileDetails = getFileDetails();

  const handleOpenPreview = () => {
    if (fileDetails.isPdf && resource.url) {
      setIsPreviewOpen(true);
    } else if (resource.url) {
      // For non-PDF files (like audio) and links, open directly in a new tab
      window.open(resource.url, '_blank');
    }
  };

  const handleDownloadAction = () => {
    if (resource.url) {
      window.open(resource.url, '_blank');
    }
  };

  // Determine the primary button text and icon based on type
  const getPrimaryButtonDetails = () => {
    if (fileDetails.isPdf) {
      return { text: "Download File", icon: <Download className="h-4 w-4 mr-2" /> };
    }
    if (fileDetails.isAudio) {
      return { text: "Listen to Audio", icon: <Headphones className="h-4 w-4 mr-2" /> };
    }
    if (isLink) {
      return { text: "View Link", icon: <ExternalLink className="h-4 w-4 mr-2" /> };
    }
    return { text: "Download File", icon: <Download className="h-4 w-4 mr-2" /> };
  };

  const primaryButtonDetails = getPrimaryButtonDetails();

  return (
    <>
      <Card className={cn(
        "shadow-lg rounded-xl flex flex-col justify-between transition-shadow duration-200 hover:shadow-xl",
        !isPublished && isAdmin && "border-l-4 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20"
      )}>
        <CardHeader className="pb-2">
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
        
        {/* Visual Preview Area for Files (Clickable for PDF Preview) */}
        {isFile && (
          <CardContent 
            className={cn(
              "pt-0 pb-4",
              fileDetails.isPdf && resource.url && "cursor-pointer hover:opacity-90 transition-opacity"
            )}
            onClick={fileDetails.isPdf ? handleOpenPreview : undefined}
          >
            <div className="bg-muted/50 border border-border rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-3">
              {fileDetails.icon}
              <p className="text-sm font-medium text-foreground line-clamp-1">{fileDetails.fileName}</p>
              <p className="text-xs text-muted-foreground">{fileDetails.type}</p>
              {fileDetails.isPdf && resource.url && (
                <div className="flex items-center text-primary text-sm font-semibold mt-2">
                  <FileSearch className="h-4 w-4 mr-1" /> Click to Preview
                </div>
              )}
            </div>
          </CardContent>
        )}

        <CardContent className="pt-0">
          <div className="flex flex-col gap-3">
            {/* Primary Action Button (Download for PDF, Listen for Audio, View for Link) */}
            <Button 
              onClick={fileDetails.isPdf ? handleDownloadAction : handleOpenPreview} 
              className="w-full" 
              disabled={!resource.url}
            >
              {primaryButtonDetails.icon}
              <span>{primaryButtonDetails.text}</span>
            </Button>
            
            {/* Secondary Action Button (Only needed if primary action is not Download) */}
            {isFile && fileDetails.isPdf && ( // If primary is Download (for PDF), offer Preview as secondary
              <Button 
                onClick={handleOpenPreview} 
                variant="outline"
                className="w-full" 
                disabled={!resource.url}
              >
                <FileSearch className="h-4 w-4 mr-2" /> Open Full Preview
              </Button>
            )}
            
            {isFile && fileDetails.isAudio && ( // If primary is Listen (for Audio), offer Download as secondary
              <Button 
                onClick={handleDownloadAction} 
                variant="outline"
                className="w-full" 
                disabled={!resource.url}
              >
                <Download className="h-4 w-4 mr-2" /> Download File
              </Button>
            )}

            {isAdmin && (
              <div className="flex justify-end gap-2 mt-2">
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
          <p className="text-xs text-muted-foreground mt-3 text-right">
            Added: {format(new Date(resource.created_at), "MMM d, yyyy")}
          </p>
        </CardContent>
      </Card>
      
      {/* PDF Preview Dialog */}
      {fileDetails.isPdf && (
        <PdfPreviewDialog
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          pdfUrl={resource.url}
          title={resource.title}
        />
      )}
    </>
  );
};

export default ResourceCard;