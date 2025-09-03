<template>
  <div
    ref="cardRef"
    :class="[
      'relative p-4 bg-muted/50 rounded-lg border-2 transition-all duration-200 cursor-move',
      isDragging ? 'border-primary shadow-lg scale-105' : 'border-transparent hover:border-muted-foreground/20',
      isDragOver ? 'border-dashed border-primary bg-primary/5' : '',
    ]"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop">
    <!-- File Info -->
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center space-x-3 pr-12">
        <Icon icon="lucide:file-text" class="h-5 w-5 text-primary flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <h3 class="font-medium truncate" :title="file.name">{{ file.name }}</h3>
          <p class="text-sm text-muted-foreground">{{ file.pages }} pages • {{ formatFileSize(file.size) }}</p>
        </div>
      </div>
      <!-- Drag Handle -->
      <div class="p-2">
        <Icon icon="lucide:grip-vertical" class="h-4 w-4 text-muted-foreground" />
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center justify-between mt-3 pt-3 border-t border-t-foreground/10">
      <div class="flex items-center space-x-2">
        <!-- Preview Toggle Button -->
        <Button variant="soft" size="sm" @click.stop="togglePreview" class="h-8 px-2">
          <Icon :icon="showPreview ? 'lucide:eye-off' : 'lucide:eye'" class="h-4 w-4 mr-1" />
          <span class="text-xs">{{ showPreview ? 'Hide' : 'Show' }} Preview</span>
        </Button>

        <!-- Page Range Selector Button -->
        <Button variant="soft" size="sm" @click.stop="toggleRangeSelector" class="h-8 px-2">
          <Icon icon="lucide:list" class="h-4 w-4 mr-1" />
          <span class="text-xs">Select Range</span>
        </Button>
      </div>

      <!-- Remove Button -->
      <Button variant="ghost" size="sm" @click.stop="$emit('remove')" class="h-8 w-8 p-0">
        <Icon icon="lucide:x" class="h-4 w-4" />
      </Button>
    </div>

    <!-- Page Range Selector -->
    <div v-if="showRangeSelector" class="mt-3 p-3 border rounded-lg bg-muted/30">
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">Select Pages</span>
          <Button variant="ghost" size="sm" @click="showRangeSelector = false" class="h-6 w-6 p-0">
            <Icon icon="lucide:x" class="h-3 w-3" />
          </Button>
        </div>

        <div class="flex items-start justify-between gap-2">
          <div class="space-y-2 flex-1">
            <input
              v-model="rangeInput"
              type="text"
              placeholder="e.g., 1-5,8,10-15"
              class="w-full px-2 py-1 border border-input bg-background rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              @keydown.enter="applyRangeSelection"
              @input="validateRange" />
            <p class="text-xs text-muted-foreground">Enter page ranges separated by commas (e.g., 1-5,8,10-15)</p>
            <div v-if="rangeError" class="text-xs text-red-600">
              {{ rangeError }}
            </div>
          </div>
          <div class="flex gap-2">
            <Button
              type="button"
              @click="applyRangeSelection"
              :disabled="!rangeInput.trim() || !!rangeError"
              class="flex-1 text-xs"
              size="sm">
              Select Pages
            </Button>
            <Button type="button" @click="clearRangeSelection" variant="soft" class="flex-1 text-xs" size="sm">
              Clear
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Section -->
    <div v-if="showPreview" class="mt-4">
      <LazyPDFPageGrid
        :fileId="file.id"
        :fileName="file.name"
        :pdfUrl="file.url"
        :totalPages="file.pages"
        :selectedPages="selectedPages"
        :getGlobalPageIndex="getGlobalPageIndex"
        @select="(pageNum) => $emit('select', pageNum)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import Button from '@/components/ui/Button.vue';
import LazyPDFPageGrid from '@/components/LazyPDFPageGrid.vue';

interface PDFFile {
  id: string;
  name: string;
  file: File;
  url: string;
  pages: number;
  size: number;
}

interface Props {
  file: PDFFile;
  isFirstFile: boolean;
  showPreview: boolean;
  selectedPages: Set<number>;
  getGlobalPageIndex: (fileId: string, pageNumber: number) => number;
  dragData?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  remove: [];
  select: [pageNumber: number];
  togglePreview: [];
  dragStart: [fileId: string];
  dragEnd: [fileId: string];
  drop: [draggedFileId: string, targetFileId: string];
  rangeSelect: [selectedPages: number[]];
  rangeClear: [];
}>();

const cardRef = ref<HTMLElement>();
const isDragging = ref(false);
const isDragOver = ref(false);
const showRangeSelector = ref(false);
const rangeInput = ref('');
const rangeError = ref('');

const handleDragStart = (event: DragEvent) => {
  if (!cardRef.value) return;

  isDragging.value = true;
  event.dataTransfer!.effectAllowed = 'move';
  event.dataTransfer!.setData('text/plain', props.file.id);

  cardRef.value.style.opacity = '0.5';

  emit('dragStart', props.file.id);
};

const handleDragEnd = () => {
  if (!cardRef.value) return;

  isDragging.value = false;
  cardRef.value.style.opacity = '1';

  emit('dragEnd', props.file.id);
};

const handleDragOver = () => {
  if (!isDragging.value) {
    isDragOver.value = true;
  }
};

const handleDragLeave = (event: DragEvent) => {
  if (event.relatedTarget && !cardRef.value?.contains(event.relatedTarget as Node)) {
    isDragOver.value = false;
  }
};

const handleDrop = (event: DragEvent) => {
  isDragOver.value = false;

  const draggedFileId = event.dataTransfer!.getData('text/plain');
  if (draggedFileId && draggedFileId !== props.file.id) {
    emit('drop', draggedFileId, props.file.id);
  }
};

const togglePreview = () => {
  emit('togglePreview');
};

const toggleRangeSelector = () => {
  showRangeSelector.value = !showRangeSelector.value;
  if (showRangeSelector.value) {
    rangeInput.value = '';
    rangeError.value = '';
  }
};

const validateRange = () => {
  const input = rangeInput.value.trim();
  if (!input) {
    rangeError.value = '';
    return;
  }

  try {
    const ranges = parsePageRange(input);
    const validRanges = ranges.filter(
      (range) => range.start >= 1 && range.end <= props.file.pages && range.start <= range.end
    );

    if (validRanges.length !== ranges.length) {
      rangeError.value = `Some page numbers are out of range (1-${props.file.pages})`;
    } else {
      rangeError.value = '';
    }
  } catch (error) {
    rangeError.value = 'Invalid format. Use numbers, commas, and hyphens (e.g., 1-5,8,10-15)';
  }
};

const parsePageRange = (range: string) => {
  const ranges: { start: number; end: number }[] = [];
  const parts = range.split(',').map((p) => p.trim());

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map((n) => parseInt(n.trim()));
      if (isNaN(start) || isNaN(end)) {
        throw new Error('Invalid range format');
      }
      ranges.push({ start, end });
    } else {
      const page = parseInt(part);
      if (isNaN(page)) {
        throw new Error('Invalid page number');
      }
      ranges.push({ start: page, end: page });
    }
  }

  return ranges;
};

const applyRangeSelection = () => {
  if (!rangeInput.value.trim() || rangeError.value) return;

  try {
    const ranges = parsePageRange(rangeInput.value);
    const selectedPages: number[] = [];

    for (const range of ranges) {
      for (let page = range.start; page <= range.end; page++) {
        const globalIndex = props.getGlobalPageIndex(props.file.id, page);
        selectedPages.push(globalIndex);
      }
    }

    emit('rangeSelect', selectedPages);
    showRangeSelector.value = false;
    rangeInput.value = '';
    rangeError.value = '';
  } catch (error) {
    rangeError.value = 'Error applying selection';
  }
};

const clearRangeSelection = () => {
  rangeInput.value = '';
  rangeError.value = '';
  emit('rangeClear');
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
</script>
