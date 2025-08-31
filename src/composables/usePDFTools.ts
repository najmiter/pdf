import { ref, computed } from 'vue';
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

export interface PDFFile {
  id: string;
  name: string;
  file: File;
  doc?: any;
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
      const doc = await PDFDocument.load(arrayBuffer);

      return {
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        file,
        doc,
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

    try {
      const fileArray = Array.from(fileList);
      const pdfFiles = fileArray.filter((file) => file.type === 'application/pdf');

      for (const file of pdfFiles) {
        const pdfFile = await loadPDFFile(file);
        files.value.push(pdfFile);
      }
    } catch (error) {
      // console.error('Error loading PDF files:', error);
    } finally {
      isProcessing.value = false;
    }
  };

  const removeFile = (fileId: string) => {
    files.value = files.value.filter((f) => f.id !== fileId);
  };

  const mergePDFs = async (selectedFileIds: string[]): Promise<Blob> => {
    isProcessing.value = true;
    currentTool.value = 'merge';
    processingProgress.value = 0;
    processingStep.value = 'Preparing files...';

    const mergedPdf = await PDFDocument.create();
    let totalPages = 0;

    for (const fileId of selectedFileIds) {
      const file = files.value.find((f) => f.id === fileId);
      if (file) totalPages += file.pages;
    }

    let processedPages = 0;

    for (const fileId of selectedFileIds) {
      const file = files.value.find((f) => f.id === fileId);
      if (file?.doc) {
        const pageIndices = file.doc.getPageIndices();
        const batchSize = 10; // process 10 pages at a time
        for (let i = 0; i < pageIndices.length; i += batchSize) {
          const batchIndices = pageIndices.slice(i, i + batchSize);
          const pages = await mergedPdf.copyPages(file.doc, batchIndices);
          pages.forEach((page) => mergedPdf.addPage(page));
        }

        processedPages += file.pages;
        const progress = (processedPages / totalPages) * 90; // leave 10% for final save
        processingProgress.value = progress;
        processingStep.value = `Merging ${file.name}...`;
      }
    }

    processingProgress.value = 95;
    processingStep.value = 'Finalizing merged document...';

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
    isProcessing.value = true;
    currentTool.value = 'split';
    processingProgress.value = 0;
    processingStep.value = 'Preparing to split...';

    const file = files.value.find((f) => f.id === fileId);
    if (!file?.doc) throw new Error('File not found');

    const splits: Blob[] = [];
    const totalRanges = ranges.length;
    let processedRanges = 0;

    for (const range of ranges) {
      const newPdf = await PDFDocument.create();
      const pageIndices = Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start - 1 + i);

      processingStep.value = `Processing pages ${range.start}-${range.end}...`;
      const batchSize = 5; // smaller batch for splits
      for (let i = 0; i < pageIndices.length; i += batchSize) {
        const batch = pageIndices.slice(i, i + batchSize);
        const pages = await newPdf.copyPages(file.doc, batch);
        pages.forEach((page) => newPdf.addPage(page));
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
    isProcessing.value = true;
    currentTool.value = 'remove';
    processingProgress.value = 0;
    processingStep.value = 'Preparing to remove pages...';

    const file = files.value.find((f) => f.id === fileId);
    if (!file?.doc) throw new Error('File not found');

    const newPdf = await PDFDocument.create();
    const allPages = Array.from({ length: file.pages }, (_, i) => i);
    const pagesToKeep = allPages.filter((page) => !pagesToRemove.includes(page + 1));

    processingProgress.value = 50;
    processingStep.value = 'Copying remaining pages...';

    const batchSize = 10;
    for (let i = 0; i < pagesToKeep.length; i += batchSize) {
      const batch = pagesToKeep.slice(i, i + batchSize);
      const pages = await newPdf.copyPages(file.doc, batch);
      pages.forEach((page) => newPdf.addPage(page));
    }

    processingProgress.value = 90;
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
    if (!file?.doc) throw new Error('File not found');

    const newPdf = await PDFDocument.create();
    const pageIndices = file.doc.getPageIndices();
    const batchSize = 10;
    for (let i = 0; i < pageIndices.length; i += batchSize) {
      const batchIndices = pageIndices.slice(i, i + batchSize);
      const pages = await newPdf.copyPages(file.doc, batchIndices);
      pages.forEach((page, idx) => {
        if (pageIndices[i + idx] === pageIndex) {
          page.setRotation(degrees(rotation));
        }
        newPdf.addPage(page);
      });
    }

    const pdfBytes = await newPdf.save();
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
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

  const convertToImages = async (
    format: 'png' | 'jpeg' = 'png',
    quality: number = 1.0,
    onProgress?: (progress: number, currentStep: string) => void
  ): Promise<void> => {
    if (selectedPages.value.size === 0) return;

    isProcessing.value = true;
    currentTool.value = 'convert';

    try {
      const zip = new JSZip();
      const imagesFolder = zip.folder('pdf_images');

      let globalIndex = 1;
      let imageCount = 0;
      const totalPages = selectedPages.value.size;
      const batchSize = Math.min(5, Math.max(1, Math.floor(100 / totalPages))); // Dynamic batch size based on total pages
      let processedPages = 0;

      const pagesToProcess: Array<{ file: PDFFile; pageNum: number; globalIndex: number }> = [];

      for (const file of files.value) {
        for (let pageNum = 1; pageNum <= file.pages; pageNum++) {
          if (selectedPages.value.has(globalIndex)) {
            pagesToProcess.push({ file, pageNum, globalIndex });
          }
          globalIndex++;
        }
      }

      for (let i = 0; i < pagesToProcess.length; i += batchSize) {
        const batch = pagesToProcess.slice(i, i + batchSize);

        const batchPromises = batch.map(async ({ file, pageNum }) => {
          const pdf = await pdfjsLib.getDocument(file.url).promise;
          const page = await pdf.getPage(pageNum);

          const scale = format === 'jpeg' ? 2.0 : 2.5;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d', {
            alpha: format === 'png',
            willReadFrequently: false,
          })!;

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

          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), format === 'png' ? 'image/png' : 'image/jpeg', quality);
          });

          canvas.width = 0;
          canvas.height = 0;

          return { file, pageNum, blob };
        });

        const batchResults = await Promise.all(batchPromises);

        for (const { file, pageNum, blob } of batchResults) {
          const filename = `${file.name.replace('.pdf', '')}_page_${pageNum}.${format}`;
          imagesFolder!.file(filename, blob);
          imageCount++;
          processedPages++;

          const progress = (processedPages / totalPages) * 100;
          const currentStep = `Processing page ${processedPages} of ${totalPages}`;
          onProgress?.(progress, currentStep);
          processingProgress.value = progress;
          processingStep.value = currentStep;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      onProgress?.(95, 'Generating ZIP file...');
      processingProgress.value = 95;
      processingStep.value = 'Generating ZIP file...';

      // zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFilename = `pdf_images_${imageCount}_pages.zip`;

      onProgress?.(100, 'Download starting...');
      processingProgress.value = 100;
      processingStep.value = 'Download starting...';

      downloadBlob(zipBlob, zipFilename);
    } catch (error) {
      // console.error('Error converting to images:', error);
      throw error;
    } finally {
      isProcessing.value = false;
      currentTool.value = null;
      processingProgress.value = null;
      processingStep.value = '';
    }
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
    convertToImages,
    downloadBlob,
  };
}
