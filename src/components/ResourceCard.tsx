"use client";

import React from 'react';
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Headphones, Link as LinkIcon, ExternalLink, FileSearch, Download, File, ArrowRight, Mic2, MoreVertical, Copy, Info, Youtube, Trash2, Play } from "lucide-react";
import { Resource } from "@/types/Resource";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import AudioPlayerCard from './AudioPlayerCard';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { showSuccess, showError } from "@/utils/toast";

interface ResourceCardProps {
  resource: Resource;
  isAdmin: boolean | undefined;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
  onMove: (resource: Resource) => void;
}

const resourcePillStyles: { [key: string]: { text: string, border: string, bg: string } } = {
  pdf: { text: "text-red-600", border: "border-red-200", bg: "bg-red-50" },
  audio: { text: "text-green-600", border: "border-green-200", bg: "bg-green-50" },
  link: { text: "text-blue-600", border: "border-blue-200", bg: "bg-blue-50" },
  youtube: { text: "text-purple-600", border: "border-purple-200", bg: "bg-purple-50" },
  lyrics: { text: "text-orange-600", border: "border-orange-200", bg: "bg-orange-50" },
  default: { text: "text-muted-foreground", border: "border-border", bg: "bg-muted" },
};

const voicePartColors: { [key: string]: string } = {
  "Soprano 1": "bg-pink-100 text-pink-700 border-pink-200",
  "Soprano 2": "bg-pink-100 text-pink-700 border-pink-200",
  "Soprano": "bg-pink-100 text-pink-700 border-pink-200",
  "Alto 1": "bg-purple-100 text-purple-700 border-purple-200",
  "Alto 2": "bg-purple-100 text-purple-700 border-purple-200",
  "Alto": "bg-purple-100 text-purple-700 border-purple-200",
  "Tenor 1": "bg-blue-100 text-blue-700 border-blue-200",
  "Tenor 2": "bg-blue-100 text-blue-700 border-blue-200",
  "Tenor": "bg-blue-100 text-blue-700 border-blue-200",
  "Bass 1": "bg-green-100 text-green-700 border-green-200",
  "Bass 2": "bg-green-100 text-green-700 border-green-200",
  "Bass": "bg-green-100 text-green-700 border-green-200",
  "Full Choir": "bg-primary/10 text-primary border-primary/20",
  "Unison": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Other": "bg-gray-100 text-gray-700 border-gray-200",
};

const getYouTubeEmbedUrl = (url: string | null): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?rel=0&showinfo=0&modestbranding=1`;
  }
  return null;
};

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, isAdmin, onEdit, onDelete, onMove }) => {
  const isFile = resource.type === 'file' || resource.type === 'lyrics';
  const isLink = resource.type === 'url';
  const isYoutube = resource.type === 'youtube';
  const isLyrics = resource.type === 'lyrics';
  const isPublished = resource.is_published;

  const getFileDetails = () => {
    if (!resource.url) return { isPdf: false, isAudio: false };
    const url = resource.url.toLowerCase();
    return {
      isPdf: url.endsWith('.pdf'),
      isAudio: url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.ogg') || url.endsWith('.m4a')
    };
  };

  const fileDetails = getFileDetails();
  let resourcePillType: keyof typeof resourcePillStyles;
  let resourcePillText: string;
  let primaryIcon: React.ReactNode;

  if (isYoutube) {
    resourcePillType = 'youtube';
    resourcePillText = 'YouTube';
    primaryIcon = <Youtube className="h-5 w-5" />;
  } else if (isLyrics) {
    resourcePillType = 'lyrics';
    resourcePillText = 'Lyrics';
    primaryIcon = <Mic2 className="h-5 w-5" />;
  } else if (isLink) {
    resourcePillType = 'link';
    resourcePillText = 'Link';
    primaryIcon = <LinkIcon className="h-5 w-5" />;
  } else if (isFile) {
    resourcePillType = fileDetails.isPdf ? 'pdf' : fileDetails.isAudio ? 'audio' : 'default';
    resourcePillText = fileDetails.isPdf ? 'PDF' : fileDetails.isAudio ? 'Audio' : 'File';
    primaryIcon = fileDetails.isPdf ? <FileText className="h-5 w-5" /> : <Headphones className="h-5 w-5" />;
  } else {
    resourcePillType = 'default';
    resourcePillText = 'Resource';
    primaryIcon = <File className="h-5 w-5" />;
  }

  const pillStyle = resourcePillStyles[resourcePillType] || resourcePillStyles.default;
  const useMediaBackdrop = (isFile && (fileDetails.isPdf || fileDetails.isAudio)) || isYoutube;
  const youtubeEmbedUrl = isYoutube ? getYouTubeEmbedUrl(resource.url) : null;

  const handlePrimaryAction = () => {
    if (!resource.url) return;
    if (isFile) {
      const link = document.createElement('a');
      link.href = resource.url;
      link.download = resource.original_filename || resource.title; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess(`Downloading ${resource.title}...`);
    } else {
      window.open(resource.url, '_blank');
    }
  };

  const handleShare = () => {
    if (resource.url) {
      navigator.clipboard.writeText(resource.url);
      showSuccess("Resource link copied to clipboard!");
    }
  };

  const getPrimaryActionText = () => {
    if (isYoutube) return "Watch on YouTube";
    if (isLink) return "View Link";
    if (isLyrics) return "Download Lyrics";
    if (fileDetails.isPdf) return "Download PDF";
    if (fileDetails.isAudio) return "Download Audio";
    return "View Resource";
  };

  return (
    <Card className={cn(
      "group flex flex-col overflow-hidden transition-all duration-500 border-none shadow-lg hover:shadow-2xl bg-card rounded-[2rem]",
      !isPublished && isAdmin && "ring-2 ring-yellow-500/50"
    )}>
      {/* Media Preview Area - Enhanced with better styling */}
      {useMediaBackdrop && (
        <div className="relative aspect-video bg-muted overflow-hidden">
          {fileDetails.isPdf || isLyrics ? (
            <div className="relative w-full h-full cursor-pointer group/preview" onClick={handlePrimaryAction}>
              <iframe
                src={resource.url!}
                title={resource.title}
                className="w-full h-full border-none pointer-events-none scale-110 origin-top transition-transform duration-700 group-hover/preview:scale-125"
                style={{ marginTop: '-20px' }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[4px]">
                <Button size="lg" className="shadow-2xl rounded-2xl font-black transform scale-90 group-hover/preview:scale-100 transition-transform">
                  <FileSearch className="h-5 w-5 mr-2" /> Preview
                </Button>
              </div>
            </div>
          ) : fileDetails.isAudio ? (
            <div className="h-full flex items-center justify-center p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:to-teal-950/20">
              <AudioPlayerCard src={resource.url!} title={resource.title} onDownload={handlePrimaryAction} />
            </div>
          ) : isYoutube && youtubeEmbedUrl ? (
            <div className="relative w-full h-full">
              <iframe
                className="w-full h-full"
                src={youtubeEmbedUrl}
                title={resource.title}
                allowFullScreen
              />
            </div>
          ) : null}
        </div>
      )}

      {/* Content Area - Enhanced Visual Hierarchy */}
      <CardContent className="p-6 flex-grow flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={cn("text-[10px] uppercase tracking-[0.2em] font-black px-2.5 py-0.5 rounded-full border-2", pillStyle.bg, pillStyle.text, pillStyle.border)}>
                {resourcePillText}
              </Badge>
              {resource.voice_part && (
                <Badge variant="outline" className={cn("text-[10px] uppercase tracking-[0.2em] font-black px-2.5 py-0.5 rounded-full border-2", voicePartColors[resource.voice_part] || voicePartColors.Other)}>
                  {resource.voice_part}
                </Badge>
              )}
              {isAdmin && !isPublished && (
                <Badge variant="destructive" className="text-[10px] uppercase tracking-[0.2em] font-black px-2.5 py-0.5 rounded-full">Draft</Badge>
              )}
            </div>
            <CardTitle className="text-xl font-black font-lora leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300">
              {resource.title}
            </CardTitle>
            {resource.description && (
              <p className="text-sm font-medium text-muted-foreground line-clamp-2 leading-relaxed">
                {resource.description}
              </p>
            )}
          </div>

          {/* Actions Menu - Cleaner Look */}
          <div className="flex flex-col gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" onClick={handleShare}>
                    <Copy className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy Link</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-none">
                <DropdownMenuItem onClick={handleShare} className="rounded-xl p-3 font-bold">
                  <Copy className="mr-3 h-4 w-4" /> Copy Link
                </DropdownMenuItem>
                
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem onClick={() => onEdit(resource)} className="rounded-xl p-3 font-bold">
                      <Info className="mr-3 h-4 w-4" /> Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMove(resource)} className="rounded-xl p-3 font-bold">
                      <ArrowRight className="mr-3 h-4 w-4" /> Move to Folder
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-2" />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="rounded-xl p-3 font-bold text-destructive focus:bg-destructive/10 focus:text-destructive">
                          <Trash2 className="mr-3 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-[2rem]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-2xl font-black font-lora">Delete Resource?</AlertDialogTitle>
                          <AlertDialogDescription className="text-lg font-medium">This will permanently remove "{resource.title}".</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-3">
                          <AlertDialogCancel className="rounded-2xl font-bold">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(resource)} className="bg-destructive hover:bg-destructive/90 rounded-2xl font-bold">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Primary Action Button - More Prominent */}
        {!fileDetails.isAudio && (
          <Button 
            onClick={handlePrimaryAction} 
            className="w-full h-14 mt-auto font-black text-lg rounded-2xl shadow-lg shadow-primary/10 group/btn transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            variant={isYoutube ? "secondary" : "default"}
          >
            {isYoutube ? <Play className="h-5 w-5 mr-3 fill-current" /> : isLink ? <ExternalLink className="h-5 w-5 mr-3" /> : <Download className="h-5 w-5 mr-3" />}
            {getPrimaryActionText()}
            <ArrowRight className="ml-3 h-5 w-5 opacity-0 -translate-x-3 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-300" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ResourceCard;