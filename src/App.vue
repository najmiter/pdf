<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <Icon icon="lucide:file-text" class="h-6 w-6 text-primary" />
            <h1 class="text-xl font-bold">PDF Tool</h1>
          </div>
          <div v-if="files.length > 0" class="text-sm text-muted-foreground">
            {{ files.length }} file{{ files.length === 1 ? '' : 's' }} • {{ totalPages }} page{{
              totalPages === 1 ? '' : 's'
            }}
          </div>
        </div>
      </div>
    </header>

    <div class="flex h-[calc(100vh-73px)]">
      <!-- Main Content Area -->
      <main class="flex-1 p-6 overflow-auto">
        <!-- Drop Zone (shown when no files) -->
        <div v-if="files.length === 0" class="h-full flex items-center justify-center">
          <DropZone :isProcessing="isProcessing" @files-selected="handleFilesSelected" class="w-full max-w-2xl" />
        </div>

        <!-- PDF Pages Grid -->
        <div v-else class="space-y-6">
          <!-- File Management -->
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">PDF Pages</h2>
            <div class="flex items-center space-x-2">
              <Button variant="outline" @click="addMoreFiles">
                <Icon icon="lucide:plus" class="mr-2 h-4 w-4" />
                Add More Files
              </Button>
              <Button variant="outline" @click="clearAllFiles">
                <Icon icon="lucide:trash-2" class="mr-2 h-4 w-4" />
                Clear All
              </Button>
            </div>
          </div>

          <!-- Pages by File -->
          <div v-for="file in files" :key="file.id" class="space-y-4">
            <div class="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div class="flex items-center space-x-3">
                <Icon icon="lucide:file-text" class="h-5 w-5 text-primary" />
                <div>
                  <h3 class="font-medium">{{ file.name }}</h3>
                  <p class="text-sm text-muted-foreground">{{ file.pages }} pages • {{ formatFileSize(file.size) }}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" @click="removeFile(file.id)">
                <Icon icon="lucide:x" class="h-4 w-4" />
              </Button>
            </div>

            <!-- Page Grid for this file -->
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              <PDFPagePreview
                v-for="pageNum in file.pages"
                :key="`${file.id}-${pageNum}`"
                :pageNumber="pageNum"
                :fileName="file.name"
                :pdfDocument="file.doc"
                :isSelected="selectedPages.has(getGlobalPageIndex(file.id, pageNum))"
                @select="togglePageSelection(file.id, pageNum)" />
            </div>
          </div>
        </div>
      </main>

      <!-- Right Sidebar - Tools Panel -->
      <aside v-if="files.length > 0" class="w-80 border-l bg-background/50 backdrop-blur-sm">
        <div class="p-6 h-full overflow-y-auto">
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
              <Button
                @click="handleMerge(files.map((f) => f.id))"
                :disabled="files.length < 2 || isProcessing"
                class="w-full"
                size="sm">
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
                      <span>One merged PDF (default)</span>
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
                <Button
                  @click="selectAllPages"
                  :disabled="files.length === 0"
                  variant="outline"
                  class="w-full"
                  size="sm">
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
        </div>
      </aside>
    </div>

    <!-- Hidden file input for adding more files -->
    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept=".pdf,application/pdf"
      class="hidden"
      @change="handleFileInput" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { usePDFTools } from '@/composables/usePDFTools';
import DropZone from '@/components/DropZone.vue';
import PDFPagePreview from '@/components/PDFPagePreview.vue';
import Button from '@/components/ui/Button.vue';

const {
  files,
  selectedPages,
  isProcessing,
  totalPages,
  addFiles,
  removeFile,
  mergePDFs,
  splitPDF,
  removePages,
  downloadBlob,
} = usePDFTools();

const showToolsPanel = ref(false);
const fileInputRef = ref<HTMLInputElement>();
const splitMergeOption = ref<'merged' | 'separate'>('merged');

// Auto-open tools panel when files are added
watch(
  files,
  (newFiles) => {
    if (newFiles.length > 0 && !showToolsPanel.value) {
      showToolsPanel.value = true;
    }
  },
  { deep: true }
);

const handleFilesSelected = async (fileList: FileList) => {
  await addFiles(fileList);
};

const addMoreFiles = () => {
  fileInputRef.value?.click();
};

const handleFileInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files) {
    handleFilesSelected(target.files);
  }
};

const clearAllFiles = () => {
  files.value = [];
  selectedPages.value.clear();
  showToolsPanel.value = false;
};

const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const getGlobalPageIndex = (fileId: string, pageNumber: number): number => {
  let globalIndex = 0;
  for (const file of files.value) {
    if (file.id === fileId) {
      return globalIndex + pageNumber;
    }
    globalIndex += file.pages;
  }
  return globalIndex;
};

const togglePageSelection = (fileId: string, pageNumber: number) => {
  const globalIndex = getGlobalPageIndex(fileId, pageNumber);

  if (selectedPages.value.has(globalIndex)) {
    selectedPages.value.delete(globalIndex);
  } else {
    selectedPages.value.add(globalIndex);
  }
};

const clearPageSelection = () => {
  selectedPages.value.clear();
};

const selectAllPages = () => {
  selectedPages.value.clear();
  let globalIndex = 1;

  for (const file of files.value) {
    for (let page = 1; page <= file.pages; page++) {
      selectedPages.value.add(globalIndex);
      globalIndex++;
    }
  }
};

const handleSplitSelected = async () => {
  if (selectedPages.value.size === 0) return;

  try {
    // Group selected pages by file
    const pagesByFile = new Map<string, number[]>();

    let globalIndex = 1;
    for (const file of files.value) {
      const filePages: number[] = [];
      for (let page = 1; page <= file.pages; page++) {
        if (selectedPages.value.has(globalIndex)) {
          filePages.push(page);
        }
        globalIndex++;
      }
      if (filePages.length > 0) {
        pagesByFile.set(file.id, filePages);
      }
    }

    // If user wants merged output and has multiple pages selected
    if (splitMergeOption.value === 'merged' && selectedPages.value.size > 1) {
      // Create individual page blobs first
      const allPageBlobs: Blob[] = [];
      const selectedPageInfo: string[] = [];

      for (const [fileId, pages] of pagesByFile) {
        const file = files.value.find((f) => f.id === fileId);
        if (file) {
          const ranges = pages.map((p) => ({ start: p, end: p }));
          const splitBlobs = await splitPDF(fileId, ranges);

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

        downloadBlob(mergedBlob, filename);
      }
    } else {
      // Create separate files for each page (original behavior)
      for (const [fileId, pages] of pagesByFile) {
        const file = files.value.find((f) => f.id === fileId);
        if (file) {
          const ranges = pages.map((p) => ({ start: p, end: p }));
          const splitBlobs = await splitPDF(fileId, ranges);

          splitBlobs.forEach((blob, index) => {
            const filename =
              pages.length === 1
                ? `${file.name.replace('.pdf', '')}_page_${pages[index]}.pdf`
                : `${file.name.replace('.pdf', '')}_pages_${pages.join('-')}.pdf`;
            downloadBlob(blob, filename);
          });
        }
      }
    }
  } catch (error) {}
};

const handleRemoveSelected = async () => {
  if (selectedPages.value.size === 0) return;

  try {
    // Group selected pages by file
    const pagesByFile = new Map<string, number[]>();

    let globalIndex = 1;
    for (const file of files.value) {
      const filePages: number[] = [];
      for (let page = 1; page <= file.pages; page++) {
        if (selectedPages.value.has(globalIndex)) {
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
      const file = files.value.find((f) => f.id === fileId);
      if (file) {
        const resultBlob = await removePages(fileId, pagesToRemove);
        const filename = `${file.name.replace('.pdf', '')}_removed_pages.pdf`;
        downloadBlob(resultBlob, filename);
      }
    }
  } catch (error) {}
};

const handleMerge = async (fileIds: string[]) => {
  try {
    const mergedBlob = await mergePDFs(fileIds);
    downloadBlob(mergedBlob, 'merged.pdf');
  } catch (error) {}
};
</script>
