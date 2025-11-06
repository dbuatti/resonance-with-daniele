"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, FileText, Headphones, Link as LinkIcon, ExternalLink, EyeOff, CheckCircle2 } from "lucide-react";
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
    if (!resource.url) return { icon: <FileText className="h-6 w-6 text-muted-foreground" />, type: 'Unknown File' };
    const url = resource.url.toLowerCase();
    if (url.endsWith('.pdf')) {
      return { icon: <FileText className="h-6 w-6 text-primary" />, type: 'PDF Document' };
    }
    if (url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.ogg') || url.endsWith('.m4a')) {
      return { icon: <Headphones className="h-6 w-6 text-primary" />, type: 'Audio Track' };
    }
    return { icon: <FileText className="h-6 w-6 text-muted-foreground" />, type: 'File' };
  };

  const fileDetails = getFileDetails();

  const handleActionClick = () => {
    if (resource.url) {
      // For files, we want to trigger a download if possible, or just open the URL
      // For links, we open the URL
      window.open(resource.url, '_blank');
    }
  };

  return (
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
            onClick={handleActionClick} 
            className="w-full" 
            disabled={!resource.url}
          >
            {isFile ? (
              <>
                {fileDetails.icon}
                <span className="ml-2">Download {fileDetails.type.split(' ')[0]}</span>
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                <span>View Link</span>
              </>
            )}
          </Button>
          
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
  );
};

export default ResourceCard;