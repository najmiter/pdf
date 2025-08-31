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
          <div class="flex items-center space-x-4">
            <div v-if="files.length > 0" class="text-sm text-muted-foreground">
              {{ files.length }} file{{ files.length === 1 ? '' : 's' }} • {{ totalPages }} page{{
                totalPages === 1 ? '' : 's'
              }}
            </div>
            <div class="flex gap-2 items-center">
              <Button variant="ghost" size="icon" @click="toggleDarkMode" class="w-9 h-9">
                <Icon :icon="isDark ? 'lucide:sun' : 'lucide:moon'" class="h-4 w-4" />
                <span class="sr-only">Toggle theme</span>
              </Button>
              <a href="https://github.com/najmiter/pdf" target="_blank">
                <Button variant="ghost" size="icon" class="w-9 h-9">
                  <Icon icon="lucide:github" class="h-4 w-4" />
                  <span class="sr-only">Github</span>
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="flex h-[calc(100vh-73px)]">
      <!-- Main Content Area -->
      <main class="flex-1 p-6 overflow-auto">
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
            <div class="flex flex-wrap gap-4">
              <PDFPagePreview
                v-for="pageNum in file.pages"
                :key="`${file.id}-${pageNum}`"
                :pageNumber="pageNum"
                :fileName="file.name"
                :pdfUrl="file.url"
                :isSelected="selectedPages.has(getGlobalPageIndex(file.id, pageNum))"
                @select="togglePageSelection(file.id, pageNum)" />
            </div>
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
        :downloadBlob="downloadBlob"
        @selectAll="selectAllPages"
        @clearSelection="clearPageSelection" />
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
import { useDarkMode } from '@/composables/useDarkMode';
import DropZone from '@/components/DropZone.vue';
import PDFPagePreview from '@/components/PDFPagePreview.vue';
import ToolsPanel from '@/components/ToolsPanel.vue';
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

const { isDark, toggleDarkMode } = useDarkMode();

const fileInputRef = ref<HTMLInputElement>();

// Auto-open tools panel when files are added
watch(
  files,
  (newFiles) => {
    if (newFiles.length > 0) {
      // Tools panel is always shown when files are present
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
</script>
