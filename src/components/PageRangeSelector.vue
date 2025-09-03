<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <label for="pageRange" class="text-sm font-medium">Page Range</label>
      <input
        id="pageRange"
        v-model="pageRangeInput"
        type="text"
        placeholder="e.g., 1-5,8,10-15"
        class="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        @input="validateAndParseRange"
        @keydown.enter="applyRangeSelection" />
      <p class="text-xs text-muted-foreground">
        Enter page ranges separated by commas. Use hyphens for ranges (e.g., 1-5,8,10-15).
      </p>
      <div v-if="validationError" class="text-xs text-red-600">
        {{ validationError }}
      </div>
    </div>

    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium">Preview Selection</span>
        <span class="text-xs text-muted-foreground">{{ selectedPagesCount }} pages selected</span>
      </div>
      <div class="max-h-32 overflow-y-auto border rounded-md p-2 bg-muted/30">
        <div v-if="parsedRanges.length === 0" class="text-xs text-muted-foreground">No pages selected</div>
        <div v-else class="space-y-1">
          <div v-for="range in parsedRanges" :key="`${range.start}-${range.end}`" class="text-xs">
            Pages {{ range.start }} - {{ range.end }}
          </div>
        </div>
      </div>
    </div>

    <div class="flex gap-2">
      <Button
        type="button"
        @click="applyRangeSelection"
        :disabled="!pageRangeInput.trim() || !!validationError"
        class="flex-1">
        <Icon icon="lucide:check" class="mr-2 h-4 w-4" />
        Select Pages
      </Button>
      <Button type="button" @click="clearSelection" variant="outline" class="flex-1">
        <Icon icon="lucide:x" class="mr-2 h-4 w-4" />
        Clear
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Icon } from '@iconify/vue';
import Button from '@/components/ui/Button.vue';

interface PageRange {
  start: number;
  end: number;
}

interface Props {
  totalPages: number;
  currentSelection: Set<number>;
  onSelectionChange: (pages: number[]) => void;
}

const props = defineProps<Props>();

const pageRangeInput = ref('');
const validationError = ref('');
const parsedRanges = ref<PageRange[]>([]);

const selectedPagesCount = computed(() => {
  return parsedRanges.value.reduce((sum, range) => sum + (range.end - range.start + 1), 0);
});

const validateAndParseRange = () => {
  const input = pageRangeInput.value.trim();
  if (!input) {
    validationError.value = '';
    parsedRanges.value = [];
    return;
  }

  try {
    const ranges = parsePageRange(input);
    const validRanges = ranges.filter(
      (range) => range.start >= 1 && range.end <= props.totalPages && range.start <= range.end
    );

    if (validRanges.length !== ranges.length) {
      validationError.value = 'Some page numbers are out of range (1-' + props.totalPages + ')';
    } else {
      validationError.value = '';
    }

    parsedRanges.value = validRanges;
  } catch (error) {
    validationError.value = 'Invalid format. Use numbers, commas, and hyphens (e.g., 1-5,8,10-15)';
    parsedRanges.value = [];
  }
};

const parsePageRange = (range: string): PageRange[] => {
  const ranges: PageRange[] = [];
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
  if (validationError.value || parsedRanges.value.length === 0) return;

  const selectedPages: number[] = [];
  for (const range of parsedRanges.value) {
    for (let page = range.start; page <= range.end; page++) {
      selectedPages.push(page);
    }
  }

  props.onSelectionChange(selectedPages);
};

const clearSelection = () => {
  pageRangeInput.value = '';
  parsedRanges.value = [];
  validationError.value = '';
  props.onSelectionChange([]);
};

watch(
  () => props.currentSelection,
  () => {
    // Update input based on current selection if needed
    // This could be enhanced to show current selection as range string
  },
  { deep: true }
);
</script>
