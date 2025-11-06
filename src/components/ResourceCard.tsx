"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, FileText, Headphones, Link as LinkIcon, ExternalLink, EyeOff, CheckCircle2, FileSearch, Download } from "lucide-react";
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
    if (!resource.url) return { icon: <FileText className="h-6 w-6 text-muted-foreground" />, type: 'Unknown File', isPdf: false, isAudio: false };
    const url = resource.url.toLowerCase();
    const isPdf = url.endsWith('.pdf');
    const isAudio = url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.ogg') || url.endsWith('.m4a');

    if (isPdf) {
      return { icon: <FileText className="h-6 w-6 text-primary" />, type: 'PDF Document', isPdf, isAudio: false };
    }
    if (isAudio) {
      return { icon: <Headphones className="h-6 w-6 text-primary" />, type: 'Audio Track', isPdf: false, isAudio };
    }
    return { icon: <FileText className="h-6 w-6 text-muted-foreground" />, type: 'File', isPdf: false, isAudio: false };
  };

  const fileDetails = getFileDetails();

  const handlePrimaryAction = () => {
    if (!resource.url) return;

    if (fileDetails.isPdf) {
      setIsPreviewOpen(true);
    } else {
      // For audio files and external links, open directly in a new tab
      window.open(resource.url, '_blank');
    }
  };

  const handleDownloadAction = () => {
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
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
              {isLink ? <LinkIcon className="h-6 w-6 text-primary" /> : fileDetails.icon}
            </div>
            {isAdmin && (
              <Badge variant={isPublished ? "secondary" : "destructive"} className="text-xs">
                {isPublished ? "Published" : "Draft"}
              </Badge>
            )}
          </div>
          <CardTitle className="text-xl font-lora mt-2 line-clamp-2">{resource.title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground line-clamp-3 min-h-[40px]">
            {resource.description || (isLink ? "External Link" : fileDetails.type)}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handlePrimaryAction} 
              className="w-full" 
              disabled={!resource.url}
            >
              {fileDetails.isPdf ? (
                <>
                  <FileSearch className="h-4 w-4 mr-2" />
                  <span>Preview PDF</span>
                </>
              ) : fileDetails.isAudio ? (
                <>
                  <Headphones className="h-4 w-4 mr-2" />
                  <span>Listen to Audio</span>
                </>
              ) : isLink ? (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  <span>View Link</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  <span>Download File</span>
                </>
              )}
            </Button>
            
            {/* Secondary Download button for PDFs/Audio if needed, or just keep the primary action */}
            {fileDetails.isPdf && (
              <Button 
                onClick={handleDownloadAction} 
                variant="outline"
                className="w-full" 
                disabled={!resource.url}
              >
                <Download className="h-4 w-4 mr-2" /> Download PDF
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