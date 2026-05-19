import { ref, computed } from 'vue';
import { PDFDocument, degrees } from 'pdf-lib';
import JSZip from 'jszip';

let pdfjsLib: any = null;
const getPdfjsLib = async () => {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
  }
  return pdfjsLib;
};

export interface PDFFile {
  id: string;
  name: string;
  file: File;
  doc?: any;
  arrayBuffer?: ArrayBuffer;
  url: string;
  pages: number;
  size: number;
  thumbnail?: string;
}

export class PDFMemoryManager {
  private static instance: PDFMemoryManager;
  private pdfDocuments: Map<string, any> = new Map();
  private objectUrls: Set<string> = new Set();

  static getInstance(): PDFMemoryManager {
    if (!PDFMemoryManager.instance) {
      PDFMemoryManager.instance = new PDFMemoryManager();
    }
    return PDFMemoryManager.instance;
  }

  registerObjectUrl(url: string): void {
    this.objectUrls.add(url);
  }

  revokeObjectUrl(url: string): void {
    if (this.objectUrls.has(url)) {
      URL.revokeObjectURL(url);
      this.objectUrls.delete(url);
    }
  }

  cacheDocument(id: string, doc: any): void {
    this.pdfDocuments.set(id, doc);
  }

  getDocument(id: string): any {
    return this.pdfDocuments.get(id);
  }

  cleanupDocument(id: string): void {
    const doc = this.pdfDocuments.get(id);
    if (doc && doc.cleanup) {
      doc.cleanup();
    }
    this.pdfDocuments.delete(id);
  }

  cleanupAll(): void {
    for (const [, doc] of this.pdfDocuments) {
      if (doc && doc.cleanup) {
        doc.cleanup();
      }
    }
    this.pdfDocuments.clear();

    for (const url of this.objectUrls) {
      URL.revokeObjectURL(url);
    }
    this.objectUrls.clear();

    if ((window as any).gc) {
      (window as any).gc();
    }
  }
}

export interface PageRange {
  start: number;
  end: number;
}

export function usePDFTools() {
  const files = ref<PDFFile[]>([]);
  const selectedPages = ref<Set<number>>(new Set());
  const isProcessing = ref(false);
  const currentTool = ref<string | null>(null);
  const processingProgress = ref<number | null>(null);
  const processingStep = ref<string>('');

  const memoryManager = PDFMemoryManager.getInstance();

  const isUltraLargeDocument = (pages: number) => pages > 1000;
  const isGiantDocument = (pages: number) => pages > 2000;

  const getBatchSize = (pageCount: number) => {
    if (isGiantDocument(pageCount)) return 1;
    if (isUltraLargeDocument(pageCount)) return 2;
    if (pageCount > 100) return 3;
    return 5;
  };

  const getProcessingDelay = (pageCount: number) => {
    if (isGiantDocument(pageCount)) return 50;
    if (isUltraLargeDocument(pageCount)) return 20;
    return 10;
  };

  const shouldForceGC = (pageCount: number) => {
    return isUltraLargeDocument(pageCount) && (window as any).gc;
  };

  const startProcessing = (tool: string, step: string) => {
    isProcessing.value = true;
    currentTool.value = tool;
    processingProgress.value = 0;
    processingStep.value = step;
  };

  const finishProcessing = () => {
    isProcessing.value = false;
    currentTool.value = null;
    processingProgress.value = null;
    processingStep.value = '';
  };

  const updateProgress = (progress: number, step: string) => {
    processingProgress.value = progress;
    processingStep.value = step;
  };

  const processBatch = async (
    sourcePdf: any,
    targetPdf: any,
    pageIndices: number[],
    pageCount: number,
    onPageProcess?: (page: any, index: number) => void,
  ) => {
    if (!pageIndices.length) return;

    const batchSize = getBatchSize(pageCount);
    const delay = getProcessingDelay(pageCount);

    for (let i = 0; i < pageIndices.length; i += batchSize) {
      const batch = pageIndices.slice(i, i + batchSize);
      const pages = await targetPdf.copyPages(sourcePdf, batch);

      pages.forEach((page: any, idx: number) => {
        if (onPageProcess) {
          onPageProcess(page, pageIndices[i + idx]);
        }
        targetPdf.addPage(page);
      });

      await new Promise((resolve) => setTimeout(resolve, delay));

      if (shouldForceGC(pageCount)) {
        (window as any).gc();
      }
    }
  };

  const finalizePDF = async (pdf: any): Promise<Blob> => {
    updateProgress(95, 'Finalizing document...');
    const pdfBytes = await pdf.save();
    updateProgress(100, 'Download starting...');
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  };

  const totalPages = computed(() => files.value.reduce((sum, file) => sum + file.pages, 0));

  const parsePageRange = (range: string): PageRange[] => {
    const ranges: PageRange[] = [];
    const parts = range.split(',').map((p) => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map((n) => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          ranges.push({ start, end });
        }
      } else {
        const page = parseInt(part);
        if (!isNaN(page)) {
          ranges.push({ start: page, end: page });
        }
      }
    }

    return ranges;
  };

  const loadPDFFile = async (file: File): Promise<PDFFile> => {
    try {
      const url = URL.createObjectURL(file);
      memoryManager.registerObjectUrl(url);

      const lib = await getPdfjsLib();
      const pdfjsDoc = await lib.getDocument(url).promise;
      const pages = pdfjsDoc.numPages;

      const fileId = Math.random().toString(36).substring(2, 9);
      memoryManager.cacheDocument(fileId, pdfjsDoc);

      let doc: any = null;

      return {
        id: fileId,
        name: file.name,
        file,
        doc,
        arrayBuffer: undefined,
        url,
        pages,
        size: file.size,
      };
    } catch (error) {
      // console.error('Error loading PDF:', error);
      throw error;
    }
  };

  const addFiles = async (fileList: FileList | File[]) => {
    startProcessing('load', 'Loading files...');

    try {
      const newFiles: PDFFile[] = [];

      for (const file of Array.from(fileList)) {
        if (file.type === 'application/pdf') {
          const pdfFile = await loadPDFFile(file);
          newFiles.push(pdfFile);
        }
      }

      files.value = [...files.value, ...newFiles];
    } finally {
      finishProcessing();
    }
  };

  const getArrayBuffer = async (file: PDFFile): Promise<ArrayBuffer> => {
    if (!file.arrayBuffer) {
      file.arrayBuffer = await file.file.arrayBuffer();
    }
    return file.arrayBuffer;
  };

  const removeFile = (fileId: string) => {
    const file = files.value.find((f) => f.id === fileId);
    if (file) {
      memoryManager.revokeObjectUrl(file.url);
      memoryManager.cleanupDocument(file.id);

      if (file.arrayBuffer) {
        file.arrayBuffer = undefined;
      }
    }
    files.value = files.value.filter((f) => f.id !== fileId);
  };

  const mergePDFs = async (selectedFileIds: string[]): Promise<Blob> => {
    startProcessing('merge', 'Preparing files...');

    const mergedPdf = await PDFDocument.create();
    let processedPages = 0;

    const totalPages = selectedFileIds.reduce((sum, id) => {
      const file = files.value.find((f) => f.id === id);
      return sum + (file ? file.pages : 0);
    }, 0);

    for (const fileId of selectedFileIds) {
      const file = files.value.find((f) => f.id === fileId);
      if (file) {
        processingStep.value = `Processing ${file.name}...`;

        const arrayBuffer = await getArrayBuffer(file);
        const doc = await PDFDocument.load(arrayBuffer);
        const pageIndices = doc.getPageIndices();

        await processBatch(doc, mergedPdf, pageIndices, totalPages);
        processedPages += pageIndices.length;
        if (totalPages > 0) {
          const progress = (processedPages / totalPages) * 90;
          processingProgress.value = progress;
        }
      }
    }

    const result = await finalizePDF(mergedPdf);
    finishProcessing();
    return result;
  };

  const splitPDF = async (fileId: string, ranges: PageRange[]): Promise<Blob[]> => {
    const file = files.value.find((f) => f.id === fileId);
    if (!file) throw new Error('File not found');

    startProcessing('split', 'Preparing to split...');

    const totalRanges = ranges.length;
    let processedRanges = 0;
    const splits: Blob[] = [];

    const arrayBuffer = await getArrayBuffer(file);
    const doc = await PDFDocument.load(arrayBuffer);

    for (const range of ranges) {
      const newPdf = await PDFDocument.create();
      const pageIndices = Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start - 1 + i);

      processingStep.value = `Processing pages ${range.start}-${range.end}...`;
      await processBatch(doc, newPdf, pageIndices, file.pages);

      const pdfBytes = await newPdf.save();
      splits.push(new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }));

      processedRanges++;
      const progress = (processedRanges / totalRanges) * 100;
      processingProgress.value = progress;
    }

    finishProcessing();
    return splits;
  };

  const removePages = async (fileId: string, pagesToRemove: number[]): Promise<Blob> => {
    const file = files.value.find((f) => f.id === fileId);
    if (!file) throw new Error('File not found');

    startProcessing('remove', 'Analyzing pages...');

    const arrayBuffer = await getArrayBuffer(file);
    const doc = await PDFDocument.load(arrayBuffer);

    const allPages = Array.from({ length: file.pages }, (_, i) => i);
    const pagesToKeep = allPages.filter((page) => !pagesToRemove.includes(page + 1));

    processingProgress.value = 50;
    processingStep.value = 'Copying remaining pages...';

    const newPdf = await PDFDocument.create();
    await processBatch(doc, newPdf, pagesToKeep, file.pages);

    const result = await finalizePDF(newPdf);
    finishProcessing();
    return result;
  };

  const rotatePage = async (fileId: string, pageIndex: number, rotation: number): Promise<Blob> => {
    const file = files.value.find((f) => f.id === fileId);
    if (!file) throw new Error('File not found');

    startProcessing('rotate', 'Preparing to rotate...');

    const arrayBuffer = await getArrayBuffer(file);
    const doc = await PDFDocument.load(arrayBuffer);

    const newPdf = await PDFDocument.create();
    const pageIndices = doc.getPageIndices();

    const batchSize = getBatchSize(file.pages);
    const delay = getProcessingDelay(file.pages);

    for (let i = 0; i < pageIndices.length; i += batchSize) {
      const batch = pageIndices.slice(i, i + batchSize);
      const pages = await newPdf.copyPages(doc, batch);

      pages.forEach((page: any, idx: number) => {
        if (pageIndices[i + idx] === pageIndex) {
          page.setRotation(degrees(rotation));
        }
        newPdf.addPage(page);
      });

      await new Promise((resolve) => setTimeout(resolve, delay));

      if (shouldForceGC(file.pages)) {
        (window as any).gc();
      }
    }

    const result = await finalizePDF(newPdf);
    finishProcessing();
    return result;
  };

  const insertPDF = async (
    originalFileId: string,
    insertFileId: string,
    insertAtPage: number,
    ranges?: PageRange[],
  ): Promise<Blob> => {
    startProcessing('insert', 'Preparing files...');

    const originalFile = files.value.find((f) => f.id === originalFileId);
    const insertFile = files.value.find((f) => f.id === insertFileId);
    if (!originalFile || !insertFile) throw new Error('Files not found');

    if (insertAtPage < 1 || insertAtPage > originalFile.pages + 1) {
      throw new Error('Invalid insertion point');
    }

    const originalArrayBuffer = await getArrayBuffer(originalFile);
    const originalDoc = await PDFDocument.load(originalArrayBuffer);

    const insertArrayBuffer = await getArrayBuffer(insertFile);
    const insertDoc = await PDFDocument.load(insertArrayBuffer);

    const mergedPdf = await PDFDocument.create();

    const firstHalfIndices = Array.from({ length: insertAtPage - 1 }, (_, i) => i);
    if (firstHalfIndices.length > 0) {
      await processBatch(originalDoc, mergedPdf, firstHalfIndices, originalFile.pages);
    }

    processingProgress.value = 25;
    processingStep.value = 'Inserting pages...';

    let insertPages: number[];
    if (ranges && ranges.length > 0) {
      insertPages = [];
      for (const range of ranges) {
        for (let p = range.start; p <= range.end; p++) {
          insertPages.push(p - 1);
        }
      }
    } else {
      insertPages = insertDoc.getPageIndices();
    }

    await processBatch(insertDoc, mergedPdf, insertPages, insertFile.pages);

    processingProgress.value = 75;
    processingStep.value = 'Adding remaining pages...';

    const secondHalfIndices = Array.from(
      { length: originalFile.pages - insertAtPage + 1 },
      (_, i) => insertAtPage - 1 + i,
    );
    if (secondHalfIndices.length > 0) {
      await processBatch(originalDoc, mergedPdf, secondHalfIndices, originalFile.pages);
    }

    const result = await finalizePDF(mergedPdf);
    finishProcessing();
    return result;
  };

  const convertToImages = async (
    format: 'png' | 'jpeg' = 'png',
    quality: number = 1.0,
    onProgress?: (progress: number, currentStep: string) => void,
  ): Promise<void> => {
    if (selectedPages.value.size === 0) return;

    startProcessing('convert', 'Preparing conversion...');

    try {
      const zip = new JSZip();

      let globalIndex = 1;
      let processedPages = 0;
      const totalPages = selectedPages.value.size;

      for (const file of files.value) {
        const filePages: number[] = [];
        for (let page = 1; page <= file.pages; page++) {
          if (selectedPages.value.has(globalIndex)) {
            filePages.push(page);
          }
          globalIndex++;
        }

        if (filePages.length > 0) {
          const pdf = memoryManager.getDocument(file.id);

          for (const pageNum of filePages) {
            try {
              const page = await pdf.getPage(pageNum);

              const scale = totalPages > 50 ? 1.0 : 1.5;
              const viewport = page.getViewport({ scale });

              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              if (!context) throw new Error('Canvas context not available');

              canvas.height = viewport.height;
              canvas.width = viewport.width;

              context.fillStyle = 'white';
              context.fillRect(0, 0, canvas.width, canvas.height);

              const renderContext = {
                canvasContext: context,
                viewport: viewport,
                canvas: canvas,
              };

              await page.render(renderContext).promise;

              const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(
                  (b) => {
                    if (b) resolve(b);
                    else reject(new Error('Failed to create blob'));
                  },
                  format === 'jpeg' ? 'image/jpeg' : 'image/png',
                  quality,
                );
              });

              context.clearRect(0, 0, canvas.width, canvas.height);
              canvas.width = 0;
              canvas.height = 0;
              canvas.remove();

              const filename = `${file.name.replace('.pdf', '')}_page_${pageNum}.${format}`;
              zip?.file(filename, blob);
              processedPages++;

              const progress = (processedPages / totalPages) * 100;
              const currentStep = `Processing page ${processedPages} of ${totalPages}`;
              onProgress?.(progress, currentStep);
              processingProgress.value = progress;
              processingStep.value = currentStep;

              await new Promise((resolve) => setTimeout(resolve, 50));
            } catch (error) {
              // console.error(`Error processing page ${pageNum} of ${file.name}:`, error);
            }
          }

          pdf.cleanup();
        }
      }

      onProgress?.(95, 'Generating ZIP file...');
      processingProgress.value = 95;
      processingStep.value = 'Generating ZIP file...';

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFilename = `pdf_images_${processedPages}_pages.zip`;

      onProgress?.(100, 'Download starting...');
      processingProgress.value = 100;
      processingStep.value = 'Download starting...';

      downloadBlob(zipBlob, zipFilename);
    } catch (error) {
      // console.error('Error converting to images:', error);
      throw error;
    } finally {
      finishProcessing();
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const cleanup = () => {
    memoryManager.cleanupAll();
    files.value = [];
    selectedPages.value.clear();
  };

  return {
    files,
    selectedPages,
    isProcessing,
    currentTool,
    processingProgress,
    processingStep,
    totalPages,
    parsePageRange,
    addFiles,
    removeFile,
    mergePDFs,
    splitPDF,
    removePages,
    rotatePage,
    insertPDF,
    convertToImages,
    downloadBlob,
    cleanup,
  };
}
