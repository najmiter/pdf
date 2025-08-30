import React from 'react';
import { FileText, Trash2, Eye, MoreHorizontal } from 'lucide-react';
import type { PDFFile } from '../types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Badge } from './ui/badge';

interface PDFFileCardProps {
  file: PDFFile;
  isSelected?: boolean;
  onSelect?: (file: PDFFile) => void;
  onRemove?: (file: PDFFile) => void;
  onView?: (file: PDFFile) => void;
  className?: string;
}

export const PDFFileCard: React.FC<PDFFileCardProps> = ({
  file,
  isSelected = false,
  onSelect,
  onRemove,
  onView,
  className = '',
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card
      className={`
        cursor-pointer border transition-colors
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
        ${className}
      `}
      onClick={() => onSelect?.(file)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Thumbnail */}
          <div className="flex-shrink-0">
            {file.thumbnail ? (
              <img
                src={file.thumbnail}
                alt={`Preview of ${file.name}`}
                className="w-12 h-16 object-cover rounded border"
              />
            ) : (
              <div className="w-12 h-16 bg-gray-100 rounded border flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{file.name}</h3>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              <Badge variant="secondary">
                {file.pages} page{file.pages !== 1 ? 's' : ''}
              </Badge>
              <span>{formatFileSize(file.size)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {onView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(file);
                }}
                className="h-8 w-8 p-0">
                <Eye className="w-4 h-4" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()} className="h-8 w-8 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(file)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onRemove && (
                  <DropdownMenuItem onClick={() => onRemove(file)} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
