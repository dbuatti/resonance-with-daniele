"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText, Headphones, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess } from "@/utils/toast";

interface ResourceUploadProps {
  currentFileUrl: string | null; // The URL of the file currently associated with the resource (e.g., from Supabase Storage)
  onFileChange: (file: File | null) => void; // Callback for when a new file is selected or cleared
  onRemoveRequested: () => void; // Callback for when user explicitly requests removal of the current file
  isSaving: boolean; // Prop to indicate if parent is saving, for loading states
  selectedFile: File | null; // The file currently selected in the parent form state
  folderPathDisplay: string | null; // New prop: The human-readable path of the current folder
}

const ResourceUpload: React.FC<ResourceUploadProps> = ({
  currentFileUrl,
  onFileChange,
  onRemoveRequested,
  isSaving,
  selectedFile,
  folderPathDisplay, // Destructure the new prop
}) => {
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);

  useEffect(() => {
    if (selectedFile) {
      setPreviewFileName(selectedFile.name);
    } else if (currentFileUrl) {
      // Extract file name from URL
      try {
        const url = new URL(currentFileUrl);
        // The path is usually /storage/v1/object/public/bucket_name/user_id/folder/filename
        const pathSegments = url.pathname.split('/');
        // Find the last segment which should be the filename (potentially with UUID/timestamp prefix)
        let fileName = pathSegments[pathSegments.length - 1];

        // If the file name contains a timestamp prefix (e.g., 1678886400000-my-file.pdf), remove it
        const timestampRegex = /^\d+-/;
        if (timestampRegex.test(fileName)) {
          fileName = fileName.replace(timestampRegex, '');
        }
        
        // If the file name contains a UUID prefix (e.g., uuid/filename.pdf), extract the last part
        if (fileName.includes('/')) {
            fileName = fileName.split('/').pop() || fileName;
        }

        setPreviewFileName(fileName || "Uploaded File");
      } catch (e) {
        // If URL parsing fails, fall back to simple extraction
        const urlParts = currentFileUrl.split('/');
        setPreviewFileName(urlParts[urlParts.length - 1] || "Uploaded File");
      }
    } else {
      setPreviewFileName(null);
    }
  }, [selectedFile, currentFileUrl]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onFileChange(file);
    }
  }, [onFileChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'],
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
        const item = items[i];
        if (item.kind === 'file') {
          const blob = item.getAsFile();
          if (blob) {
            // Check if the pasted file type is acceptable
            if (blob.type === 'application/pdf' || blob.type.startsWith('audio/')) {
              // Assign a generic name if not available
              const fileName = blob.name || `pasted-file-${Date.now()}.${blob.type.split('/').pop()}`;
              const fileWithCorrectName = new File([blob], fileName, { type: blob.type });
              onFileChange(fileWithCorrectName);
              showSuccess("File pasted from clipboard!");
              return;
            }
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

  const getFileIcon = (fileName: string | null) => {
    if (!fileName) return <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />;
    if (fileName.toLowerCase().endsWith('.pdf')) {
      return <FileText className="h-8 w-8 text-primary mb-2" />;
    }
    if (fileName.toLowerCase().endsWith('.mp3') || fileName.toLowerCase().endsWith('.wav') || fileName.toLowerCase().endsWith('.ogg') || fileName.toLowerCase().endsWith('.m4a')) {
      return <Headphones className="h-8 w-8 text-primary mb-2" />;
    }
    return <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />;
  };

  const hasFile = selectedFile || currentFileUrl;

  return (
    <div className="space-y-4">
      <Label htmlFor="resource-upload">Upload File (PDF or Audio)</Label>
      <div className="flex flex-col gap-4">
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md cursor-pointer transition-colors",
            isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
            isSaving && "opacity-70 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} id="resource-upload" disabled={isSaving} />
          {getFileIcon(previewFileName)}
          {isDragActive ? (
            <p className="text-sm text-muted-foreground">Drop the file here...</p>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              Drag 'n' drop a PDF or audio file here, click to select, or paste from clipboard.
            </p>
          )}
          {(selectedFile || currentFileUrl) && (
            <p className="text-sm text-primary mt-2">
              {selectedFile ? "Selected: " : "Current File: "}
              {previewFileName}
            </p>
          )}
          {folderPathDisplay && (
            <p className="text-xs text-muted-foreground mt-1">
              {selectedFile ? "Will upload to:" : "Current location:"} <span className="font-mono">{folderPathDisplay}</span>
            </p>
          )}
        </div>
        {hasFile && (
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
            {currentFileUrl && !selectedFile && ( // Only show remove if there's a current file and no new file selected
              <Button
                variant="outline"
                onClick={onRemoveRequested}
                disabled={isSaving}
                className="flex-1 text-destructive hover:text-destructive-foreground hover:bg-destructive"
              >
                <XCircle className="mr-2 h-4 w-4" /> Remove Current File
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceUpload;