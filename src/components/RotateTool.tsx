import React, { useState } from 'react';
import { RotateCw, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { PDFProcessor } from '../utils/pdfProcessor';
import type { PDFFile } from '../types';

interface RotateToolProps {
  file: PDFFile;
  onClose: () => void;
}

export const RotateTool: React.FC<RotateToolProps> = ({ file, onClose }) => {
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [rotation, setRotation] = useState<number>(90);
  const [isProcessing, setIsProcessing] = useState(false);

  const togglePage = (pageNumber: number) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageNumber)) {
      newSelected.delete(pageNumber);
    } else {
      newSelected.add(pageNumber);
    }
    setSelectedPages(newSelected);
  };

  const selectAll = () => {
    const allPages = new Set<number>();
    for (let i = 1; i <= file.pages; i++) {
      allPages.add(i);
    }
    setSelectedPages(allPages);
  };

  const clearSelection = () => {
    setSelectedPages(new Set());
  };

  const handleRotate = async () => {
    if (selectedPages.size === 0) {
      toast.error('Please select pages to rotate');
      return;
    }

    setIsProcessing(true);
    try {
      const rotatedPdf = await PDFProcessor.rotatePages(
        {
          fileId: file.id,
          pages: Array.from(selectedPages),
          degrees: rotation,
        },
        file
      );

      const fileName = file.name.replace('.pdf', '_rotated.pdf');
      PDFProcessor.downloadFile(rotatedPdf, fileName);
      toast.success(`Rotated ${selectedPages.size} page(s) successfully!`);
      onClose();
    } catch (error) {
      toast.error('Failed to rotate pages');
      console.error('Rotation error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-modern-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <RotateCw className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Rotate Pages</h2>
              <p className="text-sm text-gray-600">{file.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Rotation Amount</label>
            <div className="grid grid-cols-4 gap-3">
              {[90, 180, 270, -90].map((degree) => (
                <button
                  key={degree}
                  onClick={() => setRotation(degree)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    rotation === degree
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-green-300'
                  }`}>
                  <RotateCw className="w-6 h-6 mx-auto mb-1" />
                  <div className="text-sm font-medium">{degree > 0 ? `+${degree}°` : `${degree}°`}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Select Pages to Rotate</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={selectAll}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors duration-200">
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors duration-200">
                  Clear
                </button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto">
              <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {Array.from({ length: file.pages }, (_, i) => i + 1).map((pageNumber) => {
                  const isSelected = selectedPages.has(pageNumber);
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => togglePage(pageNumber)}
                      className={`
                        aspect-[3/4] p-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium
                        ${
                          isSelected
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-green-300 hover:bg-green-25'
                        }
                      `}>
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 text-sm text-gray-600">
              {selectedPages.size} of {file.pages} pages selected
            </div>
          </div>

          {selectedPages.size > 0 && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-sm text-green-700">
                <RotateCw className="w-4 h-4" />
                <span>
                  {selectedPages.size} page(s) will be rotated by {rotation > 0 ? `+${rotation}` : rotation}°
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">Rotate selected pages in {file.name}</div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              Cancel
            </button>
            <button
              onClick={handleRotate}
              disabled={selectedPages.size === 0 || isProcessing}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200">
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Rotating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Rotate & Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
