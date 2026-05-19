<template>
  <div class="flex h-full">
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
import { ref, watch, computed, defineAsyncComponent } from 'vue';
import { Icon } from '@iconify/vue';
import { usePDFTools, type PDFFile } from '@/composables/usePDFTools';
import { useFilePreviews } from '@/composables/useFilePreviews';
import DropZone from '@/components/DropZone.vue';
import Button from '@/components/ui/Button.vue';
import DraggingOverlay from '@/components/DraggingOverlay.vue';

const DraggableFileCard = defineAsyncComponent(() => import('@/components/DraggableFileCard.vue'));
const ToolsPanel = defineAsyncComponent(() => import('@/components/ToolsPanel.vue'));
const LoadingOverlay = defineAsyncComponent(() => import('@/components/LoadingOverlay.vue'));

const {
  files,
  selectedPages,
  isProcessing,
  currentTool,
  processingProgress,
  processingStep,
  addFiles,
  removeFile,
  mergePDFs,
  splitPDF,
  removePages,
  insertPDF,
  convertToImages,
  downloadBlob,
} = usePDFTools();

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

watch(
  files,
  (newFiles: PDFFile[], oldFiles) => {
    newFiles.forEach((file: PDFFile, index: number) => {
      const isNewFile = !oldFiles?.some((oldFile: PDFFile) => oldFile.id === file.id);
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
