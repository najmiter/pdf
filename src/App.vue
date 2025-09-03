<template>
  <div class="min-h-svh bg-background">
    <!-- Header -->
    <header class="border-b bg-background/90 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2 cursor-default select-none">
            <img src="/icon.svg" width="24" height="24" alt="pdf tools logo" />
            <h1 class="text-2xl font-medium font-main">PdfRizz</h1>
          </div>
          <div class="flex items-center space-x-4">
            <div v-if="files.length > 0" class="text-sm text-muted-foreground">
              {{ files.length }} file{{ files.length === 1 ? '' : 's' }} • {{ totalPages }} page{{
                totalPages === 1 ? '' : 's'
              }}
            </div>
            <div class="flex gap-2 items-center">
              <a
                v-if="repoStarsCount"
                title="Star this project on GitHub"
                href="https://github.com/najmiter/pdf"
                target="_blank">
                <Button variant="soft" size="sm" class="h-9">
                  <span class="sr-only">Stars</span>
                  <span class="text-xs">{{ repoStarsCount }}</span>
                  <Icon icon="lucide:github" class="h-4 w-4" />
                  <span class="sr-only">Github</span>
                </Button>
              </a>
              <Button variant="soft" size="icon" @click="toggleDarkMode" class="w-9 h-9">
                <Icon :icon="isDark ? 'lucide:sun' : 'lucide:moon'" class="h-4 w-4" />
                <span class="sr-only">Toggle theme</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="flex h-[calc(100vh-73px)]">
      <!-- Main Content Area -->
      <main
        class="flex-1 p-6 overflow-auto"
        @dragover.prevent="handleDragOver"
        @dragenter.prevent="handleDragEnter"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop">
        <!-- Drop Zone (shown when no files) -->
        <div v-if="files.length === 0" class="h-full flex items-center justify-center">
          <DropZone
            :isProcessing="isProcessing"
            @files-selected="handleFilesSelected"
            class="w-full h-full grid place-content-center" />
        </div>

        <!-- PDF Pages Grid -->
        <div v-else class="space-y-6">
          <!-- File Management -->
          <div class="flex items-center justify-between">
            <div class="flex items-center flex-wrap gap-2">
              <Button variant="soft" type="button" aria-label="add more files" @click="addMoreFiles">
                <Icon icon="lucide:plus" class="h-4 w-4" />
                Add More Files
              </Button>
              <Button variant="soft" type="button" aria-label="clear all files" @click="clearAllFiles">
                <Icon icon="lucide:trash-2" class="h-4 w-4" />
                Clear All
              </Button>
              <Button
                variant="soft"
                type="button"
                aria-label="select all pages"
                @click="selectAllPages"
                :disabled="files.length === 0">
                <Icon icon="lucide:mouse-pointer-click" class="h-4 w-4" />
                Select All Pages
              </Button>
              <Button
                variant="soft"
                type="button"
                aria-label="clear page selection"
                @click="clearPageSelection"
                :disabled="selectedPages.size === 0">
                <Icon icon="lucide:x" class="h-4 w-4" />
                Clear Selection
              </Button>
            </div>
          </div>

          <!-- Pages by File -->
          <div class="space-y-4">
            <DraggableFileCard
              v-for="(file, index) in orderedFiles"
              :key="file.id"
              :file="file"
              :isFirstFile="index === 0"
              :showPreview="filePreviewStates[file.id]?.showPreview ?? index === 0"
              :selectedPages="selectedPages"
              :getGlobalPageIndex="getGlobalPageIndex"
              @remove="removeFile(file.id)"
              @select="(pageNum) => togglePageSelection(file.id, pageNum)"
              @togglePreview="toggleFilePreview(file.id)"
              @dragStart="handleDragStart"
              @dragEnd="handleDragEnd"
              @drop="handleFileDrop"
              @rangeSelect="handleRangeSelect"
              @rangeClear="handleRangeClear" />
          </div>
        </div>
      </main>

      <!-- Right Sidebar - Tools Panel -->
      <ToolsPanel
        v-if="files.length > 0"
        :files="files"
        :isProcessing="isProcessing"
        :selectedPages="selectedPages"
        :mergePDFs="mergePDFs"
        :splitPDF="splitPDF"
        :removePages="removePages"
        :insertPDF="insertPDF"
        :convertToImages="convertToImages"
        :downloadBlob="downloadBlob"
        @progress="handleProgress" />
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

  <!-- Loading Overlay -->
  <LoadingOverlay
    v-if="isProcessing"
    :title="getLoadingTitle()"
    :message="getLoadingMessage()"
    :progress="processingProgress"
    :currentStep="processingStep"
    :cancellable="false" />

  <!-- Dragging overlay -->
  <DraggingOverlay :isVisible="isDragging" />
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue';
import { Icon } from '@iconify/vue';
import { usePDFTools, type PDFFile } from '@/composables/usePDFTools';
import { useDarkMode } from '@/composables/useDarkMode';
import { useFilePreviews } from '@/composables/useFilePreviews';
import DropZone from '@/components/DropZone.vue';
import DraggableFileCard from '@/components/DraggableFileCard.vue';
import ToolsPanel from '@/components/ToolsPanel.vue';
import LoadingOverlay from '@/components/LoadingOverlay.vue';
import Button from '@/components/ui/Button.vue';
import DraggingOverlay from './components/DraggingOverlay.vue';

const {
  files,
  selectedPages,
  isProcessing,
  currentTool,
  processingProgress,
  processingStep,
  totalPages,
  addFiles,
  removeFile,
  mergePDFs,
  splitPDF,
  removePages,
  insertPDF,
  convertToImages,
  downloadBlob,
} = usePDFTools();

const { isDark, toggleDarkMode } = useDarkMode();
const {
  initializeFilePreview,
  togglePreview,
  reorderFiles,
  removeFile: removeFilePreview,
  getOrderedFileIds,
  filePreviewStates,
} = useFilePreviews();

const fileInputRef = ref<HTMLInputElement>();
const isDragging = ref(false);
const isCardReordering = ref(false);
const dragCounter = ref(0);
const repoStarsCount = ref<string | null>(null);

onMounted(async () => {
  try {
    const response = await fetch('https://api.github.com/repos/najmiter/pdf');
    const data = await response.json();
    repoStarsCount.value = Intl.NumberFormat('en-us', { notation: 'compact' }).format(data.stargazers_count);
  } catch {}
});

watch(
  files,
  (newFiles: PDFFile[], oldFiles) => {
    newFiles.forEach((file: PDFFile, index: number) => {
      const isNewFile = !oldFiles?.some((oldFile: PDFFile) => oldFile.id === file.id);
      console.log('isNewFile', isNewFile, file.id, newFiles === oldFiles);
      if (isNewFile) {
        initializeFilePreview(file.id, index === 0);
      }
    });

    oldFiles?.forEach((oldFile: PDFFile) => {
      const stillExists = newFiles.some((file: PDFFile) => file.id === oldFile.id);
      if (!stillExists) {
        removeFilePreview(oldFile.id);
      }
    });
  },
  { deep: true }
);

const orderedFiles = computed(() => {
  const orderedIds = getOrderedFileIds();
  if (orderedIds.length === 0) {
    return files.value;
  }
  const fileMap = new Map(files.value.map((file) => [file.id, file]));
  return orderedIds.map((id) => fileMap.get(id)).filter((file): file is PDFFile => Boolean(file));
});

const handleFilesSelected = async (fileList: FileList | File[]) => {
  await addFiles(fileList);
};

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault();

  if (isCardReordering.value) {
    return;
  }

  dragCounter.value++;
  if (dragCounter.value === 1) {
    isDragging.value = true;
  }
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
};

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();

  if (isCardReordering.value) {
    return;
  }

  if (event.relatedTarget && (event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) {
    return;
  }
  dragCounter.value = Math.max(0, dragCounter.value - 1);
  if (dragCounter.value === 0) {
    isDragging.value = false;
  }
};

const handleDrop = async (event: DragEvent) => {
  if (isCardReordering.value) {
    return;
  }

  isDragging.value = false;
  dragCounter.value = 0;
  const droppedFiles = Array.from(event.dataTransfer?.files || []);
  const pdfFiles = droppedFiles.filter((file) => file.type === 'application/pdf');
  if (pdfFiles.length > 0) {
    await addFiles(pdfFiles);
  }
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
  files.value.forEach((file) => {
    if (file.url) {
      URL.revokeObjectURL(file.url);
    }
  });

  files.value = [];
  selectedPages.value.clear();
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

const handleProgress = (progress: number, step: string) => {
  processingProgress.value = progress;
  processingStep.value = step;
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

const getLoadingTitle = () => {
  switch (currentTool.value) {
    case 'convert':
      return 'Converting to Images';
    case 'merge':
      return 'Merging PDFs';
    case 'split':
      return 'Splitting PDF';
    case 'remove':
      return 'Removing Pages';
    default:
      return 'Processing...';
  }
};

const getLoadingMessage = () => {
  switch (currentTool.value) {
    case 'convert':
      return 'Converting selected pages to high-quality images';
    case 'merge':
      return 'Combining all PDF files into one document';
    case 'split':
      return 'Extracting selected pages into separate files';
    case 'remove':
      return 'Removing selected pages from the document';
    default:
      return 'Please wait while we process your files';
  }
};

const toggleFilePreview = (fileId: string) => {
  console.log('toggleFilePreview', fileId);
  togglePreview(fileId);
};

const handleDragStart = () => {
  isCardReordering.value = true;
};

const handleDragEnd = () => {
  isCardReordering.value = false;
};

const handleFileDrop = (draggedFileId: string, targetFileId: string) => {
  const draggedIndex = files.value.findIndex((f) => f.id === draggedFileId);
  const targetIndex = files.value.findIndex((f) => f.id === targetFileId);

  if (draggedIndex !== -1 && targetIndex !== -1) {
    const newFiles = [...files.value];
    const [draggedFile] = newFiles.splice(draggedIndex, 1);
    newFiles.splice(targetIndex, 0, draggedFile);
    files.value = newFiles;

    reorderFiles(draggedFileId, targetIndex);
  }
};

const handleRangeSelect = (pagesToSelect: number[]) => {
  pagesToSelect.forEach((pageNum) => {
    selectedPages.value.add(pageNum);
  });
};

const handleRangeClear = () => {};
</script>
