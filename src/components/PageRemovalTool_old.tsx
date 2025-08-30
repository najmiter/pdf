import React, { useState } from 'react';
import { Trash2, Download, Eye, Grid3X3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PDFProcessor } from '../utils/pdfProcessor';
import type { PDFFile } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PageRemovalToolProps {
  file: PDFFile;
  onClose: () => void;
  open: boolean;
}

export const PageRemovalTool: React.FC<PageRemovalToolProps> = ({ file, onClose, open }) => {
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

  const selectRange = (start: number, end: number) => {
    const newSelected = new Set(selectedPages);
    for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
      newSelected.add(i);
    }
    setSelectedPages(newSelected);
  };

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
      const updatedPdf = await PDFProcessor.removePages(file, Array.from(selectedPages));
      const fileName = file.name.replace('.pdf', '_pages_removed.pdf');
      PDFProcessor.downloadFile(updatedPdf, fileName);
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
          className={`
            relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
            ${
              isSelected ? 'border-red-500 bg-red-50 shadow-md' : 'border-gray-200 hover:border-red-300 hover:bg-red-25'
            }
          `}>
          <div className="aspect-[3/4] bg-white rounded border flex items-center justify-center mb-2">
            <Eye className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-center">Page {pageNumber}</p>
          {isSelected && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <Trash2 className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={pageNumber}
        onClick={() => togglePage(pageNumber)}
        className={`
          flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all duration-200
          ${isSelected ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300 hover:bg-red-25'}
        `}>
        <div className="w-8 h-10 bg-white rounded border flex items-center justify-center">
          <span className="text-xs font-medium text-gray-600">{pageNumber}</span>
        </div>
        <div className="flex-1">
          <p className="font-medium">Page {pageNumber}</p>
        </div>
        {isSelected && <Trash2 className="w-4 h-4 text-red-500" />}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <span className="text-xl font-semibold">Remove Pages</span>
              <p className="text-sm text-muted-foreground font-normal">{file.name}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
                  }`}>
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
                  }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>

              <div className="text-sm text-gray-600">
                {selectedPages.size} of {file.pages} pages selected
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={selectAll}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors duration-200">
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors duration-200">
                Clear
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {Array.from({ length: file.pages }, (_, i) => i + 1).map(renderPageItem)}
              </div>
            ) : (
              <div className="space-y-2">{Array.from({ length: file.pages }, (_, i) => i + 1).map(renderPageItem)}</div>
            )}
          </div>

          {selectedPages.size > 0 && (
            <div className="mt-6 bg-red-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-sm text-red-700">
                <Trash2 className="w-4 h-4" />
                <span>{selectedPages.size} page(s) will be removed from the document</span>
              </div>
              <div className="mt-2 text-xs text-red-600">Remaining pages: {file.pages - selectedPages.size}</div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">Select pages to remove from {file.name}</div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleRemovePages}
              disabled={selectedPages.size === 0 || selectedPages.size === file.pages || isProcessing}
              variant="destructive"
              className="flex items-center space-x-2">
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Remove & Download</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
