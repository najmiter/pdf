<template>
  <div class="flex h-full">
    <!-- Main Content Area -->
    <main
      class="flex-1 p-6 pt-0 overflow-auto"
      @dragover.prevent="handleDragOver"
      @dragenter.prevent="handleDragEnter"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop">
      <!-- Hero + Drop Zone (shown when no files) -->
      <div v-if="files.length === 0" class="flex min-h-full flex-col items-center justify-center py-10">
        <!-- Hero copy -->
        <div class="animate-fade-up mb-8 max-w-2xl text-center">
          <h1 class="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Every PDF tool you need,
            <span class="text-primary">right in your browser</span>
          </h1>
          <p class="mx-auto mt-4 max-w-lg text-pretty text-base text-muted-foreground">
            Merge, split, compress, convert and rearrange PDFs — free, unlimited, and with zero uploads.
          </p>
        </div>

        <DropZone
          :isProcessing="isProcessing"
          :showHints="false"
          @files-selected="handleFilesSelected"
          class="w-full" />

        <!-- Capability grid -->
        <div class="animate-fade-up mt-10 w-full max-w-3xl" style="animation-delay: 120ms">
          <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <component
              :is="cap.route ? 'router-link' : 'button'"
              v-for="cap in capabilities"
              :key="cap.title"
              :to="cap.route"
              type="button"
              class="group flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-md"
              @click="cap.route ? undefined : addMoreFiles()">
              <div
                class="grid h-9 w-9 shrink-0 place-content-center rounded-lg bg-primary/12 ring-1 ring-primary/20 transition-colors duration-200 group-hover:bg-primary/20">
                <Icon :icon="cap.icon" class="h-4.5 w-4.5 text-primary" />
              </div>
              <div class="min-w-0">
                <div class="text-sm font-medium">{{ cap.title }}</div>
                <div class="truncate text-xs text-muted-foreground">{{ cap.description }}</div>
              </div>
            </component>
          </div>
        </div>
      </div>

      <!-- PDF Pages Grid -->
      <div v-else class="space-y-5 animate-fade-in">
        <!-- File Management -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold tracking-tight">
              {{ files.length }} {{ files.length === 1 ? 'file' : 'files' }} loaded
            </h2>
            <p class="text-xs text-muted-foreground mt-0.5">Click pages to select them, drag cards to reorder files</p>
          </div>
          <div class="flex items-center flex-wrap gap-2">
            <Button variant="soft" size="sm" type="button" aria-label="add more files" @click="addMoreFiles">
              <Icon icon="lucide:plus" class="h-4 w-4" />
              Add Files
            </Button>
            <Button
              variant="soft"
              size="sm"
              type="button"
              aria-label="select all pages"
              @click="selectAllPages"
              :disabled="files.length === 0">
              <Icon icon="lucide:mouse-pointer-click" class="h-4 w-4" />
              Select All
            </Button>
            <Button
              variant="soft"
              size="sm"
              type="button"
              aria-label="clear all files"
              class="text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              @click="clearAllFiles">
              <Icon icon="lucide:trash-2" class="h-4 w-4" />
              Clear All
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

      <!-- Floating selection bar -->
      <Transition name="selection-bar">
        <div
          v-if="files.length > 0 && selectedPages.size > 0"
          class="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
          <div
            class="pointer-events-auto flex items-center gap-1 rounded-full border border-border/70 bg-card/95 py-1.5 pl-4 pr-1.5 shadow-lg backdrop-blur-xl">
            <span class="text-sm font-medium tabular-nums">
              {{ selectedPages.size }} {{ selectedPages.size === 1 ? 'page' : 'pages' }} selected
            </span>
            <div class="mx-2 h-4 w-px bg-border" />
            <Button variant="ghost" size="sm" class="h-7 rounded-full px-3 text-xs" @click="selectAllPages">
              Select all
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="h-7 rounded-full px-3 text-xs text-muted-foreground"
              @click="clearPageSelection">
              <Icon icon="lucide:x" class="h-3.5 w-3.5" />
              Deselect
            </Button>
          </div>
        </div>
      </Transition>
    </main>

    <!-- Right Sidebar - Tools Panel -->
    <ToolsPanel
      v-if="files.length > 0"
      :files="files"
      :isProcessing="isProcessing"
      :selectedPages="selectedPages"
      :mergePDFs="mergePDFs"
      :extractPages="extractPages"
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

const capabilities = [
  { title: 'Merge', description: 'Combine files into one', icon: 'lucide:file-plus' },
  { title: 'Split', description: 'Extract pages into new files', icon: 'lucide:scissors' },
  { title: 'Compress', description: 'Shrink PDF file size', icon: 'lucide:zap', route: '/compress' },
  { title: 'Convert', description: 'Pages to PNG or JPEG', icon: 'lucide:image' },
  { title: 'Remove pages', description: 'Delete unwanted pages', icon: 'lucide:trash-2' },
  { title: 'Insert', description: 'Place one PDF in another', icon: 'lucide:plus' },
] as { title: string; description: string; icon: string; route?: string }[];

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
  extractPages,
  removePages,
  insertPDF,
  convertToImages,
  downloadBlob,
  cleanup,
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

watch(files, (newFiles: PDFFile[], oldFiles) => {
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
});

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
  cleanup();
};

const togglePageSelection = (fileId: string, pageNumber: number) => {
  const key = `${fileId}:${pageNumber}`;

  if (selectedPages.value.has(key)) {
    selectedPages.value.delete(key);
  } else {
    selectedPages.value.add(key);
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

  for (const file of files.value) {
    for (let page = 1; page <= file.pages; page++) {
      selectedPages.value.add(`${file.id}:${page}`);
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

const handleRangeSelect = (fileId: string, pagesToSelect: number[]) => {
  pagesToSelect.forEach((pageNum) => {
    selectedPages.value.add(`${fileId}:${pageNum}`);
  });
};

const handleRangeClear = () => {};
</script>

<style scoped>
.selection-bar-enter-active,
.selection-bar-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.selection-bar-enter-from,
.selection-bar-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
