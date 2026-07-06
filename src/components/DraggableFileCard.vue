<template>
  <div
    ref="cardRef"
    :class="[
      'relative rounded-2xl border bg-card p-4 shadow-sm transition-all duration-200 cursor-move',
      isDragging
        ? 'border-primary/60 bg-primary/5 scale-[1.01] shadow-lg'
        : 'border-border/70 hover:border-primary/30 hover:shadow-md',
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
      <div class="flex min-w-0 items-center gap-3">
        <div class="grid h-10 w-10 shrink-0 place-content-center rounded-xl bg-primary/12 ring-1 ring-primary/20">
          <Icon icon="lucide:file-text" class="h-5 w-5 text-primary" />
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="truncate text-sm font-semibold" :title="file.name">{{ file.name }}</h3>
          <p class="mt-0.5 text-xs text-muted-foreground">
            {{ file.pages }} {{ file.pages === 1 ? 'page' : 'pages' }}
            <span class="mx-1 text-border">•</span>
            {{ formatFileSize(file.size) }}
          </p>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-1">
        <!-- Preview Toggle Button -->
        <Button
          variant="ghost"
          size="sm"
          @click.stop="togglePreview"
          class="h-8 gap-1.5 px-2.5 text-muted-foreground hover:text-foreground"
          :title="`${showPreview ? 'Hide' : 'Show'} page previews`">
          <Icon :icon="showPreview ? 'lucide:eye-off' : 'lucide:eye'" class="h-4 w-4" />
          <span class="hidden text-xs sm:inline">Preview</span>
        </Button>

        <!-- Page Range Selector Button -->
        <Button
          variant="ghost"
          size="sm"
          @click.stop="toggleRangeSelector"
          class="h-8 gap-1.5 px-2.5 text-muted-foreground hover:text-foreground"
          title="Select a range of pages">
          <Icon icon="lucide:list" class="h-4 w-4" />
          <span class="hidden text-xs sm:inline">Range</span>
        </Button>

        <!-- Remove Button -->
        <Button
          variant="ghost"
          size="sm"
          @click.stop="$emit('remove')"
          class="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Remove file">
          <Icon icon="lucide:x" class="h-4 w-4" />
        </Button>

        <!-- Drag Handle -->
        <div class="p-1.5 text-muted-foreground/50">
          <Icon icon="lucide:grip-vertical" class="h-4 w-4" />
        </div>
      </div>
    </div>

    <!-- Page Range Selector -->
    <div v-if="showRangeSelector" class="mt-3 rounded-xl border border-border/70 bg-muted/40 p-3 animate-fade-in">
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Select page range</span>
          <Button variant="ghost" size="sm" @click="showRangeSelector = false" class="h-6 w-6 p-0">
            <Icon icon="lucide:x" class="h-3 w-3" />
          </Button>
        </div>

        <div class="flex flex-wrap items-start gap-2">
          <div class="min-w-48 flex-1 space-y-1.5">
            <input
              v-model="rangeInput"
              type="text"
              placeholder="e.g., 1-5,8,10-15"
              class="h-9 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-xs transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/60"
              @keydown.enter="applyRangeSelection"
              @input="validateRange" />
            <p v-if="rangeError" class="flex items-center gap-1 text-xs text-destructive">
              <Icon icon="lucide:alert-circle" class="h-3 w-3" />
              {{ rangeError }}
            </p>
            <p v-else class="text-xs text-muted-foreground">Comma-separated pages or ranges</p>
          </div>
          <div class="flex gap-2">
            <Button type="button" @click="applyRangeSelection" :disabled="!rangeInput.trim() || !!rangeError" size="sm">
              Select
            </Button>
            <Button type="button" @click="clearRangeSelection" variant="soft" size="sm"> Clear </Button>
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
  selectedPages: Set<string>;
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
  rangeSelect: [fileId: string, selectedPages: number[]];
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
      (range) => range.start >= 1 && range.end <= props.file.pages && range.start <= range.end,
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
        selectedPages.push(page);
      }
    }

    emit('rangeSelect', props.file.id, selectedPages);
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
