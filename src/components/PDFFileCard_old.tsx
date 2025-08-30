import React from 'react';
import { FileText, MoreVertical, Download, Trash2, Info, Clock, HardDrive, FileX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PDFFile } from '../types';

interface PDFFileCardProps {
  file: PDFFile;
  onRemove: (fileId: string) => void;
  onInfo: (file: PDFFile) => void;
  isSelected?: boolean;
  onSelect?: (fileId: string) => void;
  viewMode?: 'grid' | 'list';
}

export const PDFFileCard: React.FC<PDFFileCardProps> = ({
  file,
  onRemove,
  onInfo,
  isSelected = false,
  onSelect,
  viewMode = 'grid',
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(file.id);
    }
  };

  if (viewMode === 'list') {
    return (
      <Card
        className={cn(
          'transition-all duration-200 group hover:shadow-md cursor-pointer border-0 bg-white/70 backdrop-blur-sm',
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50/70 shadow-md' : 'hover:shadow-md'
        )}
        onClick={handleSelect}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              {/* PDF Icon and Selection */}
              <div className="relative">
                <div
                  className={cn(
                    'w-12 h-16 rounded-lg flex items-center justify-center transition-colors',
                    isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100'
                  )}>
                  <FileText className="w-6 h-6" />
                </div>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 truncate text-sm mb-1">{file.name}</h3>
                <div className="flex items-center space-x-4 text-xs text-slate-500">
                  <div className="flex items-center space-x-1">
                    <FileX className="w-3 h-3" />
                    <span>{file.pages} pages</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <HardDrive className="w-3 h-3" />
                    <span>{formatFileSize(file.size)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(file.file.lastModified)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    const url = URL.createObjectURL(file.file);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = file.name;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}>
                  <Download className="mr-3 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onInfo(file);
                  }}>
                  <Info className="mr-3 h-4 w-4" />
                  View Information
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(file.id);
                  }}>
                  <Trash2 className="mr-3 h-4 w-4" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view (default)
  return (
    <Card
      className={cn(
        'relative transition-all duration-200 group hover:shadow-xl cursor-pointer border-0 bg-white/70 backdrop-blur-sm hover:-translate-y-1',
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50/70 shadow-xl' : 'hover:shadow-xl'
      )}
      onClick={handleSelect}>
      <CardContent className="p-6">
        {/* PDF Icon and Selection Indicator */}
        <div className="flex items-start justify-between mb-4">
          <div className="relative">
            <div
              className={cn(
                'w-16 h-20 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm',
                isSelected
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600'
              )}>
              <FileText className="w-8 h-8" />
            </div>
            {isSelected && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                <div className="w-3 h-3 bg-white rounded-full" />
              </div>
            )}
          </div>

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/80"
                onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-sm">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  const url = URL.createObjectURL(file.file);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = file.name;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}>
                <Download className="mr-3 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onInfo(file);
                }}>
                <Info className="mr-3 h-4 w-4" />
                View Information
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(file.id);
                }}>
                <Trash2 className="mr-3 h-4 w-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* File Information */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-slate-800 truncate text-sm mb-1 group-hover:text-blue-600 transition-colors">
              {file.name}
            </h3>
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200">
              {file.pages} pages
            </Badge>
            <span className="text-xs text-slate-500 font-medium">{formatFileSize(file.size)}</span>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Modified</span>
              <span>{formatDate(file.file.lastModified)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
