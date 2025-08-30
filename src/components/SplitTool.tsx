import React, { useState } from 'react';
import { Scissors, X, Download, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PDFProcessor } from '../utils/pdfProcessor';
import type { PDFFile } from '../types';

interface SplitRange {
  id: string;
  start: number;
  end: number;
  name: string;
}

interface SplitToolProps {
  file: PDFFile;
  onClose: () => void;
}

export const SplitTool: React.FC<SplitToolProps> = ({ file, onClose }) => {
  const [ranges, setRanges] = useState<SplitRange[]>([
    { id: '1', start: 1, end: Math.ceil(file.pages / 2), name: `${file.name.replace('.pdf', '')}_part1.pdf` },
    {
      id: '2',
      start: Math.ceil(file.pages / 2) + 1,
      end: file.pages,
      name: `${file.name.replace('.pdf', '')}_part2.pdf`,
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addRange = () => {
    const lastRange = ranges[ranges.length - 1];
    const newStart = lastRange ? lastRange.end + 1 : 1;
    const newEnd = Math.min(newStart + 5, file.pages);

    if (newStart > file.pages) {
      toast.error('No more pages available');
      return;
    }

    const newRange: SplitRange = {
      id: Date.now().toString(),
      start: newStart,
      end: newEnd,
      name: `${file.name.replace('.pdf', '')}_part${ranges.length + 1}.pdf`,
    };

    setRanges([...ranges, newRange]);
  };

  const updateRange = (id: string, field: keyof SplitRange, value: string | number) => {
    setRanges(ranges.map((range) => (range.id === id ? { ...range, [field]: value } : range)));
  };

  const removeRange = (id: string) => {
    if (ranges.length <= 1) {
      toast.error('At least one range is required');
      return;
    }
    setRanges(ranges.filter((range) => range.id !== id));
  };

  const validateRanges = (): boolean => {
    for (const range of ranges) {
      if (range.start < 1 || range.end > file.pages || range.start > range.end) {
        toast.error(`Invalid range: ${range.start}-${range.end}. Please check page numbers.`);
        return false;
      }
      if (!range.name.trim()) {
        toast.error('All output files must have names');
        return false;
      }
    }

    // Check for overlapping ranges
    const sortedRanges = [...ranges].sort((a, b) => a.start - b.start);
    for (let i = 0; i < sortedRanges.length - 1; i++) {
      if (sortedRanges[i].end >= sortedRanges[i + 1].start) {
        toast.error('Ranges cannot overlap');
        return false;
      }
    }

    return true;
  };

  const handleSplit = async () => {
    if (!validateRanges()) return;

    setIsProcessing(true);
    try {
      const splitResults = await PDFProcessor.splitPDF({
        file,
        ranges: ranges.map((range) => ({
          start: range.start,
          end: range.end,
          name: range.name,
        })),
      });

      // Download all split files
      for (const result of splitResults) {
        PDFProcessor.downloadFile(result.data, result.name);
      }

      toast.success(`Successfully split into ${splitResults.length} files!`);
      onClose();
    } catch (error) {
      toast.error('Failed to split PDF');
      console.error('Split error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getCoveredPages = (): number => {
    return ranges.reduce((total, range) => total + (range.end - range.start + 1), 0);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">Split: {file.name}</h3>
        <p className="text-sm text-gray-600">Total pages: {file.pages}</p>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {ranges.map((range, index) => (
              <div key={range.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Part {index + 1}</h3>
                  {ranges.length > 1 && (
                    <button
                      onClick={() => removeRange(range.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Page</label>
                    <input
                      type="number"
                      min={1}
                      max={file.pages}
                      value={range.start}
                      onChange={(e) => updateRange(range.id, 'start', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Page</label>
                    <input
                      type="number"
                      min={1}
                      max={file.pages}
                      value={range.end}
                      onChange={(e) => updateRange(range.id, 'end', parseInt(e.target.value) || file.pages)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Output Filename</label>
                  <input
                    type="text"
                    value={range.name}
                    onChange={(e) => updateRange(range.id, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={`part${index + 1}.pdf`}
                  />
                </div>

                <div className="mt-2 text-sm text-gray-600">{range.end - range.start + 1} page(s)</div>
              </div>
            ))}
          </div>

          <button
            onClick={addRange}
            className="w-full mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-300 hover:text-orange-600 transition-colors duration-200 flex items-center justify-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Another Range</span>
          </button>

          <div className="mt-4 bg-orange-50 rounded-lg p-3">
            <div className="text-sm text-orange-700">
              <div className="flex justify-between">
                <span>Total pages covered:</span>
                <span className="font-medium">
                  {getCoveredPages()} / {file.pages}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Output files:</span>
                <span className="font-medium">{ranges.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">Split into {ranges.length} separate PDF file(s)</div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              Cancel
            </button>
            <button
              onClick={handleSplit}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200">
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Splitting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Split & Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
