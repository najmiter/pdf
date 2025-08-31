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
    const arrayBuffer = await file.arrayBuffer();
    const doc = await PDFDocument.load(arrayBuffer);
    const pages = doc.getPageCount();
    const url = URL.createObjectURL(file);

    return {
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      file,
      doc,
      url,
      pages,
      size: file.size,
    };
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
    const mergedPdf = await PDFDocument.create();

    for (const fileId of selectedFileIds) {
      const file = files.value.find((f) => f.id === fileId);
      if (file?.doc) {
        const pages = await mergedPdf.copyPages(file.doc, file.doc.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
      }
    }

    const pdfBytes = await mergedPdf.save();
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  };

  const splitPDF = async (fileId: string, ranges: PageRange[]): Promise<Blob[]> => {
    const file = files.value.find((f) => f.id === fileId);
    if (!file?.doc) throw new Error('File not found');

    const splits: Blob[] = [];

    for (const range of ranges) {
      const newPdf = await PDFDocument.create();
      const pageIndices = Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start - 1 + i);

      const pages = await newPdf.copyPages(file.doc, pageIndices);
      pages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      splits.push(new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }));
    }

    return splits;
  };

  const removePages = async (fileId: string, pagesToRemove: number[]): Promise<Blob> => {
    const file = files.value.find((f) => f.id === fileId);
    if (!file?.doc) throw new Error('File not found');

    const newPdf = await PDFDocument.create();
    const allPages = Array.from({ length: file.pages }, (_, i) => i);
    const pagesToKeep = allPages.filter((page) => !pagesToRemove.includes(page + 1));

    const pages = await newPdf.copyPages(file.doc, pagesToKeep);
    pages.forEach((page) => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  };

  const rotatePage = async (fileId: string, pageIndex: number, rotation: number): Promise<Blob> => {
    const file = files.value.find((f) => f.id === fileId);
    if (!file?.doc) throw new Error('File not found');

    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(file.doc, file.doc.getPageIndices());

    pages.forEach((page, index) => {
      if (index === pageIndex) {
        page.setRotation(degrees(rotation));
      }
      newPdf.addPage(page);
    });

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

  const convertToImages = async (format: 'png' | 'jpeg' = 'png', quality: number = 1.0): Promise<void> => {
    if (selectedPages.value.size === 0) return;

    isProcessing.value = true;
    currentTool.value = 'convert';

    try {
      const zip = new JSZip();
      const imagesFolder = zip.folder('pdf_images');

      let globalIndex = 1;
      let imageCount = 0;

      for (const file of files.value) {
        const pdf = await pdfjsLib.getDocument(file.url).promise;

        for (let pageNum = 1; pageNum <= file.pages; pageNum++) {
          if (selectedPages.value.has(globalIndex)) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 3.0 }); // High quality scale

            // Create canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d')!;
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render page to canvas
            const renderContext = {
              canvasContext: context,
              viewport: viewport,
              canvas: canvas,
            };

            await page.render(renderContext).promise;

            // Convert to blob
            const blob = await new Promise<Blob>((resolve) => {
              canvas.toBlob((blob) => resolve(blob!), format === 'png' ? 'image/png' : 'image/jpeg', quality);
            });

            // Add to zip
            const filename = `${file.name.replace('.pdf', '')}_page_${pageNum}.${format}`;
            imagesFolder!.file(filename, blob);

            imageCount++;
          }
          globalIndex++;
        }
      }

      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFilename = `pdf_images_${imageCount}_pages.zip`;
      downloadBlob(zipBlob, zipFilename);
    } catch (error) {
      console.error('Error converting to images:', error);
    } finally {
      isProcessing.value = false;
      currentTool.value = null;
    }
  };

  return {
    files,
    selectedPages,
    isProcessing,
    currentTool,
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
