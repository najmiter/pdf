import React, { useState } from 'react';
import { Trash2, Download, Grid3X3, List } from 'lucide-react';
import toast from 'react-hot-toast';
import { PDFProcessor } from '../utils/pdfProcessor';
import type { PDFFile } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PageRemovalToolProps {
  file: PDFFile;
  onClose: () => void;
  open: boolean;
}

export const PageRemovalTool: React.FC<PageRemovalToolProps> = ({ file, onClose }) => {
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isProcessing, setIsProcessing] = useState(false);

  const togglePage = (pageNumber: number) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageNumber)) {
      newSelected.delete(pageNumber);
    } else {
      newSelected.add(pageNumber);
    }
    setSelectedPages(newSelected);
  };

  // Removed selectRange as it's not used in this interface

  const selectAll = () => {
    const allPages = new Set<number>();
    for (let i = 1; i <= file.pages; i++) {
      allPages.add(i);
    }
    setSelectedPages(allPages);
  };

  const clearSelection = () => {
    setSelectedPages(new Set());
  };

  const handleRemovePages = async () => {
    if (selectedPages.size === 0) {
      toast.error('Please select pages to remove');
      return;
    }

    if (selectedPages.size === file.pages) {
      toast.error('Cannot remove all pages from the document');
      return;
    }

    setIsProcessing(true);
    try {
      const outputName = `${file.name.replace('.pdf', '')}_pages_removed.pdf`;
      const processedPdf = await PDFProcessor.removePages(file, Array.from(selectedPages));

      PDFProcessor.downloadFile(processedPdf, outputName);
      toast.success(`Removed ${selectedPages.size} page(s) successfully!`);
      onClose();
    } catch (error) {
      toast.error('Failed to remove pages');
      console.error('Page removal error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPageItem = (pageNumber: number) => {
    const isSelected = selectedPages.has(pageNumber);

    if (viewMode === 'grid') {
      return (
        <div
          key={pageNumber}
          onClick={() => togglePage(pageNumber)}
          className={cn(
            'relative aspect-[3/4] rounded-lg border-2 cursor-pointer transition-all duration-200 group',
            isSelected
              ? 'border-destructive bg-destructive/5 scale-95'
              : 'border-border hover:border-destructive/50 hover:shadow-sm'
          )}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-10 bg-muted rounded mx-auto mb-2 flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground">PDF</span>
              </div>
              <span className="text-sm font-medium">{pageNumber}</span>
            </div>
          </div>
          {isSelected && (
            <div className="absolute top-2 right-2">
              <Badge variant="destructive" className="text-xs">
                Remove
              </Badge>
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={pageNumber}
        onClick={() => togglePage(pageNumber)}
        className={cn(
          'flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all duration-200',
          isSelected
            ? 'border-destructive bg-destructive/5'
            : 'border-border hover:border-destructive/50 hover:shadow-sm'
        )}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-10 bg-muted rounded flex items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground">PDF</span>
          </div>
          <span className="font-medium">Page {pageNumber}</span>
        </div>
        {isSelected && (
          <Badge variant="destructive" className="text-xs">
            Remove
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
          <Trash2 className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Remove Pages</h2>
          <p className="text-muted-foreground">{file.name}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-10 w-10 p-0">
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-10 w-10 p-0">
              <List className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            {selectedPages.size} of {file.pages} pages selected
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={clearSelection}>
            Clear
          </Button>
        </div>
      </div>

      {/* Page selection */}
      <Card>
        <CardContent className="p-6">
          <div className="max-h-96 overflow-y-auto">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {Array.from({ length: file.pages }, (_, i) => i + 1).map(renderPageItem)}
              </div>
            ) : (
              <div className="space-y-3">{Array.from({ length: file.pages }, (_, i) => i + 1).map(renderPageItem)}</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selection preview */}
      {selectedPages.size > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-destructive mb-2">{selectedPages.size} page(s) will be removed</h4>
                <p className="text-sm text-muted-foreground mb-3">Remaining pages: {file.pages - selectedPages.size}</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedPages)
                    .slice(0, 10)
                    .map((page) => (
                      <Badge key={page} variant="destructive" className="text-xs">
                        Page {page}
                      </Badge>
                    ))}
                  {selectedPages.size > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{selectedPages.size - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-semibold text-lg">Ready to remove pages</p>
              <p className="text-muted-foreground">Select pages to remove from {file.name}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={onClose} className="flex-1 py-3">
              Cancel
            </Button>
            <Button
              onClick={handleRemovePages}
              disabled={selectedPages.size === 0 || selectedPages.size === file.pages || isProcessing}
              variant="destructive"
              className="flex-1 py-3">
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Remove & Download
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
