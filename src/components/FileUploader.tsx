import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File } from 'lucide-react';
import { PDFProcessor } from '../utils/pdfProcessor';
import type { PDFFile } from '../types';
import toast from 'react-hot-toast';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface FileUploaderProps {
  onFilesAdded: (files: PDFFile[]) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesAdded }) => {
  const [isLoading, setIsLoading] = useState(false);

  const processFiles = useCallback(
    async (files: File[]) => {
      setIsLoading(true);
      const processedFiles: PDFFile[] = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          if (file.type !== 'application/pdf') {
            toast.error(`${file.name} is not a PDF file`);
            continue;
          }

          if (file.size > 50 * 1024 * 1024) {
            // 50MB limit
            toast.error(`${file.name} is too large (max 50MB)`);
            continue;
          }

          const pdfFile = await PDFProcessor.loadPDF(file);
          processedFiles.push(pdfFile);
        }

        if (processedFiles.length > 0) {
          onFilesAdded(processedFiles);
          toast.success(`Loaded ${processedFiles.length} PDF file${processedFiles.length > 1 ? 's' : ''}`);
        }
      } catch (error) {
        console.error('Error processing files:', error);
        toast.error('Failed to process some files');
      } finally {
        setIsLoading(false);
      }
    },
    [onFilesAdded]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      processFiles(acceptedFiles);
    },
    [processFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: true,
    disabled: isLoading,
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  return (
    <Card className="p-8 text-center border-2 border-dashed border-gray-300">
      <div {...getRootProps()} className="cursor-pointer">
        <input {...getInputProps()} />

        {isLoading ? (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-gray-600">Processing files...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {isDragActive ? (
              <>
                <Upload className="w-12 h-12 mx-auto text-blue-600" />
                <p className="text-lg font-medium text-blue-600">Drop PDF files here</p>
              </>
            ) : (
              <>
                <File className="w-12 h-12 mx-auto text-gray-400" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-700">Drag & drop PDF files here</p>
                  <p className="text-gray-500">or click to select files</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-6">
        <Button
          onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
          disabled={isLoading}
          variant="outline">
          Select Files
        </Button>
        <input type="file" multiple accept=".pdf" onChange={handleFileSelect} className="hidden" />
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>Supported format: PDF • Max file size: 50MB</p>
      </div>
    </Card>
  );
};
