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
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [searchQuery, setSearchQuery] = useState('');

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

  const getFilteredAndSortedFiles = () => {
    let filteredFiles = files;

    // Filter by search query
    if (searchQuery) {
      filteredFiles = files.filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Sort files
    return filteredFiles.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size':
          return b.size - a.size;
        case 'pages':
          return b.pages - a.pages;
        case 'date':
          return a.file.lastModified - b.file.lastModified;
        default:
          return 0;
      }
    });
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

  const downloadAllSelected = () => {
    getSelectedFiles().forEach((file) => {
      const url = URL.createObjectURL(file.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const pdfTools = [
    {
      id: 'merge' as const,
      name: 'Merge PDFs',
      icon: Merge,
      description: 'Combine multiple PDF files into one document',
      requiresMultiple: true,
      variant: 'default' as const,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      id: 'split' as const,
      name: 'Split PDF',
      icon: Scissors,
      description: 'Split PDF into separate documents or page ranges',
      requiresMultiple: false,
      variant: 'outline' as const,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      id: 'remove' as const,
      name: 'Remove Pages',
      icon: Trash2,
      description: 'Remove specific pages from PDF document',
      requiresMultiple: false,
      variant: 'destructive' as const,
      color: 'bg-red-500 hover:bg-red-600',
    },
    {
      id: 'rotate' as const,
      name: 'Rotate Pages',
      icon: RotateCw,
      description: 'Rotate pages in PDF document by 90° increments',
      requiresMultiple: false,
      variant: 'outline' as const,
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      id: 'watermark' as const,
      name: 'Add Watermark',
      icon: Type,
      description: 'Add text or image watermark to PDF pages',
      requiresMultiple: false,
      variant: 'secondary' as const,
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ];

  const displayedFiles = getFilteredAndSortedFiles();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            background: '#fff',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          },
        }}
      />

      {/* Modern Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PDF Toolkit Pro
                </h1>
                <p className="text-sm text-slate-600">Professional PDF processing and manipulation</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {files.length > 0 && (
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary" className="px-4 py-2 bg-blue-50 text-blue-700 border-blue-200">
                    {files.length} file{files.length !== 1 ? 's' : ''} loaded
                  </Badge>
                  {selectedFiles.size > 0 && (
                    <Badge variant="default" className="px-4 py-2 bg-purple-500">
                      {selectedFiles.size} selected
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {files.length === 0 ? (
          /* Enhanced Empty State */
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-8 mb-16">
              <div className="space-y-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                  <FileText className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Welcome to PDF Toolkit Pro
                  </h2>
                  <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                    Your comprehensive solution for PDF processing. Upload your files and choose from our powerful tools
                    to merge, split, rotate, watermark, and manipulate your PDF documents with ease.
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Upload area */}
            <Card className="max-w-3xl mx-auto mb-16 shadow-xl border-0 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-12">
                <FileUploader onFilesAdded={handleFilesAdded} />
              </CardContent>
            </Card>

            {/* Enhanced Tool preview cards */}
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-800 mb-3">Powerful PDF Tools</h3>
                <p className="text-slate-600">Everything you need to work with PDF documents</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pdfTools.map((tool) => (
                  <Card
                    key={tool.id}
                    className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm hover:-translate-y-1">
                    <CardContent className="p-8">
                      <div className="space-y-6">
                        <div
                          className={`w-16 h-16 ${tool.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <tool.icon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold mb-3 text-slate-800">{tool.name}</h4>
                          <p className="text-slate-600 leading-relaxed">{tool.description}</p>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <Badge variant="outline" className="text-xs">
                            {tool.requiresMultiple ? 'Multiple files' : 'Single file'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Enhanced Main Interface */
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Enhanced Files section header with search and controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-0">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Your PDF Files</h2>
                <p className="text-slate-600">
                  {selectedFiles.size > 0
                    ? `${selectedFiles.size} of ${files.length} files selected`
                    : `${files.length} files loaded`}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 w-64 bg-white/80 border-slate-200"
                  />
                </div>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
                  <SelectTrigger className="w-40 bg-white/80 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Sort by Name</SelectItem>
                    <SelectItem value="size">Sort by Size</SelectItem>
                    <SelectItem value="pages">Sort by Pages</SelectItem>
                    <SelectItem value="date">Sort by Date</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="flex items-center bg-white/80 rounded-lg border border-slate-200 p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="px-3">
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="px-3">
                    <List className="w-4 h-4" />
                  </Button>
                </div>

                {/* File Actions */}
                <div className="flex items-center gap-2">
                  {files.length > 1 && (
                    <>
                      <Button variant="outline" size="sm" onClick={selectAll} className="px-4">
                        Select All
                      </Button>
                      {selectedFiles.size > 0 && (
                        <Button variant="outline" size="sm" onClick={clearSelection} className="px-4">
                          Clear
                        </Button>
                      )}
                    </>
                  )}

                  {selectedFiles.size > 0 && (
                    <Button variant="outline" size="sm" onClick={downloadAllSelected} className="px-4">
                      <Download className="w-4 h-4 mr-2" />
                      Download Selected
                    </Button>
                  )}

                  <Button
                    onClick={addMoreFiles}
                    className="px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Files
                  </Button>
                </div>
              </div>
            </div>

            {/* Files display */}
            <div
              className={`
              ${
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'
                  : 'space-y-3'
              }
            `}>
              {displayedFiles.map((file) => (
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

            {/* Enhanced Tools section */}
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-slate-800">PDF Processing Tools</CardTitle>
                    <CardDescription className="text-base text-slate-600 mt-2">
                      Select files above, then choose a tool to process them
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-sm px-4 py-2">
                    {pdfTools.length} tools available
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  {pdfTools.map((tool) => {
                    const canUse = tool.requiresMultiple ? selectedFiles.size >= 2 : selectedFiles.size === 1;

                    return (
                      <Button
                        key={tool.id}
                        variant={canUse ? 'default' : 'outline'}
                        className={`h-auto p-6 flex-col space-y-4 transition-all duration-300 ${
                          canUse
                            ? `${tool.color} text-white hover:scale-105 shadow-lg`
                            : 'bg-white/80 hover:bg-white/90 border-slate-200'
                        }`}
                        disabled={!canUse}
                        onClick={() => openTool(tool.id)}>
                        <tool.icon className={`w-8 h-8 ${canUse ? 'text-white' : 'text-slate-400'}`} />
                        <div className="text-center">
                          <div className={`font-semibold ${canUse ? 'text-white' : 'text-slate-600'}`}>{tool.name}</div>
                          <div className={`text-xs mt-1 ${canUse ? 'text-white/80' : 'text-slate-400'}`}>
                            {tool.requiresMultiple ? `Need ${2}+ files` : 'Need 1 file'}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Quick actions */}
            {selectedFiles.size > 0 && (
              <Card className="border-0 bg-gradient-to-r from-blue-50 to-purple-50 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Quick Actions</h3>
                      <p className="text-slate-600">
                        {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected • Ready for processing
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {selectedFiles.size >= 2 && (
                        <Button
                          onClick={() => openTool('merge')}
                          className="px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg">
                          <Merge className="w-4 h-4 mr-2" />
                          Merge {selectedFiles.size} files
                        </Button>
                      )}
                      {selectedFiles.size === 1 && (
                        <>
                          <Button
                            onClick={() => openTool('split', getSelectedFiles()[0])}
                            variant="outline"
                            className="px-4 bg-white/80 hover:bg-white border-green-200 text-green-700 hover:text-green-800">
                            <Scissors className="w-4 h-4 mr-2" />
                            Split
                          </Button>
                          <Button
                            onClick={() => openTool('remove', getSelectedFiles()[0])}
                            variant="outline"
                            className="px-4 bg-white/80 hover:bg-white border-red-200 text-red-700 hover:text-red-800">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove Pages
                          </Button>
                          <Button
                            onClick={() => openTool('rotate', getSelectedFiles()[0])}
                            variant="outline"
                            className="px-4 bg-white/80 hover:bg-white border-purple-200 text-purple-700 hover:text-purple-800">
                            <RotateCw className="w-4 h-4 mr-2" />
                            Rotate
                          </Button>
                          <Button
                            onClick={() => openTool('info', getSelectedFiles()[0])}
                            variant="outline"
                            className="px-4 bg-white/80 hover:bg-white border-slate-200 text-slate-700 hover:text-slate-800">
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

      {/* Enhanced Tool Sheets with modern styling */}
      <Sheet open={activeTool === 'merge'} onOpenChange={(open) => !open && closeActiveTool()}>
        <SheetContent className="w-full sm:max-w-3xl bg-gradient-to-br from-white to-blue-50">
          <SheetHeader className="pb-6">
            <SheetTitle className="flex items-center space-x-3 text-xl">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <Merge className="w-5 h-5 text-white" />
              </div>
              <span>Merge PDF Files</span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-auto">
            {activeTool === 'merge' && <MergeTool files={getSelectedFiles()} open={true} onClose={closeActiveTool} />}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activeTool === 'remove'} onOpenChange={(open) => !open && closeActiveTool()}>
        <SheetContent className="w-full sm:max-w-4xl bg-gradient-to-br from-white to-red-50">
          <SheetHeader className="pb-6">
            <SheetTitle className="flex items-center space-x-3 text-xl">
              <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <span>Remove Pages</span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-auto">
            {activeTool === 'remove' && activeFile && (
              <PageRemovalTool file={activeFile} open={true} onClose={closeActiveTool} />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activeTool === 'split'} onOpenChange={(open) => !open && closeActiveTool()}>
        <SheetContent className="w-full sm:max-w-3xl bg-gradient-to-br from-white to-green-50">
          <SheetHeader className="pb-6">
            <SheetTitle className="flex items-center space-x-3 text-xl">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <span>Split PDF Document</span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-auto">
            {activeTool === 'split' && activeFile && <SplitTool file={activeFile} onClose={closeActiveTool} />}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activeTool === 'rotate'} onOpenChange={(open) => !open && closeActiveTool()}>
        <SheetContent className="w-full sm:max-w-3xl bg-gradient-to-br from-white to-purple-50">
          <SheetHeader className="pb-6">
            <SheetTitle className="flex items-center space-x-3 text-xl">
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                <RotateCw className="w-5 h-5 text-white" />
              </div>
              <span>Rotate Pages</span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-auto">
            {activeTool === 'rotate' && activeFile && <RotateTool file={activeFile} onClose={closeActiveTool} />}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activeTool === 'watermark'} onOpenChange={(open) => !open && closeActiveTool()}>
        <SheetContent className="w-full sm:max-w-3xl bg-gradient-to-br from-white to-orange-50">
          <SheetHeader className="pb-6">
            <SheetTitle className="flex items-center space-x-3 text-xl">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                <Type className="w-5 h-5 text-white" />
              </div>
              <span>Add Watermark</span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-auto">
            {activeTool === 'watermark' && activeFile && <WatermarkTool file={activeFile} onClose={closeActiveTool} />}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activeTool === 'info'} onOpenChange={(open) => !open && closeActiveTool()}>
        <SheetContent className="w-full sm:max-w-lg bg-gradient-to-br from-white to-slate-50">
          <SheetHeader className="pb-6">
            <SheetTitle className="flex items-center space-x-3 text-xl">
              <div className="w-10 h-10 bg-slate-500 rounded-xl flex items-center justify-center">
                <Info className="w-5 h-5 text-white" />
              </div>
              <span>PDF Information</span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-auto">
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
