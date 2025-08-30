import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { GripVertical, X, Download, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { PDFProcessor } from '../utils/pdfProcessor';
import type { PDFFile } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MergeToolProps {
  files: PDFFile[];
  onClose: () => void;
  open: boolean;
}

interface DragItem {
  id: string;
  index: number;
}

const DraggablePDFItem: React.FC<{
  file: PDFFile;
  index: number;
  moveFile: (dragIndex: number, hoverIndex: number) => void;
  onRemove: (index: number) => void;
}> = ({ file, index, moveFile, onRemove }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'pdf-file',
    item: { id: file.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'pdf-file',
    hover: (item: DragItem) => {
      if (item.index !== index) {
        moveFile(item.index, index);
        item.index = index;
      }
    },
  });

  const dragDropRef = (node: HTMLDivElement | null) => {
    drag(drop(node));
  };

  return (
    <div
      ref={dragDropRef}
      className={cn(
        'flex items-center space-x-3 p-4 bg-card rounded-lg border-2 border-border transition-all duration-200 cursor-move',
        isDragging ? 'opacity-50 scale-95' : 'hover:border-primary/50 hover:shadow-sm'
      )}>
      <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 flex items-center space-x-3 min-w-0">
        <div className="w-10 h-12 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium text-primary">PDF</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{file.name}</p>
          <p className="text-sm text-muted-foreground">{file.pages} pages</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(index)}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive flex-shrink-0">
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

export const MergeTool: React.FC<MergeToolProps> = ({ files, onClose }) => {
  const [mergeFiles, setMergeFiles] = useState<PDFFile[]>(files);
  const [outputName, setOutputName] = useState('merged-document.pdf');
  const [isProcessing, setIsProcessing] = useState(false);

  const moveFile = (dragIndex: number, hoverIndex: number) => {
    const draggedFile = mergeFiles[dragIndex];
    const updatedFiles = [...mergeFiles];
    updatedFiles.splice(dragIndex, 1);
    updatedFiles.splice(hoverIndex, 0, draggedFile);
    setMergeFiles(updatedFiles);
  };

  const removeFile = (index: number) => {
    setMergeFiles(mergeFiles.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (mergeFiles.length < 2) {
      toast.error('Please select at least 2 PDF files to merge');
      return;
    }

    setIsProcessing(true);
    try {
      const mergedPdf = await PDFProcessor.mergePDFs({
        files: mergeFiles,
        outputName,
      });

      PDFProcessor.downloadFile(mergedPdf, outputName);
      toast.success('PDFs merged successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to merge PDFs');
      console.error('Merge error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-8">
        {/* Output filename input */}
        <div className="space-y-3">
          <Label htmlFor="outputName" className="text-base font-medium">
            Output filename
          </Label>
          <Input
            id="outputName"
            type="text"
            value={outputName}
            onChange={(e) => setOutputName(e.target.value)}
            placeholder="merged-document.pdf"
            className="text-base py-3"
          />
        </div>

        {/* File list section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Files to merge ({mergeFiles.length} files)</h3>
            <p className="text-sm text-muted-foreground">Drag to reorder</p>
          </div>

          {mergeFiles.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No files selected for merging</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {mergeFiles.map((file, index) => (
                <DraggablePDFItem key={file.id} file={file} index={index} moveFile={moveFile} onRemove={removeFile} />
              ))}
            </div>
          )}
        </div>

        {/* Merge preview */}
        {mergeFiles.length > 1 && (
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold mb-4">Merge Preview</h4>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-muted-foreground">Order:</span>
                {mergeFiles.slice(0, 3).map((file, index) => (
                  <React.Fragment key={file.id}>
                    <span className="font-medium truncate max-w-32 bg-muted px-3 py-1 rounded-md" title={file.name}>
                      {file.name.replace('.pdf', '')}
                    </span>
                    {index < Math.min(mergeFiles.length - 1, 2) && (
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </React.Fragment>
                ))}
                {mergeFiles.length > 3 && (
                  <span className="text-muted-foreground">... +{mergeFiles.length - 3} more</span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary and actions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-semibold text-lg">Ready to merge</p>
                <p className="text-muted-foreground">
                  Total pages: {mergeFiles.reduce((sum, file) => sum + file.pages, 0)}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={onClose} className="flex-1 py-3">
                Cancel
              </Button>
              <Button onClick={handleMerge} disabled={mergeFiles.length < 2 || isProcessing} className="flex-1 py-3">
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Merging...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Merge & Download
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DndProvider>
  );
};
