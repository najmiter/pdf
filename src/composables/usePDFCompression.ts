import { ref, computed } from 'vue';
import { PDFDocument } from 'pdf-lib';

export interface CompressionSettings {
  quality: number; // 0.1 to 1.0
  removeMetadata: boolean;
  removeAnnotations: boolean;
  removeBookmarks: boolean;
  removeEmbeddedFiles: boolean;
  optimizeImages: boolean;
  removeUnusedObjects: boolean;
  linearize: boolean; // Fast web view
  useObjectStreams: boolean;
}

export interface CompressionResult {
  compressedFile: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  filename: string;
}

class PDFCompressionManager {
  private static instance: PDFCompressionManager;

  static getInstance(): PDFCompressionManager {
    if (!PDFCompressionManager.instance) {
      PDFCompressionManager.instance = new PDFCompressionManager();
    }
    return PDFCompressionManager.instance;
  }

  async compressPDF(
    file: File,
    settings: CompressionSettings,
    onProgress?: (progress: number, step: string) => void
  ): Promise<CompressionResult> {
    const originalSize = file.size;

    try {
      onProgress?.(10, 'Reading PDF file...');

      const arrayBuffer = await file.arrayBuffer();

      onProgress?.(30, 'Analyzing document structure...');

      const pdfDoc = await PDFDocument.load(arrayBuffer);

      onProgress?.(50, 'Applying compression settings...');

      // Apply compression settings
      if (settings.removeMetadata) {
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer('');
        pdfDoc.setCreator('');
        pdfDoc.setCreationDate(new Date(0));
        pdfDoc.setModificationDate(new Date(0));
      }

      // Remove bookmarks if requested
      if (settings.removeBookmarks) {
        // pdf-lib doesn't have direct bookmark removal API
        // This would require more advanced PDF manipulation
      }

      onProgress?.(70, 'Optimizing PDF structure...');

      // Save with compression options
      const saveOptions: any = {
        useObjectStreams: settings.removeUnusedObjects,
        addDefaultPage: false,
        objectsPerTick: settings.linearize ? 50 : 20,
      };

      const compressedBytes = await pdfDoc.save(saveOptions);

      onProgress?.(90, 'Finalizing compressed file...');

      const compressedBlob = new Blob([new Uint8Array(compressedBytes)], { type: 'application/pdf' });
      const compressedSize = compressedBlob.size;
      const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

      onProgress?.(100, 'Compression complete!');

      return {
        compressedFile: compressedBlob,
        originalSize,
        compressedSize,
        compressionRatio,
        filename: file.name.replace('.pdf', '_compressed.pdf'),
      };
    } catch (error) {
      console.error('PDF compression failed:', error);
      throw new Error(`Failed to compress PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  cleanup(): void {
    // No cleanup needed for now
  }
}

export function usePDFCompression() {
  const isCompressing = ref(false);
  const compressionProgress = ref(0);
  const compressionStep = ref('');
  const compressionResult = ref<CompressionResult | null>(null);
  const compressionError = ref<string | null>(null);

  const manager = PDFCompressionManager.getInstance();

  const defaultSettings: CompressionSettings = {
    quality: 0.85,
    removeMetadata: true,
    removeAnnotations: false,
    removeBookmarks: false,
    removeEmbeddedFiles: false,
    optimizeImages: true,
    removeUnusedObjects: true,
    linearize: true,
    useObjectStreams: true,
  };

  const compressedSizeReduction = computed(() => {
    if (!compressionResult.value) return 0;
    return compressionResult.value.compressionRatio;
  });

  const compressedSizeFormatted = computed(() => {
    if (!compressionResult.value) return '';
    return formatFileSize(compressionResult.value.compressedSize);
  });

  const originalSizeFormatted = computed(() => {
    if (!compressionResult.value) return '';
    return formatFileSize(compressionResult.value.originalSize);
  });

  const compressPDF = async (
    file: File,
    settings: CompressionSettings = defaultSettings
  ): Promise<CompressionResult | null> => {
    try {
      isCompressing.value = true;
      compressionProgress.value = 0;
      compressionStep.value = 'Starting compression...';
      compressionError.value = null;
      compressionResult.value = null;

      const result = await manager.compressPDF(file, settings, (progress, step) => {
        compressionProgress.value = progress;
        compressionStep.value = step;
      });

      compressionResult.value = result;
      return result;
    } catch (error) {
      compressionError.value = error instanceof Error ? error.message : 'Compression failed';
      console.error('Compression error:', error);
      return null;
    } finally {
      isCompressing.value = false;
    }
  };

  const downloadCompressedFile = (result: CompressionResult) => {
    const url = URL.createObjectURL(result.compressedFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetCompression = () => {
    compressionResult.value = null;
    compressionError.value = null;
    compressionProgress.value = 0;
    compressionStep.value = '';
  };

  const cleanup = () => {
    manager.cleanup();
    resetCompression();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCompressionPreset = (level: 'light' | 'medium' | 'aggressive'): CompressionSettings => {
    const baseSettings = { ...defaultSettings };

    switch (level) {
      case 'light':
        return {
          ...baseSettings,
          quality: 0.9,
          removeMetadata: false,
          removeAnnotations: false,
          optimizeImages: false,
        };
      case 'medium':
        return {
          ...baseSettings,
          quality: 0.75,
          removeMetadata: true,
          removeAnnotations: false,
          optimizeImages: true,
        };
      case 'aggressive':
        return {
          ...baseSettings,
          quality: 0.6,
          removeMetadata: true,
          removeAnnotations: true,
          removeBookmarks: true,
          optimizeImages: true,
        };
      default:
        return baseSettings;
    }
  };

  return {
    // State
    isCompressing,
    compressionProgress,
    compressionStep,
    compressionResult,
    compressionError,

    // Computed
    compressedSizeReduction,
    compressedSizeFormatted,
    originalSizeFormatted,

    // Actions
    compressPDF,
    downloadCompressedFile,
    resetCompression,
    cleanup,
    getCompressionPreset,

    // Constants
    defaultSettings,
  };
}
