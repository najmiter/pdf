import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { GripVertical, X, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { PDFProcessor } from '../utils/pdfProcessor';
import type { PDFFile } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div
      ref={dragDropRef}
      className={`
        flex items-center space-x-3 p-4 bg-white rounded-lg border cursor-move
        ${isDragging ? 'opacity-50' : 'hover:border-gray-300'}
      `}>
      <GripVertical className="w-5 h-5 text-gray-400" />

      <div className="w-10 h-12 bg-gray-100 rounded flex items-center justify-center">
        <FileText className="w-5 h-5 text-gray-600" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{file.name}</h4>
        <p className="text-sm text-gray-500">
          {file.pages} pages • {formatFileSize(file.size)}
        </p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(index)}
        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500">
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

      // Download the merged PDF
      PDFProcessor.downloadFile(mergedPdf, outputName);

      toast.success('PDFs merged successfully!');
      onClose();
    } catch (error) {
      console.error('Merge error:', error);
      toast.error('Failed to merge PDFs');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Merge PDFs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Output Name */}
          <div className="space-y-2">
            <Label htmlFor="outputName">Output File Name</Label>
            <Input
              id="outputName"
              value={outputName}
              onChange={(e) => setOutputName(e.target.value)}
              placeholder="merged-document.pdf"
            />
          </div>

          {/* File List */}
          <div className="space-y-3">
            <Label>Files to Merge (drag to reorder)</Label>
            {mergeFiles.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No files selected for merging</p>
            ) : (
              <div className="space-y-2">
                {mergeFiles.map((file, index) => (
                  <DraggablePDFItem key={file.id} file={file} index={index} moveFile={moveFile} onRemove={removeFile} />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleMerge}
              disabled={mergeFiles.length < 2 || isProcessing}
              className="flex items-center gap-2">
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Merging...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Merge PDFs
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </DndProvider>
  );
};
