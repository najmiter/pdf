import React, { useState, useEffect } from 'react';
import { Info, Calendar, User, FileText, HardDrive } from 'lucide-react';
import { PDFProcessor } from '../utils/pdfProcessor';
import type { PDFFile } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PDFInfoModalProps {
  file: PDFFile;
  onClose: () => void;
  open: boolean;
}

interface PDFInfo {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pages: number;
  size: number;
}

export const PDFInfoModal: React.FC<PDFInfoModalProps> = ({ file, onClose, open }) => {
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPDFInfo = async () => {
      try {
        const info = await PDFProcessor.getPDFInfo(file);
        setPdfInfo(info);
      } catch (error) {
        console.error('Failed to load PDF info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPDFInfo();
  }, [file]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date?: Date): string => {
    if (!date) return 'Not available';
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value?: string | number }> = ({
    icon,
    label,
    value,
  }) => (
    <div className="flex items-start space-x-3 py-2">
      <div className="w-5 h-5 text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-sm text-muted-foreground break-words">{value || 'Not available'}</div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xl font-semibold">PDF Information</div>
              <p className="text-sm text-muted-foreground truncate max-w-64 font-normal" title={file.name}>
                {file.name}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-muted-foreground">Loading PDF information...</span>
            </div>
          ) : (
            <div className="space-y-1">
              <InfoRow icon={<FileText className="w-5 h-5" />} label="Title" value={pdfInfo?.title} />

              <InfoRow icon={<User className="w-5 h-5" />} label="Author" value={pdfInfo?.author} />

              <InfoRow icon={<FileText className="w-5 h-5" />} label="Subject" value={pdfInfo?.subject} />

              <InfoRow icon={<FileText className="w-5 h-5" />} label="Creator" value={pdfInfo?.creator} />

              <InfoRow icon={<FileText className="w-5 h-5" />} label="Producer" value={pdfInfo?.producer} />

              <InfoRow
                icon={<Calendar className="w-5 h-5" />}
                label="Creation Date"
                value={formatDate(pdfInfo?.creationDate)}
              />

              <InfoRow
                icon={<Calendar className="w-5 h-5" />}
                label="Modification Date"
                value={formatDate(pdfInfo?.modificationDate)}
              />

              <InfoRow icon={<FileText className="w-5 h-5" />} label="Pages" value={pdfInfo?.pages} />

              <InfoRow
                icon={<HardDrive className="w-5 h-5" />}
                label="File Size"
                value={formatFileSize(pdfInfo?.size || 0)}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
