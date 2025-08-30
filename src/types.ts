export interface PDFFile {
  id: string;
  name: string;
  file: File;
  pages: number;
  size: number;
  arrayBuffer?: ArrayBuffer;
  thumbnail?: string;
}

export interface PageSelection {
  fileId: string;
  pages: number[];
}

export interface MergeOperation {
  files: PDFFile[];
  outputName: string;
}

export interface SplitOperation {
  file: PDFFile;
  ranges: { start: number; end: number; name: string }[];
}

export interface RotateOperation {
  fileId: string;
  pages: number[];
  degrees: number;
}

export interface CompressOperation {
  fileId: string;
  quality: number;
}

export interface WatermarkOperation {
  fileId: string;
  text: string;
  opacity: number;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}
