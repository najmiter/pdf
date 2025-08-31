<template>
  <Sheet :open="isOpen" @close="$emit('close')">
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold">PDF Tools</h2>
        <Button variant="ghost" size="icon" @click="$emit('close')">
          <Icon icon="lucide:x" class="h-4 w-4" />
        </Button>
      </div>

      <!-- Tool Selection -->
      <div v-if="!selectedTool" class="space-y-3">
        <div
          v-for="tool in availableTools"
          :key="tool.id"
          class="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
          @click="selectTool(tool.id)">
          <div class="flex items-center space-x-3">
            <Icon :icon="tool.icon" class="h-5 w-5 text-primary" />
            <div>
              <h3 class="font-medium">{{ tool.name }}</h3>
              <p class="text-sm text-muted-foreground">{{ tool.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tool Interface -->
      <div v-else class="flex-1 flex flex-col">
        <!-- Back Button -->
        <Button variant="ghost" class="mb-4 self-start" @click="selectedTool = null">
          <Icon icon="lucide:arrow-left" class="mr-2 h-4 w-4" />
          Back to Tools
        </Button>

        <!-- Merge Tool -->
        <div v-if="selectedTool === 'merge'" class="space-y-4">
          <h3 class="font-semibold">Merge PDFs</h3>
          <p class="text-sm text-muted-foreground">Select files to merge in order:</p>

          <div class="space-y-2">
            <div v-for="file in files" :key="file.id" class="flex items-center space-x-3 p-3 border rounded">
              <input
                type="checkbox"
                :id="file.id"
                v-model="selectedFiles"
                :value="file.id"
                class="rounded border-gray-300" />
              <label :for="file.id" class="flex-1 text-sm">{{ file.name }}</label>
              <span class="text-xs text-muted-foreground">{{ file.pages }} pages</span>
            </div>
          </div>

          <Button @click="handleMerge" :disabled="selectedFiles.length < 2 || isProcessing" class="w-full">
            <Icon icon="lucide:download" class="mr-2 h-4 w-4" />
            Download Merged PDF
          </Button>
        </div>

        <!-- Split Tool -->
        <div v-if="selectedTool === 'split'" class="space-y-4">
          <h3 class="font-semibold">Split PDF</h3>
          <p class="text-sm text-muted-foreground">Select a file and specify page ranges:</p>

          <select v-model="selectedFileForSplit" class="w-full p-2 border rounded">
            <option value="">Select a file</option>
            <option v-for="file in files" :key="file.id" :value="file.id">
              {{ file.name }} ({{ file.pages }} pages)
            </option>
          </select>

          <div class="space-y-2">
            <label class="text-sm font-medium">Page Ranges (e.g., 1-5, 7, 10-12):</label>
            <input
              v-model="pageRanges"
              type="text"
              placeholder="1-5, 7, 10-12"
              class="w-full p-2 border rounded text-sm" />
            <p class="text-xs text-muted-foreground">
              Use commas to separate ranges. Examples: "1-5" for pages 1 to 5, "1,3,5" for individual pages
            </p>
          </div>

          <Button @click="handleSplit" :disabled="!selectedFileForSplit || !pageRanges || isProcessing" class="w-full">
            <Icon icon="lucide:scissors" class="mr-2 h-4 w-4" />
            Split PDF
          </Button>
        </div>

        <!-- Remove Pages Tool -->
        <div v-if="selectedTool === 'remove'" class="space-y-4">
          <h3 class="font-semibold">Remove Pages</h3>
          <p class="text-sm text-muted-foreground">Select a file and specify pages to remove:</p>

          <select v-model="selectedFileForRemove" class="w-full p-2 border rounded">
            <option value="">Select a file</option>
            <option v-for="file in files" :key="file.id" :value="file.id">
              {{ file.name }} ({{ file.pages }} pages)
            </option>
          </select>

          <div class="space-y-2">
            <label class="text-sm font-medium">Pages to Remove (e.g., 1,3,5-7):</label>
            <input
              v-model="pagesToRemove"
              type="text"
              placeholder="1,3,5-7"
              class="w-full p-2 border rounded text-sm" />
          </div>

          <Button
            @click="handleRemovePages"
            :disabled="!selectedFileForRemove || !pagesToRemove || isProcessing"
            class="w-full">
            <Icon icon="lucide:trash-2" class="mr-2 h-4 w-4" />
            Remove Pages
          </Button>
        </div>

        <!-- Rotate Tool -->
        <div v-if="selectedTool === 'rotate'" class="space-y-4">
          <h3 class="font-semibold">Rotate Pages</h3>
          <p class="text-sm text-muted-foreground">Select pages to rotate:</p>

          <div class="text-center text-muted-foreground">
            <p>Click on pages in the main view to select them for rotation</p>
            <div v-if="selectedPageNumbers.length > 0" class="mt-2">
              <span class="text-sm">Selected pages: {{ selectedPageNumbers.join(', ') }}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <Button variant="outline" @click="rotateSelected(90)">
              <Icon icon="lucide:rotate-cw" class="mr-2 h-4 w-4" />
              90° Right
            </Button>
            <Button variant="outline" @click="rotateSelected(-90)">
              <Icon icon="lucide:rotate-ccw" class="mr-2 h-4 w-4" />
              90° Left
            </Button>
            <Button variant="outline" @click="rotateSelected(180)">
              <Icon icon="lucide:rotate-cw" class="mr-2 h-4 w-4" />
              180°
            </Button>
            <Button variant="outline" @click="clearSelection">
              <Icon icon="lucide:x" class="mr-2 h-4 w-4" />
              Clear
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
  </Sheet>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import Sheet from '@/components/ui/Sheet.vue';
import Button from '@/components/ui/Button.vue';
import type { PDFFile } from '@/composables/usePDFTools';

interface Props {
  isOpen: boolean;
  files: PDFFile[];
  isProcessing: boolean;
  selectedPageNumbers: number[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  merge: [fileIds: string[]];
  split: [fileId: string, ranges: string];
  removePages: [fileId: string, pages: string];
  rotatePages: [pages: number[], rotation: number];
  clearSelection: [];
}>();

const selectedTool = ref<string | null>(null);
const selectedFiles = ref<string[]>([]);
const selectedFileForSplit = ref('');
const selectedFileForRemove = ref('');
const pageRanges = ref('');
const pagesToRemove = ref('');

const availableTools = [
  {
    id: 'merge',
    name: 'Merge PDFs',
    description: 'Combine multiple PDF files into one',
    icon: 'lucide:file-plus',
  },
  {
    id: 'split',
    name: 'Split PDF',
    description: 'Split a PDF into multiple files by page ranges',
    icon: 'lucide:scissors',
  },
  {
    id: 'remove',
    name: 'Remove Pages',
    description: 'Remove specific pages from a PDF',
    icon: 'lucide:trash-2',
  },
  {
    id: 'rotate',
    name: 'Rotate Pages',
    description: 'Rotate selected pages',
    icon: 'lucide:rotate-cw',
  },
];

const selectTool = (toolId: string) => {
  selectedTool.value = toolId;
  // Reset tool-specific selections
  selectedFiles.value = [];
  selectedFileForSplit.value = '';
  selectedFileForRemove.value = '';
  pageRanges.value = '';
  pagesToRemove.value = '';
};

const handleMerge = () => {
  emit('merge', selectedFiles.value);
};

const handleSplit = () => {
  emit('split', selectedFileForSplit.value, pageRanges.value);
};

const handleRemovePages = () => {
  emit('removePages', selectedFileForRemove.value, pagesToRemove.value);
};

const rotateSelected = (rotation: number) => {
  emit('rotatePages', props.selectedPageNumbers, rotation);
};

const clearSelection = () => {
  emit('clearSelection');
};
</script>
