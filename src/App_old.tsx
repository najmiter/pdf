import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { FileText, Merge, Scissors, RotateCw, Type, Trash2, Download, Settings, Zap, Plus } from 'lucide-react';

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

  const handleDownload = (file: PDFFile) => {
    if (file.arrayBuffer) {
      PDFProcessor.downloadFile(new Uint8Array(file.arrayBuffer), file.name);
    }
  };

  const handleToolAction = (tool: ActiveTool, file?: PDFFile) => {
    setActiveTool(tool);
    if (file) {
      setActiveFile(file);
    }
  };

  const closeActiveTool = () => {
    setActiveTool(null);
    setActiveFile(null);
  };

  const getSelectedFiles = (): PDFFile[] => {
    return files.filter((file) => selectedFiles.has(file.id));
  };

  const clearSelection = () => {
    setSelectedFiles(new Set());
  };

  const selectAll = () => {
    setSelectedFiles(new Set(files.map((f) => f.id)));
  };

  const tools = [
    {
      id: 'merge' as const,
      name: 'Merge PDFs',
      icon: Merge,
      description: 'Combine multiple PDF files into one document',
      requiresMultiple: true,
      variant: 'default' as const,
    },
    {
      id: 'split' as const,
      name: 'Split PDF',
      icon: Scissors,
      description: 'Split PDF into multiple files by page ranges',
      requiresMultiple: false,
      variant: 'secondary' as const,
    },
    {
      id: 'remove' as const,
      name: 'Remove Pages',
      icon: Trash2,
      description: 'Remove specific pages from PDF documents',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'bg-card text-card-foreground border-border',
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">PDF Toolkit</h1>
                <p className="text-sm text-muted-foreground">Professional PDF manipulation</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                {files.length} file{files.length !== 1 ? 's' : ''}
              </Badge>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {files.length === 0 ? (
          /* Welcome Screen */
          <div className="flex flex-col items-center justify-center text-center py-12">
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 mx-auto">
                <FileText className="h-12 w-12 text-primary" />
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">Professional PDF Toolkit</h2>
                <p className="text-lg text-muted-foreground max-w-lg">
                  Upload PDF files and use powerful tools to merge, split, rotate, watermark, and more.
                </p>
              </div>

              <Card className="max-w-md mx-auto">
                <CardContent className="p-6">
                  <FileUploader onFilesAdded={handleFilesAdded} />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {tools.map((tool) => (
                  <Card key={tool.id} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-2">
                        <tool.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{tool.description}</CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Main Interface */
          <div className="space-y-8">
            {/* File Management Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your PDF Files</CardTitle>
                    <CardDescription>Manage your uploaded PDF documents</CardDescription>
                  </div>
                  <Button onClick={addMoreFiles} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Files
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Selection Controls */}
                {files.length > 1 && (
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      {selectedFiles.size} of {files.length} files selected
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={selectAll}>
                        Select All
                      </Button>
                      <Button variant="ghost" size="sm" onClick={clearSelection}>
                        Clear
                      </Button>
                    </div>
                  </div>
                )}

                {/* File Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {files.map((file) => (
                    <PDFFileCard
                      key={file.id}
                      file={file}
                      onRemove={handleFileRemove}
                      onDownload={handleDownload}
                      onView={(file) => handleToolAction('info', file)}
                      onRotate={(file) => handleToolAction('rotate', file)}
                      onSplit={(file) => handleToolAction('split', file)}
                      onInfo={(file) => handleToolAction('info', file)}
                      isSelected={selectedFiles.has(file.id)}
                      onSelect={files.length > 1 ? handleFileSelect : undefined}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tools Section */}
            <Card>
              <CardHeader>
                <CardTitle>PDF Tools</CardTitle>
                <CardDescription>Select files and choose a tool to perform operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tools.map((tool) => {
                    const canUse = tool.requiresMultiple ? selectedFiles.size >= 2 : selectedFiles.size === 1;

                    const IconComponent = tool.icon;

                    return (
                      <Card
                        key={tool.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          !canUse ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={() => {
                          if (!canUse) return;
                          if (tool.requiresMultiple) {
                            handleToolAction(tool.id);
                          } else {
                            const selectedFile = files.find((f) => selectedFiles.has(f.id));
                            if (selectedFile) {
                              handleToolAction(tool.id, selectedFile);
                            }
                          }
                        }}>
                        <CardHeader className="pb-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-2">
                            <IconComponent className="h-6 w-6 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{tool.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="mb-3">{tool.description}</CardDescription>

                          {!canUse && (
                            <Badge variant="outline" className="text-xs">
                              {tool.requiresMultiple ? 'Select 2+ files' : 'Select 1 file'}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Zap className="h-6 w-6 text-primary" />
                  <CardTitle>Quick Actions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => {
                      files.forEach((file) => handleDownload(file));
                    }}
                    disabled={files.length === 0}
                    variant="default"
                    className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download All Files
                  </Button>

                  <Button
                    onClick={() => {
                      setFiles([]);
                      setSelectedFiles(new Set());
                    }}
                    disabled={files.length === 0}
                    variant="destructive"
                    className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Files
                  </Button>
                </div>
              </CardContent>
            </Card>
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
