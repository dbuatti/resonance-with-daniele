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

// Helper function to format time as M:SS
const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "0:00";
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
    <div className="w-full">
      <audio ref={audioRef} src={src} preload="metadata" title={title} />
      
      {/* Structured Control Area (Clean Background) */}
      <div className="p-4 pt-6 bg-muted/50 dark:bg-muted/30 rounded-t-xl space-y-4">
        
        <div className="flex items-center space-x-4">
          {/* Play/Pause Button */}
          <Button
            variant="default"
            size="icon"
            className="h-12 w-12 rounded-full shadow-xl flex-shrink-0 transition-transform duration-150 hover:scale-[1.02]"
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
          <div className="flex-1 min-w-0 space-y-2">
            {/* Progress Bar (Thicker, Primary Color) */}
            <div
              className="relative h-4 w-full bg-border rounded-full cursor-pointer group"
              onClick={handleSeek}
            >
              <div
                className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-100"
                style={{ width: `${progressPercentage}%` }}
              />
              {/* Scrubber Handle */}
              <div
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-primary shadow-lg transition-all duration-100 border-2 border-white dark:border-gray-800",
                  !isLoaded && "hidden"
                )}
                style={{ left: `calc(${progressPercentage}% - 10px)` }}
              />
            </div>

            {/* Time Display (Current / Total) */}
            <div className="flex justify-between text-sm font-mono">
              <span className="font-bold text-foreground">{formatTime(currentTime)}</span>
              <span className="text-muted-foreground">{formatTime(duration)}</span>
            </div>
          </div>
        </div>
        
        {/* Download Button (Prominent CTA) */}
        <Button 
          variant="default"
          className="w-full" // Removed mt-4 to tighten spacing
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