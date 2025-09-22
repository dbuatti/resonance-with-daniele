"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, UploadCloud, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { showSuccess } from "@/utils/toast"; // Only for paste notification

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  onFileChange: (file: File | null) => void; // Callback for when a file is selected or cleared
  onRemoveRequested: () => void; // Callback for when user explicitly requests removal
  isSaving: boolean; // Prop to indicate if parent is saving, for loading states
  selectedFile: File | null; // The file currently selected in the parent
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
      setPreview(URL.createObjectURL(selectedFile));
    } else if (currentAvatarUrl) {
      setPreview(currentAvatarUrl);
    } else {
      setPreview(null);
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
      "image/*": [".jpeg", ".png", ".gif", ".webp"],
    },
    maxFiles: 1,
  });

  const handleClearSelection = () => {
    onFileChange(null); // Clear the selected file
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

  const displayImage = selectedFile ? URL.createObjectURL(selectedFile) : currentAvatarUrl;

  return (
    <div className="space-y-4">
      <Label htmlFor="avatar-upload">Avatar Image</Label>
      <div className="flex items-center gap-4">
        <Avatar className="w-24 h-24">
          {displayImage ? (
            <AvatarImage src={displayImage} alt="Avatar Preview" className="object-cover" />
          ) : (
            <AvatarFallback className="bg-muted text-muted-foreground">
              <ImageIcon className="h-12 w-12" />
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 space-y-2">
          <div
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} id="avatar-upload" />
            <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
            {isDragActive ? (
              <p className="text-sm text-muted-foreground">Drop the image here...</p>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                Drag 'n' drop an image here, click to select, or paste from clipboard.
              </p>
            )}
            {selectedFile && (
              <p className="text-sm text-primary mt-2">Selected: {selectedFile.name}</p>
            )}
          </div>
          {(selectedFile || currentAvatarUrl) && (
            <div className="flex gap-2">
              {selectedFile && (
                <Button
                  variant="outline"
                  onClick={handleClearSelection}
                  disabled={isSaving}
                  className="flex-1"
                >
                  <XCircle className="mr-2 h-4 w-4" /> Clear Selection
                </Button>
              )}
              {currentAvatarUrl && !selectedFile && ( // Only show remove if there's a current avatar and no new file selected
                <Button
                  variant="outline"
                  onClick={onRemoveRequested}
                  disabled={isSaving}
                  className="flex-1 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" /> Remove Current Avatar
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