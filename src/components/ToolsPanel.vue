<template>
  <div class="w-80 border-l bg-background/50 backdrop-blur-sm p-6 h-full overflow-y-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold">PDF Tools</h2>
    </div>

    <!-- Tool Cards -->
    <div class="space-y-4">
      <!-- Merge Tool -->
      <div class="p-4 border rounded-lg space-y-3">
        <div class="flex items-center space-x-2">
          <Icon icon="lucide:file-plus" class="h-5 w-5 text-primary" />
          <h3 class="font-medium">Merge PDFs</h3>
        </div>
        <p class="text-sm text-muted-foreground">Combine multiple PDF files into one</p>
        <Button @click="handleMerge" :disabled="files.length < 2 || isProcessing" class="w-full" size="sm">
          <Icon icon="lucide:download" class="mr-2 h-4 w-4" />
          Merge All Files
        </Button>
      </div>

      <!-- Split Tool -->
      <div class="p-4 border rounded-lg space-y-3">
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
      <div class="p-4 border rounded-lg space-y-3">
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
            variant="destructive">
            <Icon icon="lucide:trash-2" class="mr-2 h-4 w-4" />
            Remove Selected Pages
          </Button>
        </div>
        <div v-else class="text-xs text-muted-foreground text-center py-2">Select pages to remove</div>
      </div>

      <!-- Selection Tools -->
      <div class="p-4 border rounded-lg space-y-3">
        <div class="flex items-center space-x-2">
          <Icon icon="lucide:mouse-pointer-click" class="h-5 w-5 text-primary" />
          <h3 class="font-medium">Selection</h3>
        </div>

        <div class="space-y-2">
          <Button @click="selectAllPages" :disabled="files.length === 0" variant="outline" class="w-full" size="sm">
            Select All Pages
          </Button>
          <Button
            @click="clearPageSelection"
            :disabled="selectedPages.size === 0"
            variant="outline"
            class="w-full"
            size="sm">
            Clear Selection
          </Button>
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
import { ref } from 'vue';
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
  downloadBlob: (blob: Blob, filename: string) => void;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  selectAll: [];
  clearSelection: [];
}>();

const splitMergeOption = ref<'merged' | 'separate'>('merged');

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

const selectAllPages = () => {
  emit('selectAll');
};

const clearPageSelection = () => {
  emit('clearSelection');
};
</script>
