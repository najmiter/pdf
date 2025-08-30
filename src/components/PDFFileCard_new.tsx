import React from 'react';
import { FileText, MoreVertical, Download, Trash2, Info } from 'lucide-react';
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
}

export const PDFFileCard: React.FC<PDFFileCardProps> = ({ file, onRemove, onInfo, isSelected = false, onSelect }) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(file.id);
    }
  };

  return (
    <Card
      className={cn(
        'relative transition-all duration-200 group hover:shadow-lg',
        isSelected ? 'ring-2 ring-primary bg-primary/5 shadow-md' : 'hover:shadow-md',
        onSelect && 'cursor-pointer'
      )}
      onClick={handleSelect}>
      <CardContent className="p-6">
        {/* PDF Icon and Selection Indicator */}
        <div className="flex items-start justify-between mb-4">
          <div className="relative">
            <div
              className={cn(
                'w-12 h-15 rounded-lg flex items-center justify-center transition-colors',
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
              <FileText className="w-6 h-6" />
            </div>
            {isSelected && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-primary-foreground rounded-full" />
              </div>
            )}
          </div>

          {/* Actions Dropdown */}
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
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(file.id);
                }}
                className="text-destructive focus:text-destructive">
                <Trash2 className="mr-3 h-4 w-4" />
                Remove File
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* File Info */}
        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-sm leading-tight mb-1 line-clamp-2" title={file.name}>
              {file.name}
            </h3>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {file.pages} page{file.pages !== 1 ? 's' : ''}
              </Badge>
              <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
            </div>
          </div>
        </div>

        {/* Selection indicator at bottom */}
        {onSelect && (
          <div className="mt-4 pt-3 border-t">
            <div className="text-xs text-center text-muted-foreground">
              {isSelected ? 'Selected' : 'Click to select'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
