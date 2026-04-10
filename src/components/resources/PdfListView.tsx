"use client";

import React, { useState, useMemo } from "react";
import { Resource, ResourceFolder } from "@/types/Resource";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Download, ArrowUpDown, Calendar, HardDrive, FolderOpen, Edit } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PdfListViewProps {
  resources: Resource[];
  folders: ResourceFolder[];
  onDownload: (resource: Resource) => void;
  onEdit?: (resource: Resource) => void; // New prop
}

type SortKey = 'title' | 'created_at' | 'file_size';

const PdfListView: React.FC<PdfListViewProps> = ({ resources, folders, onDownload, onEdit }) => {
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const pdfs = useMemo(() => {
    return resources.filter(r => {
      const isPdfType = r.type === 'file' || r.type === 'lyrics';
      const hasPdfExt = r.url?.toLowerCase().endsWith('.pdf');
      return isPdfType && hasPdfExt;
    });
  }, [resources]);

  const sortedPdfs = useMemo(() => {
    return [...pdfs].sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortKey === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortKey === 'file_size') {
        comparison = (a.file_size || 0) - (b.file_size || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [pdfs, sortKey, sortOrder]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFolderMonth = (folderId: string | null) => {
    if (!folderId) return "Root";
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return "Unknown";
    return format(parseISO(folder.created_at), "MMMM");
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[40%]">
              <Button variant="ghost" onClick={() => toggleSort('title')} className="hover:bg-transparent p-0 font-bold">
                Document Title <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => toggleSort('file_size')} className="hover:bg-transparent p-0 font-bold">
                Size <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => toggleSort('created_at')} className="hover:bg-transparent p-0 font-bold">
                Date Added <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Folder Month</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPdfs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                No PDF documents found in this view.
              </TableCell>
            </TableRow>
          ) : (
            sortedPdfs.map((pdf) => (
              <TableRow key={pdf.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <FileText className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="line-clamp-1">{pdf.title}</span>
                      {pdf.voice_part && (
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">{pdf.voice_part}</span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  <div className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    {formatFileSize(pdf.file_size)}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(pdf.created_at), "MMM d, yyyy")}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold flex items-center w-fit gap-1">
                    <FolderOpen className="h-3 w-3" />
                    {getFolderMonth(pdf.folder_id)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {onEdit && (
                      <Button size="sm" variant="ghost" onClick={() => onEdit(pdf)} className="h-8 w-8 p-0 rounded-lg">
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => onDownload(pdf)} className="h-8 rounded-lg font-bold">
                      <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PdfListView;