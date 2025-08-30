import React, { useState } from 'react';
import { Type, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { PDFProcessor } from '../utils/pdfProcessor';
import type { PDFFile, WatermarkOperation } from '../types';

interface WatermarkToolProps {
  file: PDFFile;
  onClose: () => void;
}

export const WatermarkTool: React.FC<WatermarkToolProps> = ({ file, onClose }) => {
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.3);
  const [position, setPosition] = useState<WatermarkOperation['position']>('center');
  const [isProcessing, setIsProcessing] = useState(false);

  const positions = [
    { value: 'center', label: 'Center', icon: '⊕' },
    { value: 'top-left', label: 'Top Left', icon: '↖' },
    { value: 'top-right', label: 'Top Right', icon: '↗' },
    { value: 'bottom-left', label: 'Bottom Left', icon: '↙' },
    { value: 'bottom-right', label: 'Bottom Right', icon: '↘' },
  ] as const;

  const handleAddWatermark = async () => {
    if (!watermarkText.trim()) {
      toast.error('Please enter watermark text');
      return;
    }

    setIsProcessing(true);
    try {
      const watermarkedPdf = await PDFProcessor.addWatermark(
        {
          fileId: file.id,
          text: watermarkText,
          opacity,
          position,
        },
        file
      );

      const fileName = file.name.replace('.pdf', '_watermarked.pdf');
      PDFProcessor.downloadFile(watermarkedPdf, fileName);
      toast.success('Watermark added successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to add watermark');
      console.error('Watermark error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-modern-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Type className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Add Watermark</h2>
              <p className="text-sm text-gray-600">{file.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Watermark Text</label>
            <input
              type="text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter watermark text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Position</label>
            <div className="grid grid-cols-3 gap-2">
              {positions.map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => setPosition(pos.value)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                    position === pos.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}>
                  <div className="text-lg mb-1">{pos.icon}</div>
                  <div className="text-xs font-medium">{pos.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opacity: {Math.round(opacity * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">Preview</h4>
            <div className="bg-white border-2 border-dashed border-purple-200 rounded-lg h-32 relative overflow-hidden">
              <div
                className="absolute text-gray-400 select-none pointer-events-none"
                style={{
                  opacity: opacity,
                  ...(position === 'center' && { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }),
                  ...(position === 'top-left' && { top: '8px', left: '8px' }),
                  ...(position === 'top-right' && { top: '8px', right: '8px' }),
                  ...(position === 'bottom-left' && { bottom: '8px', left: '8px' }),
                  ...(position === 'bottom-right' && { bottom: '8px', right: '8px' }),
                }}>
                {watermarkText || 'WATERMARK'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">Add watermark to all pages</div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              Cancel
            </button>
            <button
              onClick={handleAddWatermark}
              disabled={!watermarkText.trim() || isProcessing}
              className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200">
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Add & Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
