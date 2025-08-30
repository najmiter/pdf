import { PDFDocument, rgb, StandardFonts, degrees as pdfDegrees } from 'pdf-lib';
import type { PDFFile, MergeOperation, SplitOperation, RotateOperation, WatermarkOperation } from '../types';

export class PDFProcessor {
  /**
   * Load PDF and extract basic information
   */
  static async loadPDF(file: File): Promise<PDFFile> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPageCount();

    // Generate thumbnail (simplified - in a real app you might use PDF.js for rendering)
    const thumbnail = await this.generateThumbnail(arrayBuffer);

    return {
      id: crypto.randomUUID(),
      name: file.name,
      file,
      pages,
      size: file.size,
      arrayBuffer,
      thumbnail,
    };
  }

  /**
   * Generate a simple thumbnail representation
   */
  private static async generateThumbnail(_arrayBuffer: ArrayBuffer): Promise<string> {
    // This is a placeholder - in a real implementation, you'd use PDF.js or similar
    // to render the first page as an image
    return (
      'data:image/svg+xml;base64,' +
      btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="160" viewBox="0 0 120 160">
        <rect width="120" height="160" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
        <rect x="10" y="20" width="100" height="8" fill="#e9ecef"/>
        <rect x="10" y="35" width="80" height="6" fill="#e9ecef"/>
        <rect x="10" y="48" width="90" height="6" fill="#e9ecef"/>
        <rect x="10" y="61" width="75" height="6" fill="#e9ecef"/>
        <rect x="10" y="80" width="85" height="6" fill="#e9ecef"/>
        <rect x="10" y="93" width="70" height="6" fill="#e9ecef"/>
        <text x="60" y="130" text-anchor="middle" font-family="Arial" font-size="12" fill="#6c757d">PDF</text>
      </svg>
    `)
    );
  }

  /**
   * Merge multiple PDFs into one
   */
  static async mergePDFs(operation: MergeOperation): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();

    for (const file of operation.files) {
      if (!file.arrayBuffer) {
        throw new Error(`PDF ${file.name} not loaded properly`);
      }

      const pdf = await PDFDocument.load(file.arrayBuffer);
      const pageIndices = Array.from({ length: pdf.getPageCount() }, (_, i) => i);
      const pages = await mergedPdf.copyPages(pdf, pageIndices);

      pages.forEach((page) => mergedPdf.addPage(page));
    }

    return await mergedPdf.save();
  }

  /**
   * Remove specific pages from a PDF
   */
  static async removePages(file: PDFFile, pagesToRemove: number[]): Promise<Uint8Array> {
    if (!file.arrayBuffer) {
      throw new Error('PDF not loaded properly');
    }

    const pdfDoc = await PDFDocument.load(file.arrayBuffer);
    const totalPages = pdfDoc.getPageCount();

    // Convert to 0-based indices and sort in descending order
    const indicesToRemove = pagesToRemove
      .map((page) => page - 1)
      .filter((index) => index >= 0 && index < totalPages)
      .sort((a, b) => b - a);

    // Remove pages in reverse order to maintain correct indices
    for (const index of indicesToRemove) {
      pdfDoc.removePage(index);
    }

    return await pdfDoc.save();
  }

  /**
   * Extract specific pages from a PDF
   */
  static async extractPages(file: PDFFile, pageNumbers: number[]): Promise<Uint8Array> {
    if (!file.arrayBuffer) {
      throw new Error('PDF not loaded properly');
    }

    const sourcePdf = await PDFDocument.load(file.arrayBuffer);
    const newPdf = await PDFDocument.create();

    // Convert to 0-based indices
    const pageIndices = pageNumbers
      .map((page) => page - 1)
      .filter((index) => index >= 0 && index < sourcePdf.getPageCount())
      .sort((a, b) => a - b);

    const pages = await newPdf.copyPages(sourcePdf, pageIndices);
    pages.forEach((page) => newPdf.addPage(page));

    return await newPdf.save();
  }

  /**
   * Split PDF into multiple documents based on page ranges
   */
  static async splitPDF(operation: SplitOperation): Promise<{ name: string; data: Uint8Array }[]> {
    if (!operation.file.arrayBuffer) {
      throw new Error('PDF not loaded properly');
    }

    const sourcePdf = await PDFDocument.load(operation.file.arrayBuffer);
    const results: { name: string; data: Uint8Array }[] = [];

    for (const range of operation.ranges) {
      const newPdf = await PDFDocument.create();
      const pageIndices = Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start - 1 + i).filter(
        (index) => index >= 0 && index < sourcePdf.getPageCount()
      );

      if (pageIndices.length > 0) {
        const pages = await newPdf.copyPages(sourcePdf, pageIndices);
        pages.forEach((page) => newPdf.addPage(page));

        const pdfBytes = await newPdf.save();
        results.push({
          name: range.name || `${operation.file.name.replace('.pdf', '')}_pages_${range.start}-${range.end}.pdf`,
          data: pdfBytes,
        });
      }
    }

    return results;
  }

  /**
   * Rotate specific pages
   */
  static async rotatePages(operation: RotateOperation, file: PDFFile): Promise<Uint8Array> {
    if (!file.arrayBuffer) {
      throw new Error('PDF not loaded properly');
    }

    const pdfDoc = await PDFDocument.load(file.arrayBuffer);

    for (const pageNum of operation.pages) {
      const pageIndex = pageNum - 1;
      if (pageIndex >= 0 && pageIndex < pdfDoc.getPageCount()) {
        const page = pdfDoc.getPage(pageIndex);
        page.setRotation(pdfDegrees(operation.degrees));
      }
    }

    return await pdfDoc.save();
  }

  /**
   * Add watermark to PDF
   */
  static async addWatermark(operation: WatermarkOperation, file: PDFFile): Promise<Uint8Array> {
    if (!file.arrayBuffer) {
      throw new Error('PDF not loaded properly');
    }

    const pdfDoc = await PDFDocument.load(file.arrayBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      const fontSize = Math.min(width, height) * 0.05; // 5% of the smaller dimension

      let x: number, y: number;

      switch (operation.position) {
        case 'center':
          x = width / 2;
          y = height / 2;
          break;
        case 'top-left':
          x = fontSize;
          y = height - fontSize;
          break;
        case 'top-right':
          x = width - fontSize * operation.text.length * 0.6;
          y = height - fontSize;
          break;
        case 'bottom-left':
          x = fontSize;
          y = fontSize;
          break;
        case 'bottom-right':
          x = width - fontSize * operation.text.length * 0.6;
          y = fontSize;
          break;
        default:
          x = width / 2;
          y = height / 2;
      }

      page.drawText(operation.text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity: operation.opacity,
      });
    }

    return await pdfDoc.save();
  }

  /**
   * Get PDF information
   */
  static async getPDFInfo(file: PDFFile): Promise<{
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
    pages: number;
    size: number;
  }> {
    if (!file.arrayBuffer) {
      throw new Error('PDF not loaded properly');
    }

    const pdfDoc = await PDFDocument.load(file.arrayBuffer);

    return {
      title: pdfDoc.getTitle(),
      author: pdfDoc.getAuthor(),
      subject: pdfDoc.getSubject(),
      creator: pdfDoc.getCreator(),
      producer: pdfDoc.getProducer(),
      creationDate: pdfDoc.getCreationDate(),
      modificationDate: pdfDoc.getModificationDate(),
      pages: pdfDoc.getPageCount(),
      size: file.size,
    };
  }

  /**
   * Optimize/compress PDF (basic implementation)
   */
  static async compressPDF(file: PDFFile): Promise<Uint8Array> {
    if (!file.arrayBuffer) {
      throw new Error('PDF not loaded properly');
    }

    const pdfDoc = await PDFDocument.load(file.arrayBuffer);

    // Basic compression - pdf-lib has limited compression options
    // In a real app, you might want to use a dedicated compression service
    return await pdfDoc.save({
      useObjectStreams: false,
      addDefaultPage: false,
      objectsPerTick: 50,
    });
  }

  /**
   * Download a file
   */
  static downloadFile(data: Uint8Array, filename: string, mimeType: string = 'application/pdf'): void {
    const blob = new Blob([new Uint8Array(data)], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
}
