"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerCardProps {
  src: string;
  onDownload: () => void;
  title: string;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const AudioPlayerCard: React.FC<AudioPlayerCardProps> = ({ src, onDownload, title }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoaded(true);
    }
  }, []);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !isLoaded) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = duration * percentage;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);
      
      // Clean up listeners
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [handleTimeUpdate, handleLoadedMetadata, handleEnded]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    // Two-tone background structure: Player controls area
    <div className="p-4 bg-card border-b border-border rounded-t-xl">
      <audio ref={audioRef} src={src} preload="metadata" title={title} />
      
      <div className="flex flex-col space-y-3">
        
        {/* 1. Controls Row: Play/Pause + Progress Bar + Time */}
        <div className="flex items-center space-x-4">
          
          {/* Play/Pause Button */}
          <Button
            variant="default"
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg flex-shrink-0"
            onClick={togglePlayPause}
            disabled={!isLoaded}
          >
            {!isLoaded ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-6 w-6 fill-current" />
            ) : (
              <Play className="h-6 w-6 fill-current" />
            )}
          </Button>

          {/* Progress Bar and Time */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* Progress Bar (Thicker, Primary Color) */}
            <div
              className="relative h-3 w-full bg-muted rounded-full cursor-pointer group"
              onClick={handleSeek}
            >
              <div
                className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-100"
                style={{ width: `${progressPercentage}%` }}
              />
              {/* Scrubber Handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-primary shadow-md transition-all duration-100 border-2 border-white"
                style={{ left: `calc(${progressPercentage}% - 10px)` }}
              />
            </div>

            {/* Time Display (Current / Total) */}
            <div className="flex justify-between text-sm font-mono">
              <span className="font-bold text-foreground">{formatTime(currentTime)}</span>
              <span className="text-muted-foreground">{isLoaded ? formatTime(duration) : '--:--'}</span>
            </div>
          </div>
        </div>
        
        {/* 2. Download Button (Refined CTA) */}
        <Button 
          variant="outline" // Use outline to contrast with the solid Play button
          className="w-full" 
          onClick={onDownload}
          disabled={!isLoaded}
        >
          <Download className="mr-2 h-4 w-4" /> Download Audio File
        </Button>
      </div>
    </div>
  );
};

export default AudioPlayerCard;