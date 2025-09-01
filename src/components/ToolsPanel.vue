<template>
  <div class="w-80 border-l bg-background/50 backdrop-blur-sm p-6 h-full overflow-y-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold">
        {{ selectedTool ? selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1) + ' Tool' : 'PDF Tools' }}
      </h2>
    </div>

    <!-- Tool Cards -->
    <div class="space-y-4">
      <!-- Tool List (when no tool selected) -->
      <div v-if="!selectedTool" class="space-y-2">
        <h3 class="text-sm font-medium text-muted-foreground mb-3">Available Tools</h3>

        <Button
          type="button"
          aria-label="Merge PDFs"
          @click="selectedTool = 'merge'"
          variant="soft"
          class="w-full justify-start p-3 h-auto">
          <div class="flex items-center space-x-3">
            <Icon icon="lucide:file-plus" class="h-5 w-5 text-primary" />
            <div class="text-left">
              <div class="font-medium">Merge PDFs</div>
              <div class="text-xs text-muted-foreground">Combine multiple PDF files</div>
            </div>
          </div>
        </Button>

        <Button
          type="button"
          aria-label="Split PDF"
          @click="selectedTool = 'split'"
          variant="soft"
          class="w-full justify-start p-3 h-auto">
          <div class="flex items-center space-x-3">
            <Icon icon="lucide:scissors" class="h-5 w-5 text-primary" />
            <div class="text-left">
              <div class="font-medium">Split PDF</div>
              <div class="text-xs text-muted-foreground">Extract pages from PDF files</div>
            </div>
          </div>
        </Button>

        <Button
          type="button"
          aria-label="Remove Pages"
          @click="selectedTool = 'remove'"
          variant="soft"
          class="w-full justify-start p-3 h-auto">
          <div class="flex items-center space-x-3">
            <Icon icon="lucide:trash-2" class="h-5 w-5 text-primary" />
            <div class="text-left">
              <div class="font-medium">Remove Pages</div>
              <div class="text-xs text-muted-foreground">Delete selected pages from PDFs</div>
            </div>
          </div>
        </Button>

        <Button
          type="button"
          aria-label="Convert to Images"
          @click="selectedTool = 'convert'"
          variant="soft"
          class="w-full justify-start p-3 h-auto">
          <div class="flex items-center space-x-3">
            <Icon icon="lucide:image" class="h-5 w-5 text-primary" />
            <div class="text-left">
              <div class="font-medium">Convert to Images</div>
              <div class="text-xs text-muted-foreground">Convert pages to PNG/JPEG</div>
            </div>
          </div>
        </Button>

        <Button
          type="button"
          aria-label="Insert PDF"
          @click="selectedTool = 'insert'"
          variant="soft"
          class="w-full justify-start p-3 h-auto">
          <div class="flex items-center space-x-3">
            <Icon icon="lucide:plus" class="h-5 w-5 text-primary" />
            <div class="text-left">
              <div class="font-medium">Insert PDF</div>
              <div class="text-xs text-muted-foreground">Insert one PDF into another</div>
            </div>
          </div>
        </Button>
      </div>

      <!-- Tool Controls (when tool selected) -->
      <div v-else class="space-y-4">
        <div class="flex items-center justify-between">
          <Button type="button" aria-label="back to tools" @click="selectedTool = null" variant="soft" size="sm">
            <Icon icon="lucide:arrow-left" class="mr-2 h-4 w-4" />
            Back to Tools
          </Button>
        </div>

        <!-- Merge Tool -->
        <div v-if="selectedTool === 'merge'" class="p-4 border rounded-lg space-y-3">
          <div class="flex items-center space-x-2">
            <Icon icon="lucide:file-plus" class="h-5 w-5 text-primary" />
            <h3 class="font-medium">Merge PDFs</h3>
          </div>
          <p class="text-sm text-muted-foreground">Combine multiple PDF files into one</p>
          <Button
            type="button"
            aria-label="merge all files"
            @click="handleMerge"
            :disabled="files.length < 2 || isProcessing"
            class="w-full"
            size="sm">
            <Icon icon="lucide:download" class="mr-2 h-4 w-4" />
            Merge All Files
          </Button>
        </div>

        <!-- Split Tool -->
        <div v-if="selectedTool === 'split'" class="p-4 border rounded-lg space-y-3">
          <div class="flex items-center space-x-2">
            <Icon icon="lucide:scissors" class="h-5 w-5 text-primary" />
            <h3 class="font-medium">Split PDF</h3>
          </div>
          <p class="text-sm text-muted-foreground">Extract pages from PDF files</p>

          <div v-if="selectedPages.size > 0" class="space-y-3">
            <p class="text-xs text-muted-foreground">{{ selectedPages.size }} page(s) selected</p>

            <!-- Split Options (when multiple pages selected) -->
            <div v-if="selectedPages.size > 1" class="space-y-2">
              <div class="text-xs font-medium text-muted-foreground">Output Options:</div>
              <div class="space-y-1">
                <label class="flex items-center space-x-2 text-xs">
                  <input v-model="splitMergeOption" type="radio" value="merged" class="w-3 h-3" />
                  <span>One merged PDF</span>
                </label>
                <label class="flex items-center space-x-2 text-xs">
                  <input v-model="splitMergeOption" type="radio" value="separate" class="w-3 h-3" />
                  <span>Separate PDFs for each page</span>
                </label>
              </div>
            </div>

            <Button
              type="button"
              aria-label="Split selected pages"
              @click="handleSplitSelected"
              :disabled="selectedPages.size === 0 || isProcessing"
              class="w-full"
              size="sm">
              <Icon icon="lucide:scissors" class="mr-2 h-4 w-4" />
              <span v-if="selectedPages.size === 1">Extract Selected Page</span>
              <span v-else-if="splitMergeOption === 'merged'">Extract & Merge Pages</span>
              <span v-else>Extract Pages Separately</span>
            </Button>
          </div>
          <div v-else class="text-xs text-muted-foreground text-center py-2">Select pages to split</div>
        </div>

        <!-- Remove Pages Tool -->
        <div v-if="selectedTool === 'remove'" class="p-4 border rounded-lg space-y-3">
          <div class="flex items-center space-x-2">
            <Icon icon="lucide:trash-2" class="h-5 w-5 text-primary" />
            <h3 class="font-medium">Remove Pages</h3>
          </div>
          <p class="text-sm text-muted-foreground">Delete selected pages from PDFs</p>

          <div v-if="selectedPages.size > 0" class="space-y-2">
            <p class="text-xs text-muted-foreground">{{ selectedPages.size }} page(s) selected</p>
            <Button
              @click="handleRemoveSelected"
              :disabled="selectedPages.size === 0 || isProcessing"
              class="w-full"
              size="sm"
              type="button"
              aria-label="Remove selected pages"
              variant="destructive">
              <Icon icon="lucide:trash-2" class="mr-2 h-4 w-4" />
              Remove Selected Pages
            </Button>
          </div>
          <div v-else class="text-xs text-muted-foreground text-center py-2">Select pages to remove</div>
        </div>

        <!-- Convert to Images Tool -->
        <div v-if="selectedTool === 'convert'" class="p-4 border rounded-lg space-y-3">
          <div class="flex items-center space-x-2">
            <Icon icon="lucide:image" class="h-5 w-5 text-primary" />
            <h3 class="font-medium">Convert to Images</h3>
          </div>
          <p class="text-sm text-muted-foreground">Convert selected pages to high-quality PNG/JPEG images</p>

          <div v-if="selectedPages.size > 0" class="space-y-3">
            <p class="text-xs text-muted-foreground">{{ selectedPages.size }} page(s) selected</p>

            <!-- Format Selection -->
            <div class="space-y-2">
              <div class="text-xs font-medium text-muted-foreground">Output Format:</div>
              <div class="space-y-1">
                <label class="flex items-center space-x-2 text-xs">
                  <input v-model="imageFormat" type="radio" value="png" class="w-3 h-3" />
                  <span>PNG (lossless)</span>
                </label>
                <label class="flex items-center space-x-2 text-xs">
                  <input v-model="imageFormat" type="radio" value="jpeg" class="w-3 h-3" />
                  <span>JPEG (smaller file size)</span>
                </label>
              </div>
            </div>

            <!-- Quality Slider (for JPEG) -->
            <div v-if="imageFormat === 'jpeg'" class="space-y-2">
              <div class="text-xs font-medium text-muted-foreground">Quality: {{ imageQuality }}%</div>
              <input
                v-model="imageQuality"
                type="range"
                min="70"
                max="100"
                step="5"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
            </div>

            <Button
              @click="handleConvertToImages"
              :disabled="selectedPages.size === 0 || isProcessing"
              class="w-full"
              type="button"
              aria-label="Convert to Images"
              size="sm">
              <Icon icon="lucide:download" class="mr-2 h-4 w-4" />
              Convert to {{ imageFormat.toUpperCase() }} & Download ZIP
            </Button>
          </div>
          <div v-else class="text-xs text-muted-foreground text-center py-2">Select pages to convert</div>
        </div>

        <!-- Insert PDF Tool -->
        <div v-if="selectedTool === 'insert'" class="p-4 border rounded-lg space-y-3">
          <div class="flex items-center space-x-2">
            <Icon icon="lucide:plus" class="h-5 w-5 text-primary" />
            <h3 class="font-medium">Insert PDF</h3>
          </div>
          <p class="text-sm text-muted-foreground">Insert one PDF into another at a specific point</p>

          <div v-if="files.length >= 2" class="space-y-3">
            <!-- Select Original PDF -->
            <div class="space-y-2">
              <div class="text-xs font-medium text-muted-foreground">Original PDF:</div>
              <select v-model="insertOriginalFileId" class="w-full p-2 border rounded text-sm">
                <option value="">Select original PDF</option>
                <option v-for="file in files" :key="file.id" :value="file.id">
                  {{ file.name }} ({{ file.pages }} pages)
                </option>
              </select>
            </div>

            <!-- Select Insert PDF -->
            <div class="space-y-2">
              <div class="text-xs font-medium text-muted-foreground">PDF to Insert:</div>
              <select v-model="insertFileId" class="w-full p-2 border rounded text-sm">
                <option value="">Select PDF to insert</option>
                <option
                  v-for="file in files"
                  :key="file.id"
                  :value="file.id"
                  :disabled="file.id === insertOriginalFileId">
                  {{ file.name }} ({{ file.pages }} pages)
                </option>
              </select>
            </div>

            <!-- Insertion Point -->
            <div class="space-y-2">
              <div class="text-xs font-medium text-muted-foreground">Insert at page:</div>
              <input
                v-model.number="insertAtPage"
                type="number"
                min="1"
                :max="(originalFile?.pages ?? 0) + 1"
                class="w-full p-2 border rounded text-sm"
                placeholder="e.g., 5" />
              <div class="text-xs text-muted-foreground">
                Insert before this page number (1 to {{ (originalFile?.pages ?? 0) + 1 }})
              </div>
            </div>

            <!-- Page Ranges (optional) -->
            <div class="space-y-2">
              <div class="text-xs font-medium text-muted-foreground">Pages to insert (optional):</div>
              <input
                v-model="insertRanges"
                type="text"
                class="w-full p-2 border rounded text-sm"
                placeholder="e.g., 1-3,5,7-9" />
              <div class="text-xs text-muted-foreground">
                Leave empty to insert all pages. Use ranges like 1-3 or single pages like 5.
              </div>
            </div>

            <Button
              type="button"
              aria-label="Insert PDF & download"
              @click="handleInsertPDF"
              :disabled="!insertOriginalFileId || !insertFileId || !insertAtPage || isProcessing"
              class="w-full"
              size="sm">
              <Icon icon="lucide:plus" class="mr-2 h-4 w-4" />
              Insert PDF & Download
            </Button>
          </div>
          <div v-else class="text-xs text-muted-foreground text-center py-2">
            Upload at least 2 PDFs to use this tool
          </div>
        </div>
      </div>
    </div>

    <!-- Processing Indicator -->
    <div v-if="isProcessing" class="mt-4 p-4 bg-muted rounded-lg">
      <div class="flex items-center space-x-3">
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
        <span class="text-sm">Processing...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import Button from '@/components/ui/Button.vue';
import type { PDFFile } from '@/composables/usePDFTools';

interface Props {
  files: PDFFile[];
  isProcessing: boolean;
  selectedPages: Set<number>;
  mergePDFs: (fileIds: string[]) => Promise<Blob>;
  splitPDF: (fileId: string, ranges: { start: number; end: number }[]) => Promise<Blob[]>;
  removePages: (fileId: string, pages: number[]) => Promise<Blob>;
  insertPDF: (
    originalFileId: string,
    insertFileId: string,
    insertAtPage: number,
    ranges?: { start: number; end: number }[]
  ) => Promise<Blob>;
  convertToImages: (
    format?: 'png' | 'jpeg',
    quality?: number,
    onProgress?: (progress: number, step: string) => void
  ) => Promise<void>;
  downloadBlob: (blob: Blob, filename: string) => void;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  progress: [progress: number, step: string];
}>();

const splitMergeOption = ref<'merged' | 'separate'>('merged');
const imageFormat = ref<'png' | 'jpeg'>('png');
const imageQuality = ref(90);
const selectedTool = ref<string | null>(null);

const insertOriginalFileId = ref<string>('');
const insertFileId = ref<string>('');
const insertAtPage = ref<number>(1);
const insertRanges = ref<string>('');

const originalFile = computed(() => props.files.find((f) => f.id === insertOriginalFileId.value) || null);

const parsePageRange = (range: string): { start: number; end: number }[] => {
  const ranges: { start: number; end: number }[] = [];
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

const handleMerge = async () => {
  try {
    const mergedBlob = await props.mergePDFs(props.files.map((f) => f.id));
    props.downloadBlob(mergedBlob, 'merged.pdf');
  } catch (error) {}
};

const handleSplitSelected = async () => {
  if (props.selectedPages.size === 0) return;

  try {
    // Group selected pages by file
    const pagesByFile = new Map<string, number[]>();

    let globalIndex = 1;
    for (const file of props.files) {
      const filePages: number[] = [];
      for (let page = 1; page <= file.pages; page++) {
        if (props.selectedPages.has(globalIndex)) {
          filePages.push(page);
        }
        globalIndex++;
      }
      if (filePages.length > 0) {
        pagesByFile.set(file.id, filePages);
      }
    }

    // If user wants merged output and has multiple pages selected
    if (splitMergeOption.value === 'merged' && props.selectedPages.size > 1) {
      // Create individual page blobs first
      const allPageBlobs: Blob[] = [];
      const selectedPageInfo: string[] = [];

      for (const [fileId, pages] of pagesByFile) {
        const file = props.files.find((f) => f.id === fileId);
        if (file) {
          const ranges = pages.map((p) => ({ start: p, end: p }));
          const splitBlobs = await props.splitPDF(fileId, ranges);

          splitBlobs.forEach((blob, index) => {
            allPageBlobs.push(blob);
            selectedPageInfo.push(`${file.name.replace('.pdf', '')}_page_${pages[index]}`);
          });
        }
      }

      // Merge all the extracted pages into one PDF
      if (allPageBlobs.length > 0) {
        // Create a temporary merged PDF by loading each blob and merging
        const { PDFDocument } = await import('pdf-lib');
        const mergedPdf = await PDFDocument.create();

        for (const blob of allPageBlobs) {
          const arrayBuffer = await blob.arrayBuffer();
          const sourcePdf = await PDFDocument.load(arrayBuffer);
          const [page] = await mergedPdf.copyPages(sourcePdf, [0]);
          mergedPdf.addPage(page);
        }

        const mergedBytes = await mergedPdf.save();
        const mergedBlob = new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' });

        const filename =
          selectedPageInfo.length > 1
            ? `merged_selected_pages_${selectedPageInfo.length}_pages.pdf`
            : `${selectedPageInfo[0]}.pdf`;

        props.downloadBlob(mergedBlob, filename);
      }
    } else {
      // Create separate files for each page (original behavior)
      for (const [fileId, pages] of pagesByFile) {
        const file = props.files.find((f) => f.id === fileId);
        if (file) {
          const ranges = pages.map((p) => ({ start: p, end: p }));
          const splitBlobs = await props.splitPDF(fileId, ranges);

          splitBlobs.forEach((blob, index) => {
            const filename =
              pages.length === 1
                ? `${file.name.replace('.pdf', '')}_page_${pages[index]}.pdf`
                : `${file.name.replace('.pdf', '')}_pages_${pages.join('-')}.pdf`;
            props.downloadBlob(blob, filename);
          });
        }
      }
    }
  } catch (error) {}
};

const handleRemoveSelected = async () => {
  if (props.selectedPages.size === 0) return;

  try {
    // Group selected pages by file
    const pagesByFile = new Map<string, number[]>();

    let globalIndex = 1;
    for (const file of props.files) {
      const filePages: number[] = [];
      for (let page = 1; page <= file.pages; page++) {
        if (props.selectedPages.has(globalIndex)) {
          filePages.push(page);
        }
        globalIndex++;
      }
      if (filePages.length > 0) {
        pagesByFile.set(file.id, filePages);
      }
    }

    // Remove pages from each file
    for (const [fileId, pagesToRemove] of pagesByFile) {
      const file = props.files.find((f) => f.id === fileId);
      if (file) {
        const resultBlob = await props.removePages(fileId, pagesToRemove);
        const filename = `${file.name.replace('.pdf', '')}_removed_pages.pdf`;
        props.downloadBlob(resultBlob, filename);
      }
    }
  } catch (error) {}
};

const handleConvertToImages = async () => {
  if (props.selectedPages.size === 0) return;

  try {
    const quality = imageFormat.value === 'jpeg' ? imageQuality.value / 100 : 1.0;
    await props.convertToImages(imageFormat.value, quality, (progress, step) => {
      emit('progress', progress, step);
    });
  } catch (error) {
    console.error('Error converting to images:', error);
  }
};

const handleInsertPDF = async () => {
  if (!insertOriginalFileId.value || !insertFileId.value || !insertAtPage.value) return;

  try {
    let ranges: { start: number; end: number }[] | undefined;
    if (insertRanges.value.trim()) {
      ranges = parsePageRange(insertRanges.value);
    }

    const resultBlob = await props.insertPDF(
      insertOriginalFileId.value,
      insertFileId.value,
      insertAtPage.value,
      ranges
    );

    const originalFile = props.files.find((f) => f.id === insertOriginalFileId.value);
    const insertFile = props.files.find((f) => f.id === insertFileId.value);
    const filename = `${originalFile?.name.replace('.pdf', '')}_inserted_${insertFile?.name.replace('.pdf', '')}.pdf`;

    props.downloadBlob(resultBlob, filename);
  } catch (error) {
    console.error('Error inserting PDF:', error);
  }
};
</script>
