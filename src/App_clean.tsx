import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { FileText, Merge, Scissors, RotateCw, Type, Trash2, Plus, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

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
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">PDF Tools</h1>
                <p className="text-gray-600">Process your PDF documents</p>
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

      <div className="container mx-auto px-6 py-8">
        {files.length === 0 ? (
          /* Empty State */
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-8 mb-12">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                  <FileText className="w-10 h-10 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-3">Get Started with PDF Tools</h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Upload your PDF files and use our tools to merge, split, rotate, and manipulate your documents
                  </p>
                </div>
              </div>
            </div>

            {/* Upload area */}
            <Card className="max-w-2xl mx-auto mb-12">
              <CardContent className="p-12">
                <FileUploader onFilesAdded={handleFilesAdded} />
              </CardContent>
            </Card>

            {/* Tool preview cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pdfTools.map((tool) => (
                <Card key={tool.id} className="p-6">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <tool.icon className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{tool.name}</h3>
                      <p className="text-gray-600 text-sm">{tool.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          /* Main Interface */
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Files section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Your PDF Files</h2>
                  <p className="text-gray-600">
                    {selectedFiles.size > 0
                      ? `${selectedFiles.size} of ${files.length} files selected`
                      : 'Select files to use tools'}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {files.length > 1 && (
                    <>
                      <Button variant="outline" size="sm" onClick={selectAll}>
                        Select All ({files.length})
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearSelection}>
                        Clear Selection
                      </Button>
                    </>
                  )}
                  <Button onClick={addMoreFiles}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add More Files
                  </Button>
                </div>
              </div>

              {/* Files grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
            </div>

            {/* Tools section */}
            <Card>
              <CardHeader>
                <CardTitle>PDF Processing Tools</CardTitle>
                <CardDescription>Select one or more files above, then choose a tool to process them</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {pdfTools.map((tool) => {
                    const canUse = tool.requiresMultiple ? selectedFiles.size >= 2 : selectedFiles.size === 1;

                    return (
                      <Button
                        key={tool.id}
                        variant={canUse ? tool.variant : 'outline'}
                        className="h-auto p-6 flex-col space-y-3"
                        disabled={!canUse}
                        onClick={() => openTool(tool.id)}>
                        <tool.icon className="w-6 h-6" />
                        <div className="text-center">
                          <div className="font-medium text-sm">{tool.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {tool.requiresMultiple ? `Need ${2}+ files` : 'Need 1 file'}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick actions for selected files */}
            {selectedFiles.size > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold mb-1">Quick Actions</h3>
                      <p className="text-sm text-gray-600">
                        {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {selectedFiles.size >= 2 && (
                        <Button onClick={() => openTool('merge')}>
                          <Merge className="w-4 h-4 mr-2" />
                          Merge {selectedFiles.size} files
                        </Button>
                      )}
                      {selectedFiles.size === 1 && (
                        <>
                          <Button onClick={() => openTool('split', getSelectedFiles()[0])} variant="outline">
                            <Scissors className="w-4 h-4 mr-2" />
                            Split
                          </Button>
                          <Button onClick={() => openTool('remove', getSelectedFiles()[0])} variant="destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove Pages
                          </Button>
                          <Button onClick={() => openTool('info', getSelectedFiles()[0])} variant="outline">
                            <Info className="w-4 h-4 mr-2" />
                            View Info
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Tool Sheets */}
      <Sheet open={activeTool === 'merge'} onOpenChange={(open) => !open && closeActiveTool()}>
        <SheetContent className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center space-x-3">
              <Merge className="w-5 h-5" />
              <span>Merge PDFs</span>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {activeTool === 'merge' && <MergeTool files={getSelectedFiles()} open={true} onClose={closeActiveTool} />}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activeTool === 'remove'} onOpenChange={(open) => !open && closeActiveTool()}>
        <SheetContent className="w-full sm:max-w-4xl">
          <SheetHeader>
            <SheetTitle className="flex items-center space-x-3">
              <Trash2 className="w-5 h-5" />
              <span>Remove Pages</span>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {activeTool === 'remove' && activeFile && (
              <PageRemovalTool file={activeFile} open={true} onClose={closeActiveTool} />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activeTool === 'split'} onOpenChange={(open) => !open && closeActiveTool()}>
        <SheetContent className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center space-x-3">
              <Scissors className="w-5 h-5" />
              <span>Split PDF</span>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {activeTool === 'split' && activeFile && <SplitTool file={activeFile} onClose={closeActiveTool} />}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activeTool === 'rotate'} onOpenChange={(open) => !open && closeActiveTool()}>
        <SheetContent className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center space-x-3">
              <RotateCw className="w-5 h-5" />
              <span>Rotate Pages</span>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {activeTool === 'rotate' && activeFile && <RotateTool file={activeFile} onClose={closeActiveTool} />}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activeTool === 'watermark'} onOpenChange={(open) => !open && closeActiveTool()}>
        <SheetContent className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center space-x-3">
              <Type className="w-5 h-5" />
              <span>Add Watermark</span>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {activeTool === 'watermark' && activeFile && <WatermarkTool file={activeFile} onClose={closeActiveTool} />}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activeTool === 'info'} onOpenChange={(open) => !open && closeActiveTool()}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center space-x-3">
              <Info className="w-5 h-5" />
              <span>PDF Information</span>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {activeTool === 'info' && activeFile && (
              <PDFInfoModal file={activeFile} open={true} onClose={closeActiveTool} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default App;
