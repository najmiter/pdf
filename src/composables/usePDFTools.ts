import { ref, computed } from 'vue';
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import * as JSZip from 'jszip';

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

  const totalPages = computed(() => files.value.reduce((sum, file) => sum + file.pages, 0));

  const getGlobalPageIndex = (fileId: string, pageNumber: number): number => {
    let globalIndex = 0;
    for (const file of files.value) {
      if (file.id === fileId) {
        return globalIndex + pageNumber;
      }
      globalIndex += file.pages;
    }
    return globalIndex;
  };

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
      const pdfjsDoc = await pdfjsLib.getDocument(url).promise;
      const pages = pdfjsDoc.numPages;

      const arrayBuffer = await file.arrayBuffer();

      let doc: any = null;

      return {
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        file,
        doc,
        arrayBuffer,
        url,
        pages,
        size: file.size,
      };
    } catch (error) {
      console.error('Error loading PDF:', error);
      throw error;
    }
  };

  const addFiles = async (fileList: FileList | File[]) => {
    isProcessing.value = true;
    currentTool.value = 'load';

    try {
      const newFiles: PDFFile[] = [];

      for (const file of Array.from(fileList)) {
        if (file.type === 'application/pdf') {
          const pdfFile = await loadPDFFile(file);
          newFiles.push(pdfFile);
        }
      }

      files.value = [...files.value, ...newFiles];
    } catch (error) {
      console.error('Error adding files:', error);
    } finally {
      isProcessing.value = false;
      currentTool.value = null;
    }
  };

  const removeFile = (fileId: string) => {
    const file = files.value.find((f) => f.id === fileId);
    if (file) {
      if (file.url) {
        URL.revokeObjectURL(file.url);
      }
    }
    files.value = files.value.filter((f) => f.id !== fileId);
  };

  const mergePDFs = async (selectedFileIds: string[]): Promise<Blob> => {
    isProcessing.value = true;
    currentTool.value = 'merge';
    processingProgress.value = 0;
    processingStep.value = 'Preparing files...';

    const mergedPdf = await PDFDocument.create();
    let processedPages = 0;

    let totalPages = 0;
    for (const fileId of selectedFileIds) {
      const file = files.value.find((f) => f.id === fileId);
      if (file) {
        const fileGlobalIndices = new Set<number>();
        for (let pageNum = 1; pageNum <= file.pages; pageNum++) {
          const globalIndex = getGlobalPageIndex(fileId, pageNum);
          if (selectedPages.value.has(globalIndex)) {
            fileGlobalIndices.add(pageNum);
          }
        }

        if (fileGlobalIndices.size > 0) {
          totalPages += fileGlobalIndices.size;
        } else {
          totalPages += file.pages;
        }
      }
    }

    for (const fileId of selectedFileIds) {
      const file = files.value.find((f) => f.id === fileId);
      if (file) {
        processingStep.value = `Processing ${file.name}...`;

        const doc = await PDFDocument.load(file.arrayBuffer!);

        const selectedPageNumbers: number[] = [];
        for (let pageNum = 1; pageNum <= file.pages; pageNum++) {
          const globalIndex = getGlobalPageIndex(fileId, pageNum);
          if (selectedPages.value.has(globalIndex)) {
            selectedPageNumbers.push(pageNum - 1);
          }
        }

        let pageIndices: number[];
        if (selectedPageNumbers.length > 0) {
          pageIndices = selectedPageNumbers;
        } else {
          pageIndices = doc.getPageIndices();
        }

        const batchSize = 5;
        for (let i = 0; i < pageIndices.length; i += batchSize) {
          const batchIndices = pageIndices.slice(i, i + batchSize);
          const pages = await mergedPdf.copyPages(doc, batchIndices);
          pages.forEach((page) => mergedPdf.addPage(page));

          processedPages += batchIndices.length;
          const progress = (processedPages / totalPages) * 90;
          processingProgress.value = progress;

          // gc time? maybe remove it - idk
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
    }

    processingProgress.value = 95;
    processingStep.value = 'Finalizing document...';

    const pdfBytes = await mergedPdf.save();

    processingProgress.value = 100;
    processingStep.value = 'Download starting...';

    isProcessing.value = false;
    currentTool.value = null;
    processingProgress.value = null;
    processingStep.value = '';

    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  };

  const splitPDF = async (fileId: string, ranges: PageRange[]): Promise<Blob[]> => {
    const file = files.value.find((f) => f.id === fileId);
    if (!file) throw new Error('File not found');

    isProcessing.value = true;
    currentTool.value = 'split';
    processingProgress.value = 0;
    processingStep.value = 'Preparing to split...';

    const totalRanges = ranges.length;
    let processedRanges = 0;
    const splits: Blob[] = [];

    const arrayBuffer = file.arrayBuffer!;
    const doc = await PDFDocument.load(arrayBuffer);

    for (const range of ranges) {
      const newPdf = await PDFDocument.create();
      const pageIndices = Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start - 1 + i);

      processingStep.value = `Processing pages ${range.start}-${range.end}...`;
      const batchSize = 5;
      for (let i = 0; i < pageIndices.length; i += batchSize) {
        const batch = pageIndices.slice(i, i + batchSize);
        const pages = await newPdf.copyPages(doc, batch);
        pages.forEach((page) => newPdf.addPage(page));

        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const pdfBytes = await newPdf.save();
      splits.push(new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }));

      processedRanges++;
      const progress = (processedRanges / totalRanges) * 100;
      processingProgress.value = progress;
    }

    isProcessing.value = false;
    currentTool.value = null;
    processingProgress.value = null;
    processingStep.value = '';

    return splits;
  };

  const removePages = async (fileId: string, pagesToRemove: number[]): Promise<Blob> => {
    const file = files.value.find((f) => f.id === fileId);
    if (!file) throw new Error('File not found');

    isProcessing.value = true;
    currentTool.value = 'remove';
    processingProgress.value = 0;
    processingStep.value = 'Analyzing pages...';

    const arrayBuffer = file.arrayBuffer!;
    const doc = await PDFDocument.load(arrayBuffer);

    const allPages = Array.from({ length: file.pages }, (_, i) => i);
    const pagesToKeep = allPages.filter((page) => !pagesToRemove.includes(page + 1));

    processingProgress.value = 50;
    processingStep.value = 'Copying remaining pages...';

    const newPdf = await PDFDocument.create();
    const batchSize = 5;
    for (let i = 0; i < pagesToKeep.length; i += batchSize) {
      const batch = pagesToKeep.slice(i, i + batchSize);
      const pages = await newPdf.copyPages(doc, batch);
      pages.forEach((page) => newPdf.addPage(page));

      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    processingProgress.value = 95;
    processingStep.value = 'Finalizing document...';

    const pdfBytes = await newPdf.save();

    processingProgress.value = 100;
    processingStep.value = 'Download starting...';

    isProcessing.value = false;
    currentTool.value = null;
    processingProgress.value = null;
    processingStep.value = '';

    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  };

  const rotatePage = async (fileId: string, pageIndex: number, rotation: number): Promise<Blob> => {
    const file = files.value.find((f) => f.id === fileId);
    if (!file) throw new Error('File not found');

    isProcessing.value = true;
    currentTool.value = 'rotate';
    processingProgress.value = 0;
    processingStep.value = 'Preparing to rotate...';

    const arrayBuffer = file.arrayBuffer!;
    const doc = await PDFDocument.load(arrayBuffer);

    const newPdf = await PDFDocument.create();
    const pageIndices = doc.getPageIndices();
    const batchSize = 5;
    for (let i = 0; i < pageIndices.length; i += batchSize) {
      const batchIndices = pageIndices.slice(i, i + batchSize);
      const pages = await newPdf.copyPages(doc, batchIndices);
      pages.forEach((page, idx) => {
        if (pageIndices[i + idx] === pageIndex) {
          page.setRotation(degrees(rotation));
        }
        newPdf.addPage(page);
      });

      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    processingProgress.value = 95;
    processingStep.value = 'Finalizing document...';

    const pdfBytes = await newPdf.save();

    processingProgress.value = 100;
    processingStep.value = 'Download starting...';

    isProcessing.value = false;
    currentTool.value = null;
    processingProgress.value = null;
    processingStep.value = '';

    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  };

  const insertPDF = async (
    originalFileId: string,
    insertFileId: string,
    insertAtPage: number,
    ranges?: PageRange[]
  ): Promise<Blob> => {
    isProcessing.value = true;
    currentTool.value = 'insert';
    processingProgress.value = 0;
    processingStep.value = 'Preparing files...';

    const originalFile = files.value.find((f) => f.id === originalFileId);
    const insertFile = files.value.find((f) => f.id === insertFileId);
    if (!originalFile || !insertFile) throw new Error('Files not found');

    if (insertAtPage < 1 || insertAtPage > originalFile.pages + 1) {
      throw new Error('Invalid insertion point');
    }

    const originalArrayBuffer = originalFile.arrayBuffer!;
    const originalDoc = await PDFDocument.load(originalArrayBuffer);

    const insertArrayBuffer = insertFile.arrayBuffer!;
    const insertDoc = await PDFDocument.load(insertArrayBuffer);

    const mergedPdf = await PDFDocument.create();

    const firstHalfIndices = Array.from({ length: insertAtPage - 1 }, (_, i) => i);
    if (firstHalfIndices.length > 0) {
      const batchSize = 5;
      for (let i = 0; i < firstHalfIndices.length; i += batchSize) {
        const batchIndices = firstHalfIndices.slice(i, i + batchSize);
        const pages = await mergedPdf.copyPages(originalDoc, batchIndices);
        pages.forEach((page) => mergedPdf.addPage(page));

        await new Promise((resolve) => setTimeout(resolve, 10));
      }
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

    const batchSize = 5;
    for (let i = 0; i < insertPages.length; i += batchSize) {
      const batch = insertPages.slice(i, i + batchSize);
      const pages = await mergedPdf.copyPages(insertDoc, batch);
      pages.forEach((page) => mergedPdf.addPage(page));

      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    processingProgress.value = 75;
    processingStep.value = 'Adding remaining pages...';

    const secondHalfIndices = Array.from(
      { length: originalFile.pages - insertAtPage + 1 },
      (_, i) => insertAtPage - 1 + i
    );
    if (secondHalfIndices.length > 0) {
      for (let i = 0; i < secondHalfIndices.length; i += batchSize) {
        const batch = secondHalfIndices.slice(i, i + batchSize);
        const pages = await mergedPdf.copyPages(originalDoc, batch);
        pages.forEach((page) => mergedPdf.addPage(page));

        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    processingProgress.value = 95;
    processingStep.value = 'Finalizing document...';

    const pdfBytes = await mergedPdf.save();

    processingProgress.value = 100;
    processingStep.value = 'Download starting...';

    isProcessing.value = false;
    currentTool.value = null;
    processingProgress.value = null;
    processingStep.value = '';

    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  };

  const convertToImages = async (
    format: 'png' | 'jpeg' = 'png',
    quality: number = 1.0,
    onProgress?: (progress: number, currentStep: string) => void
  ): Promise<void> => {
    if (selectedPages.value.size === 0) return;

    isProcessing.value = true;
    currentTool.value = 'convert';

    try {
      const zip = new JSZip.default();

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
          const pdf = await pdfjsLib.getDocument(file.url).promise;

          for (const pageNum of filePages) {
            try {
              const page = await pdf.getPage(pageNum);

              const viewport = page.getViewport({ scale: 1.5 });

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
                  quality
                );
              });

              canvas.width = 0;
              canvas.height = 0;

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
              console.error(`Error processing page ${pageNum} of ${file.name}:`, error);
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
      console.error('Error converting to images:', error);
      throw error;
    } finally {
      isProcessing.value = false;
      currentTool.value = null;
      processingProgress.value = null;
      processingStep.value = '';
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
  };
}
