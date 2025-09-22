"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, UploadCloud, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  onUploadSuccess: (url: string) => void;
  onRemoveSuccess: () => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  userId,
  currentAvatarUrl,
  onUploadSuccess,
  onRemoveSuccess,
}) => {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setPreview(currentAvatarUrl);
  }, [currentAvatarUrl]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".png", ".gif", ".webp"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) {
      showError("No file selected for upload.");
      return;
    }

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      showError("Failed to upload avatar: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    if (publicUrlData?.publicUrl) {
      console.log("Public URL generated:", publicUrlData.publicUrl); // Add this log
      onUploadSuccess(publicUrlData.publicUrl);
      setFile(null); // Clear the selected file after successful upload
    } else {
      showError("Failed to get public URL for avatar.");
    }
    setUploading(false);
  };

  const handleRemoveAvatar = async () => {
    if (!currentAvatarUrl) {
      showError("No avatar to remove.");
      return;
    }

    setUploading(true); // Use uploading state for removal too
    const urlParts = currentAvatarUrl.split('/');
    const fileNameWithFolder = urlParts.slice(urlParts.indexOf('avatars') + 1).join('/');

    const { error: deleteError } = await supabase.storage
      .from("avatars")
      .remove([fileNameWithFolder]);

    if (deleteError) {
      console.error("Error removing avatar:", deleteError);
      showError("Failed to remove avatar: " + deleteError.message);
      setUploading(false);
      return;
    }

    onRemoveSuccess();
    setPreview(null);
    setFile(null);
    setUploading(false);
  };

  const handlePaste = useCallback((event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            setFile(blob);
            setPreview(URL.createObjectURL(blob));
            showSuccess("Image pasted from clipboard!");
            return;
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  return (
    <div className="space-y-4">
      <Label htmlFor="avatar-upload">Avatar Image</Label>
      <div className="flex items-center gap-4">
        <Avatar className="w-24 h-24">
          {preview ? (
            <AvatarImage src={preview} alt="Avatar Preview" className="object-cover" />
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
            {file && (
              <p className="text-sm text-primary mt-2">Selected: {file.name}</p>
            )}
          </div>
          {file && (
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                "Upload New Avatar"
              )}
            </Button>
          )}
          {currentAvatarUrl && !file && (
            <Button
              variant="outline"
              onClick={handleRemoveAvatar}
              disabled={uploading}
              className="w-full text-destructive hover:text-destructive-foreground hover:bg-destructive"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removing...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" /> Remove Current Avatar
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvatarUpload;