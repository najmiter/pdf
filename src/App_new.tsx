import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { FileText, Merge, Scissors, RotateCw, Type, Trash2, Plus, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { FileUploader } from './components/FileUploader';
import { PDFFileCard } from './components/PDFFileCard';
import { MergeTool } from './components/MergeTool';
import { PageRemovalTool } from './components/PageRemovalTool';
import { SplitTool } from './components/SplitTool';
import { RotateTool } from './components/RotateTool';
import { WatermarkTool } from './components/WatermarkTool';
import { PDFInfoModal } from './components/PDFInfoModal';
import { PDFProcessor } from './utils/pdfProcessor';
import type { PDFFile } from './types';

type ActiveTool = 'merge' | 'remove' | 'split' | 'rotate' | 'watermark' | 'info' | null;

function App() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [activeFile, setActiveFile] = useState<PDFFile | null>(null);

  const handleFilesAdded = (newFiles: PDFFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleFileRemove = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });
  };

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const getSelectedFiles = () => {
    return files.filter((file) => selectedFiles.has(file.id));
  };

  const openTool = (tool: ActiveTool, file?: PDFFile) => {
    setActiveTool(tool);
    if (file) {
      setActiveFile(file);
    } else if (tool !== 'merge') {
      const selectedFile = getSelectedFiles()[0];
      setActiveFile(selectedFile || null);
    }
  };

  const closeActiveTool = () => {
    setActiveTool(null);
    setActiveFile(null);
  };

  const selectAll = () => {
    setSelectedFiles(new Set(files.map((f) => f.id)));
  };

  const clearSelection = () => {
    setSelectedFiles(new Set());
  };

  const addMoreFiles = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'application/pdf';
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        try {
          const loadedFiles = await Promise.all(files.map((file) => PDFProcessor.loadPDF(file)));
          handleFilesAdded(loadedFiles);
        } catch (error) {
          console.error('Error loading PDFs:', error);
        }
      }
    };
    input.click();
  };

  const pdfTools = [
    {
      id: 'merge' as const,
      name: 'Merge PDFs',
      icon: Merge,
      description: 'Combine multiple PDF files into one',
      requiresMultiple: true,
      variant: 'default' as const,
    },
    {
      id: 'split' as const,
      name: 'Split PDF',
      icon: Scissors,
      description: 'Split PDF into separate documents',
      requiresMultiple: false,
      variant: 'outline' as const,
    },
    {
      id: 'remove' as const,
      name: 'Remove Pages',
      icon: Trash2,
      description: 'Remove specific pages from PDF',
      requiresMultiple: false,
      variant: 'destructive' as const,
    },
    {
      id: 'rotate' as const,
      name: 'Rotate Pages',
      icon: RotateCw,
      description: 'Rotate pages in PDF document',
      requiresMultiple: false,
      variant: 'outline' as const,
    },
    {
      id: 'watermark' as const,
      name: 'Add Watermark',
      icon: Type,
      description: 'Add text watermark to PDF pages',
      requiresMultiple: false,
      variant: 'secondary' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">PDF Tools</h1>
                <p className="text-sm text-muted-foreground">Professional PDF processing</p>
              </div>
            </div>
            {files.length > 0 && (
              <Badge variant="secondary">
                {files.length} file{files.length !== 1 ? 's' : ''} loaded
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {files.length === 0 ? (
          /* Empty State */
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Upload PDF Files</h2>
              <p className="text-muted-foreground">Start by uploading PDF files to use the available tools</p>
            </div>

            <Card>
              <CardContent className="p-8">
                <FileUploader onFilesAdded={handleFilesAdded} />
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Main Interface */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Tools */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tools</CardTitle>
                  <CardDescription>Select files and choose a tool</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pdfTools.map((tool) => {
                    const canUse = tool.requiresMultiple ? selectedFiles.size >= 2 : selectedFiles.size === 1;

                    return (
                      <Button
                        key={tool.id}
                        variant={canUse ? tool.variant : 'ghost'}
                        className="w-full justify-start h-auto p-3"
                        disabled={!canUse}
                        onClick={() => openTool(tool.id)}>
                        <div className="flex items-start space-x-3 w-full">
                          <tool.icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div className="text-left">
                            <div className="font-medium text-sm">{tool.name}</div>
                            <div className="text-xs text-muted-foreground leading-tight">{tool.description}</div>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Selection info */}
              {selectedFiles.size > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Selection</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {selectedFiles.size} of {files.length} files selected
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={selectAll}>
                        Select All
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearSelection}>
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-4">
              {/* File management header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Your PDFs</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedFiles.size > 0
                      ? `${selectedFiles.size} file${selectedFiles.size !== 1 ? 's' : ''} selected`
                      : 'Click on files to select them'}
                  </p>
                </div>
                <Button onClick={addMoreFiles} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Files
                </Button>
              </div>

              {/* Files grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {files.map((file) => (
                  <PDFFileCard
                    key={file.id}
                    file={file}
                    isSelected={selectedFiles.has(file.id)}
                    onSelect={() => handleFileSelect(file.id)}
                    onRemove={() => handleFileRemove(file.id)}
                    onInfo={() => openTool('info', file)}
                  />
                ))}
              </div>

              {/* Quick actions for selected files */}
              {selectedFiles.size > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedFiles.size >= 2 && (
                        <Button onClick={() => openTool('merge')} size="sm" className="flex items-center space-x-2">
                          <Merge className="w-4 h-4" />
                          <span>Merge {selectedFiles.size} files</span>
                        </Button>
                      )}
                      {selectedFiles.size === 1 && (
                        <>
                          <Button
                            onClick={() => openTool('split', getSelectedFiles()[0])}
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-2">
                            <Scissors className="w-4 h-4" />
                            <span>Split</span>
                          </Button>
                          <Button
                            onClick={() => openTool('remove', getSelectedFiles()[0])}
                            variant="destructive"
                            size="sm"
                            className="flex items-center space-x-2">
                            <Trash2 className="w-4 h-4" />
                            <span>Remove Pages</span>
                          </Button>
                          <Button
                            onClick={() => openTool('info', getSelectedFiles()[0])}
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-2">
                            <Info className="w-4 h-4" />
                            <span>Info</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tool Modals */}
      {activeTool === 'merge' && <MergeTool files={getSelectedFiles()} open={true} onClose={closeActiveTool} />}

      {activeTool === 'remove' && activeFile && (
        <PageRemovalTool file={activeFile} open={true} onClose={closeActiveTool} />
      )}

      {activeTool === 'split' && activeFile && <SplitTool file={activeFile} onClose={closeActiveTool} />}

      {activeTool === 'rotate' && activeFile && <RotateTool file={activeFile} onClose={closeActiveTool} />}

      {activeTool === 'watermark' && activeFile && <WatermarkTool file={activeFile} onClose={closeActiveTool} />}

      {activeTool === 'info' && activeFile && <PDFInfoModal file={activeFile} open={true} onClose={closeActiveTool} />}
    </div>
  );
}

export default App;
