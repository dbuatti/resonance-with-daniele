"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, UploadCloud, XCircle, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { showSuccess } from "@/utils/toast";

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  onFileChange: (file: File | null) => void;
  onRemoveRequested: () => void;
  isSaving: boolean;
  selectedFile: File | null;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onFileChange,
  onRemoveRequested,
  isSaving,
  selectedFile,
}) => {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl);

  useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(currentAvatarUrl);
    }
  }, [selectedFile, currentAvatarUrl]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onFileChange(file);
    }
  }, [onFileChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxFiles: 1,
    disabled: isSaving,
  });

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering dropzone click
    onFileChange(null);
  };

  const handleRemoveCurrent = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering dropzone click
    onRemoveRequested();
  };

  const handlePaste = useCallback((event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            onFileChange(blob);
            showSuccess("Image pasted from clipboard!");
            return;
          }
        }
      }
    }
  }, [onFileChange]);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={cn(
          "relative group flex flex-col md:flex-row items-center gap-8 p-8 rounded-[2.5rem] border-4 border-dashed transition-all duration-300 cursor-pointer",
          isDragActive 
            ? "border-primary bg-primary/10 scale-[1.02] shadow-2xl" 
            : "border-primary/10 bg-muted/30 hover:border-primary/30 hover:bg-muted/50",
          isSaving && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="relative shrink-0">
          <Avatar className="w-32 h-32 border-4 border-background shadow-xl transition-transform group-hover:scale-105">
            {preview ? (
              <AvatarImage src={preview} alt="Avatar Preview" className="object-cover" />
            ) : (
              <AvatarFallback className="bg-primary/5 text-primary">
                <ImageIcon className="h-12 w-12 opacity-20" />
              </AvatarFallback>
            )}
          </Avatar>
          <div className={cn(
            "absolute inset-0 rounded-full flex items-center justify-center bg-primary/40 backdrop-blur-[2px] transition-opacity duration-300",
            isDragActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <Camera className="h-8 w-8 text-white" />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-3">
          <div className="space-y-1">
            <p className="text-xl font-black font-lora">
              {isDragActive ? "Drop it here!" : "Change your photo"}
            </p>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              Drag and drop an image directly onto the circle, click to browse, or even paste from your clipboard.
            </p>
          </div>

          {selectedFile && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
              <UploadCloud className="h-3 w-3" /> Selected: {selectedFile.name}
            </div>
          )}

          {(selectedFile || currentAvatarUrl) && (
            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
              {selectedFile && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearSelection}
                  disabled={isSaving}
                  className="rounded-xl font-bold h-9 border-primary/20 text-primary hover:bg-primary/5"
                >
                  <XCircle className="mr-2 h-4 w-4" /> Clear Selection
                </Button>
              )}
              {currentAvatarUrl && !selectedFile && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveCurrent}
                  disabled={isSaving}
                  className="rounded-xl font-bold h-9 text-destructive hover:bg-destructive/5 border-destructive/20"
                >
                  <XCircle className="mr-2 h-4 w-4" /> Remove Current Photo
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvatarUpload;