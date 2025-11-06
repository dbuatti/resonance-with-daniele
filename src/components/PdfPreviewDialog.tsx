"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface PdfPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  title: string;
}

const PdfPreviewDialog: React.FC<PdfPreviewDialogProps> = ({ isOpen, onClose, pdfUrl, title }) => {
  if (!pdfUrl) return null;

  // Function to force download (used in the dialog footer)
  const handleDownload = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
          <DialogTitle className="font-lora text-xl truncate">{title}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownload} size="sm">
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <iframe
            src={pdfUrl}
            title={`PDF Preview: ${title}`}
            className="w-full h-full border-0"
            allowFullScreen
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfPreviewDialog;