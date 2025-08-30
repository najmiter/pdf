import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { GripVertical, X, Download, ArrowRight, FileText, Combine, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { PDFProcessor } from '../utils/pdfProcessor';
import type { PDFFile } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
      className={cn(
        'group flex items-center space-x-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 cursor-move shadow-sm',
        isDragging
          ? 'opacity-50 scale-95 shadow-2xl rotate-3'
          : 'hover:border-blue-300 hover:shadow-lg hover:bg-white/90 border-slate-200'
      )}>
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="flex items-center space-x-3">
          <GripVertical className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
          <div className="w-3 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full flex-shrink-0" />
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-medium px-3 py-1">
            {index + 1}
          </Badge>
        </div>

        <div className="w-14 h-18 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
          <FileText className="w-7 h-7 text-blue-600" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-800 truncate text-base group-hover:text-blue-600 transition-colors">
            {file.name}
          </h4>
          <div className="flex items-center space-x-4 mt-1 text-sm text-slate-500">
            <span>{file.pages} pages</span>
            <span>•</span>
            <span>{formatFileSize(file.size)}</span>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(index)}
        className="h-10 w-10 p-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 rounded-xl">
        <X className="w-5 h-5" />
      </Button>
    </div>
  );
};

export const MergeTool: React.FC<MergeToolProps> = ({ files, onClose }) => {
  const [mergeFiles, setMergeFiles] = useState<PDFFile[]>(files);
  const [outputName, setOutputName] = useState('merged-document.pdf');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

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
      toast.error('Please select at least 2 PDF files to merge', {
        icon: '⚠️',
        style: {
          borderRadius: '12px',
          background: '#fef3c7',
          color: '#d97706',
        },
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 20, 90));
      }, 200);

      const mergedPdf = await PDFProcessor.mergePDFs({
        files: mergeFiles,
        outputName,
      });

      clearInterval(progressInterval);
      setProgress(100);

      PDFProcessor.downloadFile(mergedPdf, outputName);

      toast.success(`Successfully merged ${mergeFiles.length} PDF files!`, {
        icon: '🎉',
        style: {
          borderRadius: '12px',
          background: '#f0fdf4',
          color: '#059669',
        },
      });

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      toast.error('Failed to merge PDFs. Please try again.', {
        icon: '❌',
        style: {
          borderRadius: '12px',
          background: '#fee2e2',
          color: '#dc2626',
        },
      });
      console.error('Merge error:', error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const totalPages = mergeFiles.reduce((sum, file) => sum + file.pages, 0);
  const totalSize = mergeFiles.reduce((sum, file) => sum + file.size, 0);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-8 animate-fade-in-up">
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Combine className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Merge PDF Files</h2>
            <p className="text-slate-600">Combine multiple PDF documents into a single file</p>
          </div>
        </div>

        {/* Output filename input */}
        <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">Output Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="outputName" className="text-base font-medium text-slate-700 mb-2 block">
                Output filename
              </Label>
              <Input
                id="outputName"
                type="text"
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                placeholder="merged-document.pdf"
                className="text-base py-3 bg-white/80 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>
          </CardContent>
        </Card>

        {/* File list section */}
        <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-slate-800 flex items-center space-x-2">
                <span>Files to merge</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {mergeFiles.length} files
                </Badge>
              </CardTitle>
              {mergeFiles.length > 0 && (
                <p className="text-sm text-slate-500 flex items-center space-x-1">
                  <GripVertical className="w-4 h-4" />
                  <span>Drag to reorder</span>
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {mergeFiles.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <X className="w-10 h-10 text-slate-400" />
                </div>
                <p className="text-slate-500 text-lg">No files selected for merging</p>
                <p className="text-slate-400 text-sm mt-1">Add at least 2 PDF files to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {mergeFiles.map((file, index) => (
                  <DraggablePDFItem key={file.id} file={file} index={index} moveFile={moveFile} onRemove={removeFile} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Merge preview */}
        {mergeFiles.length > 1 && (
          <Card className="border-0 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg">
            <CardContent className="p-6">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                <ArrowRight className="w-5 h-5 text-blue-600" />
                <span>Merge Preview</span>
              </h4>
              <div className="flex items-center space-x-3 overflow-x-auto pb-2">
                {mergeFiles.slice(0, 4).map((file, index) => (
                  <React.Fragment key={file.id}>
                    <div className="flex-shrink-0 bg-white rounded-lg px-4 py-2 shadow-sm border border-blue-200">
                      <div className="text-sm font-medium text-slate-800 truncate max-w-32" title={file.name}>
                        {file.name.replace('.pdf', '')}
                      </div>
                      <div className="text-xs text-slate-500">{file.pages} pages</div>
                    </div>
                    {index < Math.min(mergeFiles.length - 1, 3) && (
                      <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    )}
                  </React.Fragment>
                ))}
                {mergeFiles.length > 4 && (
                  <div className="flex-shrink-0 bg-white rounded-lg px-4 py-2 shadow-sm border border-blue-200">
                    <div className="text-sm text-blue-600 font-medium">+{mergeFiles.length - 4} more</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary and actions */}
        <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{mergeFiles.length}</div>
                  <div className="text-sm text-blue-600">Files</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">{totalPages}</div>
                  <div className="text-sm text-purple-600">Total Pages</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{formatFileSize(totalSize)}</div>
                  <div className="text-sm text-green-600">Total Size</div>
                </div>
              </div>

              {/* Progress bar */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Merging PDFs...</span>
                    <span className="text-blue-600 font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 py-3 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  disabled={isProcessing}>
                  Cancel
                </Button>
                <Button
                  onClick={handleMerge}
                  disabled={mergeFiles.length < 2 || isProcessing}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200">
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Merging...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Merge & Download
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DndProvider>
  );
};
